/**
 * Maps a canonical ingredient key (lowercased, trimmed shoppingName/name —
 * the same key used for grocery-list aggregation in `lib/groceryList.ts`) to
 * the store-purchasable package size for that ingredient. Curated
 * incrementally; ingredients with no entry here simply keep the raw
 * recipe-total quantity in the grocery list.
 */
export interface PurchaseUnitEntry {
  /** Display label for the purchase unit, e.g. "can", "head", "lb". */
  unitLabel: string;
  /** Size of one package, expressed in `packageUnit`. */
  packageSize: number;
  /** Unit that `packageSize` is expressed in. Must match the raw aggregation
   * unit exactly, or be a member of the volume family (tsp/tbsp/cup). */
  packageUnit: string;
}

export const PURCHASE_UNITS: Record<string, PurchaseUnitEntry> = {
  garlic: { unitLabel: 'head', packageSize: 10, packageUnit: 'clove' },
  onion: { unitLabel: 'each', packageSize: 1, packageUnit: 'each' },
  lemon: { unitLabel: 'each', packageSize: 1, packageUnit: 'each' },
  celery: { unitLabel: 'bunch', packageSize: 340, packageUnit: 'g' },
  cucumber: { unitLabel: 'each', packageSize: 300, packageUnit: 'g' },
  carrots: { unitLabel: 'bag', packageSize: 454, packageUnit: 'g' },
  'baby spinach': { unitLabel: 'bag', packageSize: 142, packageUnit: 'g' },
  'cherry tomatoes': { unitLabel: 'pint', packageSize: 300, packageUnit: 'g' },
  'red bell pepper': { unitLabel: 'each', packageSize: 150, packageUnit: 'g' },
  banana: { unitLabel: 'each', packageSize: 118, packageUnit: 'g' },
  'chicken breast': { unitLabel: 'lb', packageSize: 454, packageUnit: 'g' },
  'turkey breast': { unitLabel: 'lb', packageSize: 454, packageUnit: 'g' },
  salmon: { unitLabel: 'lb', packageSize: 454, packageUnit: 'g' },
  shrimp: { unitLabel: 'lb', packageSize: 454, packageUnit: 'g' },
  'ahi tuna': { unitLabel: 'lb', packageSize: 454, packageUnit: 'g' },
  'canned tuna': { unitLabel: 'can', packageSize: 142, packageUnit: 'g' },
  eggs: { unitLabel: 'dozen', packageSize: 12, packageUnit: 'each' },
  'olive oil': { unitLabel: 'bottle', packageSize: 96, packageUnit: 'tbsp' },
  'soy sauce': { unitLabel: 'bottle', packageSize: 32, packageUnit: 'tbsp' },
  'brown rice': { unitLabel: 'bag', packageSize: 32, packageUnit: 'cup' },
  quinoa: { unitLabel: 'bag', packageSize: 16, packageUnit: 'cup' },
  hummus: { unitLabel: 'container', packageSize: 227, packageUnit: 'g' },
  'feta cheese': { unitLabel: 'container', packageSize: 227, packageUnit: 'g' },
  'greek yogurt': { unitLabel: 'container', packageSize: 907, packageUnit: 'g' },
};
