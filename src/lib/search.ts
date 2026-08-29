import type { MealCard, MealType } from '../data/schema';
import { TAG_IDS, TAG_REGISTRY, type TagId } from '../data/tags';

/** NFD-normalize, strip combining marks, lowercase, trim. `sauté` → `saute`. */
export function normalize(s: string): string {
  return s.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().trim();
}

/** Splits a query into normalized, non-empty tokens. */
export function tokenize(q: string): string[] {
  return normalize(q).split(/\s+/).filter(Boolean);
}

/**
 * The searchable text for a card: name, ingredient names/shoppingNames, and
 * tag ids + labels. Steps and cook's notes are deliberately excluded (noise).
 */
export function buildHaystack(card: MealCard): string {
  const parts: string[] = [card.name];
  for (const ing of card.ingredients) {
    parts.push(ing.name);
    if (ing.shoppingName) parts.push(ing.shoppingName);
  }
  for (const tag of card.tags) {
    parts.push(tag, TAG_REGISTRY[tag].label);
  }
  return normalize(parts.join(' \n '));
}

/** Builds a card-id → haystack map once so filtering doesn't re-normalize per keystroke. */
export function buildHaystackMap(cards: MealCard[]): Map<string, string> {
  const map = new Map<string, string>();
  for (const card of cards) map.set(card.id, buildHaystack(card));
  return map;
}

export interface FilterCriteria {
  query: string;
  mealType: MealType | 'all';
  tags: TagId[];
}

function matchesQuery(card: MealCard, tokens: string[], hay?: Map<string, string>): boolean {
  if (tokens.length === 0) return true;
  const text = hay?.get(card.id) ?? buildHaystack(card);
  return tokens.every((t) => text.includes(t));
}

function hasAllTags(card: MealCard, tags: TagId[]): boolean {
  return tags.every((t) => card.tags.includes(t));
}

/** Cards matching every query token (substring) AND the meal type AND all active tags. */
export function filterCards(
  cards: MealCard[],
  c: FilterCriteria,
  hay?: Map<string, string>,
): MealCard[] {
  const tokens = tokenize(c.query);
  return cards.filter(
    (card) =>
      (c.mealType === 'all' || card.mealType === c.mealType) &&
      hasAllTags(card, c.tags) &&
      matchesQuery(card, tokens, hay),
  );
}

export interface FacetCounts {
  /** Per meal type, computed with the mealType axis released; `all` = grand total under query + tags. */
  mealType: Record<MealType | 'all', number>;
  /** Per tag, the number of results if that tag were added to the active tags (under query + mealType). */
  tags: Record<TagId, number>;
}

export function facetCounts(
  cards: MealCard[],
  c: FilterCriteria,
  hay?: Map<string, string>,
): FacetCounts {
  const tokens = tokenize(c.query);
  const base = cards.filter((card) => hasAllTags(card, c.tags) && matchesQuery(card, tokens, hay));

  const mealType: Record<MealType | 'all', number> = {
    all: base.length,
    breakfast: 0,
    lunch: 0,
    dinner: 0,
    snack: 0,
  };
  for (const card of base) mealType[card.mealType]++;

  const scoped = c.mealType === 'all' ? base : base.filter((card) => card.mealType === c.mealType);
  const tags = {} as Record<TagId, number>;
  for (const t of TAG_IDS) tags[t] = 0;
  for (const card of scoped) {
    for (const t of card.tags) tags[t]++;
  }

  return { mealType, tags };
}
