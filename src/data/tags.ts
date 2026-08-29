/**
 * Typed tag registry. Every tag a card may carry must be listed here so a
 * typo fails `tsc` instead of silently creating a new filter chip.
 */

export type TagGroup = 'dietary' | 'cuisine' | 'prep';

export const TAG_IDS = [
  'high-protein',
  'gluten-free',
  'vegetarian',
  'low-sodium',
  'low-fat',
  'mediterranean',
  'seafood',
  'mexican-inspired',
  'no-cook',
  'make-ahead',
  'bedtime-snack',
] as const;

export type TagId = (typeof TAG_IDS)[number];

export interface TagDef {
  id: TagId;
  label: string;
  group: TagGroup;
  /** Lower shows first on tiles (more distinctive tags first). */
  priority: number;
}

export const TAG_REGISTRY: Record<TagId, TagDef> = {
  'bedtime-snack': { id: 'bedtime-snack', label: 'Bedtime snack', group: 'prep', priority: 1 },
  seafood: { id: 'seafood', label: 'Seafood', group: 'cuisine', priority: 2 },
  'mexican-inspired': { id: 'mexican-inspired', label: 'Mexican-inspired', group: 'cuisine', priority: 3 },
  mediterranean: { id: 'mediterranean', label: 'Mediterranean', group: 'cuisine', priority: 4 },
  vegetarian: { id: 'vegetarian', label: 'Vegetarian', group: 'dietary', priority: 5 },
  'gluten-free': { id: 'gluten-free', label: 'Gluten-free', group: 'dietary', priority: 6 },
  'low-sodium': { id: 'low-sodium', label: 'Low sodium', group: 'dietary', priority: 7 },
  'low-fat': { id: 'low-fat', label: 'Low fat', group: 'dietary', priority: 8 },
  'no-cook': { id: 'no-cook', label: 'No-cook', group: 'prep', priority: 9 },
  'make-ahead': { id: 'make-ahead', label: 'Make-ahead', group: 'prep', priority: 10 },
  'high-protein': { id: 'high-protein', label: 'High protein', group: 'dietary', priority: 11 },
};

export const TAG_GROUPS: { id: TagGroup; label: string }[] = [
  { id: 'dietary', label: 'Dietary' },
  { id: 'cuisine', label: 'Cuisine' },
  { id: 'prep', label: 'Prep' },
];

/** Display order within a filter group (registry insertion order, filtered by group). */
export const TAGS_IN_GROUP_ORDER: Record<TagGroup, TagId[]> = {
  dietary: ['high-protein', 'gluten-free', 'vegetarian', 'low-sodium', 'low-fat'],
  cuisine: ['mediterranean', 'seafood', 'mexican-inspired'],
  prep: ['no-cook', 'make-ahead', 'bedtime-snack'],
};

export function isTagId(s: string): s is TagId {
  return (TAG_IDS as readonly string[]).includes(s);
}

/** Groups a card's tags by TagGroup, omitting empty groups; tags sorted by priority. */
export function tagsByGroup(tags: TagId[]): { group: TagGroup; label: string; tags: TagDef[] }[] {
  const out: { group: TagGroup; label: string; tags: TagDef[] }[] = [];
  for (const g of TAG_GROUPS) {
    const defs = tags
      .map((t) => TAG_REGISTRY[t])
      .filter((d) => d.group === g.id)
      .sort((a, b) => a.priority - b.priority);
    if (defs.length > 0) out.push({ group: g.id, label: g.label, tags: defs });
  }
  return out;
}

/** Orders a card's tags for tile display: highlighted (active) tags first, then by priority. */
export function orderTagsForTile(tags: TagId[], highlight: TagId[]): TagDef[] {
  const hl = new Set(highlight);
  return tags
    .map((t) => TAG_REGISTRY[t])
    .sort((a, b) => {
      const ah = hl.has(a.id) ? 0 : 1;
      const bh = hl.has(b.id) ? 0 : 1;
      if (ah !== bh) return ah - bh;
      return a.priority - b.priority;
    });
}
