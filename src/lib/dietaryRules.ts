import type { MealCard, Ingredient } from '../data/schema';
import { isTagId, type TagId } from '../data/tags';

/** A single rule violation found on a card or dataset. */
export interface Violation {
  /** Machine-readable rule id, e.g. 'red-meat', 'legume', 'seafood-temp'. */
  rule: string;
  /** The card id the violation applies to, or 'dataset' for dataset-level checks. */
  cardId: string;
  /** Human-readable explanation. */
  message: string;
}

const RED_MEAT_WORDS = ['beef', 'pork', 'lamb', 'bacon', 'ham', 'veal', 'sausage'];

const LEGUME_WORDS = [
  'bean',
  'beans',
  'lentil',
  'lentils',
  'chickpea',
  'chickpeas',
  'garbanzo',
];

const SEAFOOD_WORDS = [
  'salmon',
  'tilapia',
  'tuna',
  'shrimp',
  'cod',
  'halibut',
  'crab',
  'lobster',
  'scallop',
  'fish',
];

const TEMP_OR_DONENESS_PATTERN = /(\d+\s*°?\s*[fF]\b|\d+\s*°?\s*[cC]\b|degrees|opaque|flakes easily|internal temp|fully cooked|ready to eat)/i;

const POULTRY_WORDS = ['chicken', 'turkey'];

/**
 * "Sausage" is only a red-meat hard-fail when it's not qualified as a
 * poultry product. "Chicken sausage" / "turkey sausage" are lean poultry
 * products, not the red/processed meat the rule targets — but plain
 * "sausage" (unqualified, implicitly pork) and any other red-meat word are
 * still hard fails.
 */
function isPoultrySausageException(text: string, word: string): boolean {
  if (word !== 'sausage') return false;
  const lower = text.toLowerCase();
  return POULTRY_WORDS.some((p) => lower.includes(p));
}

function isBanzaException(card: MealCard, ingredientName: string): boolean {
  const lower = ingredientName.toLowerCase();
  if (!LEGUME_WORDS.some((w) => wordMatch(lower, w))) return false;
  // Only chickpea/garbanzo hits can be exempted, and only via Banza/chickpea
  // pasta naming or hummus (both specific chickpea preparations, not bare
  // chickpeas/beans/lentils).
  const isChickpeaWord = lower.includes('chickpea') || lower.includes('garbanzo');
  if (!isChickpeaWord) return false;
  const nameLower = card.name.toLowerCase();
  const ingLower = ingredientName.toLowerCase();
  return (
    nameLower.includes('chickpea penne') ||
    ingLower.includes('banza') ||
    ingLower.includes('chickpea pasta') ||
    ingLower.includes('chickpea penne') ||
    ingLower.includes('hummus')
  );
}

function wordMatch(haystack: string, word: string): boolean {
  const re = new RegExp(`\\b${word}\\b`, 'i');
  return re.test(haystack);
}

/** Validates that a MealCard has all required fields with correct types. */
export function validateSchema(card: Partial<MealCard>): Violation[] {
  const violations: Violation[] = [];
  const cardId = typeof card.id === 'string' ? card.id : 'unknown';
  const push = (rule: string, message: string) =>
    violations.push({ rule, cardId, message });

  if (typeof card.id !== 'string' || !card.id) push('schema', 'Missing or invalid id');
  if (typeof card.name !== 'string' || !card.name) push('schema', 'Missing or invalid name');
  if (!['breakfast', 'lunch', 'dinner', 'snack'].includes(card.mealType as string)) {
    push('schema', 'Missing or invalid mealType');
  }
  if (!Array.isArray(card.tags)) {
    push('schema', 'Missing or invalid tags array');
  } else {
    const seen = new Set<string>();
    for (const tag of card.tags as unknown[]) {
      if (typeof tag !== 'string' || !isTagId(tag)) {
        push('unknown-tag', `Tag "${String(tag)}" is not in the tag registry (src/data/tags.ts)`);
        continue;
      }
      if (seen.has(tag)) push('duplicate-tag', `Tag "${tag}" appears more than once`);
      seen.add(tag);
    }
  }
  if (typeof card.prepTimeMinutes !== 'number') push('schema', 'Missing or invalid prepTimeMinutes');
  if (typeof card.cookTimeMinutes !== 'number') push('schema', 'Missing or invalid cookTimeMinutes');
  if (!Array.isArray(card.ingredients) || card.ingredients.length === 0) {
    push('schema', 'Missing or empty ingredients array');
  }
  if (!Array.isArray(card.steps) || card.steps.length === 0) {
    push('schema', 'Missing or empty steps array');
  }
  if (!card.nutrition || typeof card.nutrition !== 'object') {
    push('schema', 'Missing nutrition object');
  } else {
    for (const key of ['calories', 'proteinG', 'sodiumMg', 'satFatG', 'carbsG'] as const) {
      const fig = (card.nutrition as any)[key];
      if (!fig || typeof fig.value !== 'number' || !['verified', 'estimated'].includes(fig.confidence)) {
        push('schema', `Missing or invalid nutrition.${key}`);
      }
    }
  }
  if (card.cooksNotes !== null && typeof card.cooksNotes !== 'string' && card.cooksNotes !== undefined) {
    push('schema', 'cooksNotes must be string or null');
  }

  return violations;
}

/** Hard-fail: red meat (beef/pork/lamb and derivatives) present in ingredients or tags. */
export function checkRedMeat(card: MealCard): Violation[] {
  const violations: Violation[] = [];
  const haystacks: string[] = [
    ...card.ingredients.map((i: Ingredient) => i.name),
    ...card.tags,
    card.name,
  ];
  for (const text of haystacks) {
    for (const word of RED_MEAT_WORDS) {
      if (wordMatch(text, word)) {
        if (isPoultrySausageException(text, word)) continue;
        violations.push({
          rule: 'red-meat',
          cardId: card.id,
          message: `Red meat term "${word}" found in "${text}"`,
        });
      }
    }
  }
  return violations;
}

/** Hard-fail: legume/bean/lentil ingredient, unless it's the explicit Banza/chickpea-pasta exception. */
export function checkLegumes(card: MealCard): Violation[] {
  const violations: Violation[] = [];
  for (const ing of card.ingredients) {
    const lower = ing.name.toLowerCase();
    // Green beans / string beans are a vegetable, not a legume-family hard-fail target.
    if (/\bgreen bean|string bean|wax bean/.test(lower)) continue;
    for (const word of LEGUME_WORDS) {
      if (wordMatch(lower, word)) {
        if (isBanzaException(card, ing.name)) continue;
        violations.push({
          rule: 'legume',
          cardId: card.id,
          message: `Legume term "${word}" found in ingredient "${ing.name}" without a Banza/chickpea-pasta exception`,
        });
      }
    }
  }
  return violations;
}

/** Hard-fail: seafood card with no step containing a temperature or doneness cue. */
export function checkSeafoodDoneness(card: MealCard): Violation[] {
  const isSeafood = card.ingredients.some((ing) =>
    SEAFOOD_WORDS.some((w) => wordMatch(ing.name.toLowerCase(), w)),
  );
  if (!isSeafood) return [];
  const hasCue = card.steps.some((step) => TEMP_OR_DONENESS_PATTERN.test(step));
  if (hasCue) return [];
  return [
    {
      rule: 'seafood-temp',
      cardId: card.id,
      message: 'Seafood card has no step with a temperature or doneness cue',
    },
  ];
}

/** Runs all per-card hard-fail rules (and schema validation) against one card. */
export function validateCard(card: MealCard): Violation[] {
  return [
    ...validateSchema(card),
    ...checkRedMeat(card),
    ...checkLegumes(card),
    ...checkSeafoodDoneness(card),
  ];
}

/** Dataset-level check: at least one card must carry the 'bedtime-snack' tag. */
export function checkBedtimeSnackPresent(cards: MealCard[]): Violation[] {
  const required: TagId = 'bedtime-snack';
  const found = cards.some((c) => c.tags.includes(required));
  if (found) return [];
  return [
    {
      rule: 'bedtime-snack-required',
      cardId: 'dataset',
      message: 'No card in the dataset carries the bedtime-snack tag',
    },
  ];
}

/** Validates every card individually plus dataset-level checks. */
export function validateDataset(cards: MealCard[]): Violation[] {
  const violations: Violation[] = [];
  for (const card of cards) {
    violations.push(...validateCard(card));
  }
  violations.push(...checkBedtimeSnackPresent(cards));
  return violations;
}
