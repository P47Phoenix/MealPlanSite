import { normalizeIngredientKey, type GroceryItem } from './groceryList';
import { PURCHASE_UNITS } from '../data/purchaseUnits';

/**
 * Builds a Walmart search URL for the given item name. Always returns a
 * usable, syntactically valid URL — requires no curated data, so it works
 * for any ingredient, curated or not.
 */
export function buildSearchUrl(itemName: string): string {
  const params = new URLSearchParams({ q: itemName });
  return `https://www.walmart.com/search?${params.toString()}`;
}

/** One cart-ready line item: a curated Walmart catalog ID and its quantity. */
export interface QualifyingItem {
  id: string;
  qty: number;
}

/**
 * Resolves the quantity to add to cart for a single grocery item, or
 * `undefined` if the item has no usable quantity. Only `item.purchase.quantity`
 * is trusted — it is the package-unit-converted quantity computed by
 * `computePurchaseQuantity()`. There is deliberately no fallback to the raw
 * recipe-unit `item.quantity`: for a curated item (one with a `walmartItemId`,
 * which is the only case this is called for), `item.purchase` being
 * `undefined` means the conversion failed (unit mismatch), not that no
 * quantity was ever intended. Substituting the raw, unconverted number would
 * add a wrong-basis quantity to the cart (e.g. "3 tsp garlic" adding 3 units
 * of a per-head garlic SKU) — see BUG-01. A resolved quantity that is
 * non-positive, `NaN`, `null`, or `undefined` is invalid and causes the item
 * to be skipped entirely — it is never floored to 1. A valid but
 * fractional/sub-1 quantity is floored up to 1.
 */
function resolveQuantity(item: GroceryItem): number | undefined {
  const raw = item.purchase?.quantity;
  if (raw === null || raw === undefined || Number.isNaN(raw) || raw <= 0) return undefined;
  return Math.max(1, Math.ceil(raw));
}

/**
 * Single shared implementation for determining which grocery items qualify
 * for a Walmart cart deep link, and at what quantity. Both `buildCartUrl`
 * and any future coverage-count computation (e.g. in `GroceryListView.tsx`)
 * must call this — it is the one place qualification logic lives.
 */
export function getQualifyingItems(items: GroceryItem[]): QualifyingItem[] {
  const qualifying: QualifyingItem[] = [];
  for (const item of items) {
    const walmartItemId = PURCHASE_UNITS[normalizeIngredientKey(item.name)]?.walmartItemId;
    if (!walmartItemId) continue;

    const qty = resolveQuantity(item);
    if (qty === undefined) continue;

    qualifying.push({ id: walmartItemId, qty });
  }
  return qualifying;
}

/**
 * Builds a Walmart "add to cart" deep link from a grocery list's curated
 * items. Returns `undefined` when no item qualifies (no curated
 * `walmartItemId`, or no valid resolved quantity), since there is nothing
 * useful to link to.
 */
export function buildCartUrl(items: GroceryItem[]): string | undefined {
  const qualifying = getQualifyingItems(items);
  if (qualifying.length === 0) return undefined;

  const itemsParam = qualifying.map(({ id, qty }) => `${id}|${qty}`).join(',');
  const params = new URLSearchParams({ items: itemsParam });
  return `https://affil.walmart.com/cart/addToCart?${params.toString()}`;
}
