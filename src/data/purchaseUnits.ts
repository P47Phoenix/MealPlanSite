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
  /** Walmart catalog item ID (digits only), taken from a real
   * `walmart.com/ip/.../<ID>` product URL. Optional — entries without it
   * simply cannot build a cart deep link yet. See `purchaseUnits.test.ts`
   * for the format/uniqueness guard this field must satisfy. */
  walmartItemId?: string;
}

export const PURCHASE_UNITS: Record<string, PurchaseUnitEntry> = {
  garlic: { unitLabel: 'head', packageSize: 10, packageUnit: 'clove', walmartItemId: '44391100' },
  onion: { unitLabel: 'each', packageSize: 1, packageUnit: 'each', walmartItemId: '51259212' },
  lemon: { unitLabel: 'each', packageSize: 1, packageUnit: 'each' },
  celery: { unitLabel: 'bunch', packageSize: 340, packageUnit: 'g' },
  cucumber: { unitLabel: 'each', packageSize: 300, packageUnit: 'g' },
  carrots: { unitLabel: 'bag', packageSize: 454, packageUnit: 'g' },
  'baby spinach': { unitLabel: 'bag', packageSize: 142, packageUnit: 'g' },
  'cherry tomatoes': { unitLabel: 'pint', packageSize: 300, packageUnit: 'g' },
  'red bell pepper': { unitLabel: 'each', packageSize: 150, packageUnit: 'g' },
  banana: { unitLabel: 'each', packageSize: 118, packageUnit: 'g' },
  // Real Walmart SKU 10414680 is a 3 lb frozen bag, not a 1 lb package.
  'chicken breast': { unitLabel: '3 lb bag', packageSize: 1361, packageUnit: 'g', walmartItemId: '10414680' },
  'turkey breast': { unitLabel: 'lb', packageSize: 454, packageUnit: 'g' },
  salmon: { unitLabel: 'lb', packageSize: 454, packageUnit: 'g' },
  shrimp: { unitLabel: 'lb', packageSize: 454, packageUnit: 'g' },
  'ahi tuna': { unitLabel: 'lb', packageSize: 454, packageUnit: 'g' },
  'canned tuna': { unitLabel: 'can', packageSize: 142, packageUnit: 'g', walmartItemId: '11965048' },
  eggs: { unitLabel: 'dozen', packageSize: 12, packageUnit: 'each', walmartItemId: '145051970' },
  // Real Walmart SKU 10315103 is 17 fl oz (34 tbsp), not the ~48 fl oz assumed before.
  'olive oil': { unitLabel: 'bottle', packageSize: 34, packageUnit: 'tbsp', walmartItemId: '10315103' },
  'soy sauce': { unitLabel: 'bottle', packageSize: 32, packageUnit: 'tbsp' },
  // Real Walmart SKU 10898755 is 32 oz by weight, not 32 cups by volume. Dry
  // long-grain rice runs ~6.5-7 oz per cup, so 32 oz is approx. 4.5 cups —
  // an estimated weight-to-volume conversion, not an exact one.
  'brown rice': { unitLabel: 'bag', packageSize: 4.5, packageUnit: 'cup', walmartItemId: '10898755' },
  quinoa: { unitLabel: 'bag', packageSize: 16, packageUnit: 'cup' },
  hummus: { unitLabel: 'container', packageSize: 227, packageUnit: 'g' },
  'feta cheese': { unitLabel: 'container', packageSize: 227, packageUnit: 'g' },
  'greek yogurt': { unitLabel: 'container', packageSize: 907, packageUnit: 'g', walmartItemId: '26559565' },
};
