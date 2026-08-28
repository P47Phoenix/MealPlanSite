import type { MealCard, IngredientSection } from '../data/schema';

/** One aggregated line item on the grocery list. */
export interface GroceryItem {
  /** Display name (title-cased from the first occurrence). */
  name: string;
  /** Summed quantity, unit-normalized within the volume family where possible. */
  quantity: number;
  /** Unit for the quantity. */
  unit: string;
  /** Names of the cards that contributed to this item. */
  sourceCards: string[];
}

/** Grocery list grouped by section, each section's items sorted alphabetically. */
export type GroceryList = Record<IngredientSection, GroceryItem[]>;

const SECTION_ORDER: IngredientSection[] = [
  'produce',
  'protein',
  'dairy',
  'grains',
  'bakery',
  'pantry',
  'other',
];

// Volume-family conversion, all expressed in teaspoons as the base unit.
const VOLUME_TO_TSP: Record<string, number> = {
  tsp: 1,
  tbsp: 3,
  cup: 48,
};

function normalizeVolume(totalTsp: number): { quantity: number; unit: string } {
  // Prefer the largest unit that gives a "clean-ish" result.
  if (totalTsp >= 48 && totalTsp % 48 === 0) return { quantity: totalTsp / 48, unit: 'cup' };
  if (totalTsp >= 3 && totalTsp % 3 === 0) return { quantity: totalTsp / 3, unit: 'tbsp' };
  if (totalTsp % 1 === 0) return { quantity: totalTsp, unit: 'tsp' };
  // Fall back to tbsp fractional if not a whole number of tsp.
  return { quantity: Math.round((totalTsp / 3) * 100) / 100, unit: 'tbsp' };
}

interface Accumulator {
  displayName: string;
  section: IngredientSection;
  sourceCards: Set<string>;
  // Keyed by unit (or 'volume' pseudo-key for tsp/tbsp/cup family)
  quantitiesByUnit: Map<string, number>;
}

/**
 * Aggregates ingredients across the given cards into a grocery list, grouped
 * by section and sorted alphabetically within each section. Matching is
 * case-insensitive on ingredient name; quantities are summed for matching
 * name+unit pairs, with trivial tsp/tbsp/cup normalization within the
 * volume family.
 */
export function buildGroceryList(cards: MealCard[]): GroceryList {
  const byKey = new Map<string, Accumulator>();

  for (const card of cards) {
    for (const ing of card.ingredients) {
      const key = ing.name.trim().toLowerCase();
      let acc = byKey.get(key);
      if (!acc) {
        acc = {
          displayName: ing.name.trim(),
          section: ing.section,
          sourceCards: new Set(),
          quantitiesByUnit: new Map(),
        };
        byKey.set(key, acc);
      }
      acc.sourceCards.add(card.name);
      const unitKey = ing.unit.trim().toLowerCase() in VOLUME_TO_TSP ? 'volume' : ing.unit.trim().toLowerCase();
      const prev = acc.quantitiesByUnit.get(unitKey) ?? 0;
      const addAmount = unitKey === 'volume' ? ing.quantity * VOLUME_TO_TSP[ing.unit.trim().toLowerCase()] : ing.quantity;
      acc.quantitiesByUnit.set(unitKey, prev + addAmount);
    }
  }

  const list: GroceryList = {
    produce: [],
    protein: [],
    dairy: [],
    grains: [],
    bakery: [],
    pantry: [],
    other: [],
  };

  for (const acc of byKey.values()) {
    for (const [unitKey, qty] of acc.quantitiesByUnit.entries()) {
      let quantity: number;
      let unit: string;
      if (unitKey === 'volume') {
        const normalized = normalizeVolume(qty);
        quantity = normalized.quantity;
        unit = normalized.unit;
      } else {
        quantity = Math.round(qty * 100) / 100;
        unit = unitKey;
      }
      list[acc.section].push({
        name: acc.displayName,
        quantity,
        unit,
        sourceCards: Array.from(acc.sourceCards).sort(),
      });
    }
  }

  for (const section of SECTION_ORDER) {
    list[section].sort((a, b) => a.name.localeCompare(b.name));
  }

  return list;
}
