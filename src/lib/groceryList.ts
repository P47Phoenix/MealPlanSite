import type { MealCard, IngredientSection } from '../data/schema';
import { PURCHASE_UNITS, type PurchaseUnitEntry } from '../data/purchaseUnits';

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
  /** Store-purchasable quantity, when the ingredient has a known package size. */
  purchase?: { quantity: number; unit: string };
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

/**
 * Converts a raw aggregated quantity/unit into a store-purchasable quantity,
 * given the package-size entry for that ingredient (or `undefined` if the
 * ingredient has no known purchase mapping). Supports exact-unit matches and
 * conversion within the tsp/tbsp/cup volume family; any other unit mismatch
 * (e.g. mass vs. count) returns `undefined` since there is no general
 * unit-conversion engine. A non-positive raw quantity returns a zero
 * purchase quantity rather than `undefined`.
 */
export function computePurchaseQuantity(
  rawQuantity: number,
  rawUnit: string,
  entry: PurchaseUnitEntry | undefined,
): { quantity: number; unit: string } | undefined {
  if (!entry) return undefined;

  if (rawQuantity <= 0) return { quantity: 0, unit: entry.unitLabel };

  const normalizedRawUnit = rawUnit.trim().toLowerCase();
  const normalizedPackageUnit = entry.packageUnit.trim().toLowerCase();

  let rawInPackageUnit: number | undefined;
  if (normalizedRawUnit === normalizedPackageUnit) {
    rawInPackageUnit = rawQuantity;
  } else if (normalizedRawUnit in VOLUME_TO_TSP && normalizedPackageUnit in VOLUME_TO_TSP) {
    const rawTsp = rawQuantity * VOLUME_TO_TSP[normalizedRawUnit];
    rawInPackageUnit = rawTsp / VOLUME_TO_TSP[normalizedPackageUnit];
  }

  if (rawInPackageUnit === undefined) return undefined;

  const quantity = Math.ceil(rawInPackageUnit / entry.packageSize);
  return { quantity, unit: entry.unitLabel };
}

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
      const shoppingName = (ing.shoppingName ?? ing.name).trim();
      const key = shoppingName.toLowerCase();
      let acc = byKey.get(key);
      if (!acc) {
        acc = {
          displayName: shoppingName,
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
      const purchaseEntry = PURCHASE_UNITS[acc.displayName.trim().toLowerCase()];
      list[acc.section].push({
        name: acc.displayName,
        quantity,
        unit,
        sourceCards: Array.from(acc.sourceCards).sort(),
        purchase: computePurchaseQuantity(quantity, unit, purchaseEntry),
      });
    }
  }

  for (const section of SECTION_ORDER) {
    list[section].sort((a, b) => a.name.localeCompare(b.name));
  }

  return list;
}
