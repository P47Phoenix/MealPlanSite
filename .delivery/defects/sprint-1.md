# Sprint 1 Defects

## BUG-01: Walmart cart quantity uses raw unconverted recipe quantity when unit conversion fails for a curated item

- **Status**: Fixed — `resolveQuantity()` in `src/lib/walmartLinks.ts` no longer falls back to `Math.ceil(item.quantity)`; a curated item whose `item.purchase` is `undefined` (conversion failure) is now excluded from `getQualifyingItems`/`buildCartUrl` and falls back to its per-item Search link. Regression test added in `src/lib/walmartLinks.test.ts`.
- **Severity**: MEDIUM
- **Found by**: Cross-Story Interaction exploratory session, `.delivery/artifacts/07-uat/qa/exploratory-session.md`
- **Found via**: Static code-reasoning (no live browser in this environment) -- needs a live-browser or new-unit-test confirmation before disposition.
- **Component**: `src/lib/walmartLinks.ts` (`resolveQuantity`, `getQualifyingItems`) interacting with `src/lib/groceryList.ts` (`computePurchaseQuantity`)

### Description

`resolveQuantity()` in `walmartLinks.ts` computes the cart quantity as:

```ts
const raw = item.purchase?.quantity ?? Math.ceil(item.quantity);
```

`item.purchase` is `undefined` for two different reasons that this code does not distinguish:

1. The ingredient has no `PURCHASE_UNITS` entry at all -- in this case `walmartItemId` is also absent, so `getQualifyingItems` correctly skips the item before `resolveQuantity` matters.
2. The ingredient **has** a `PURCHASE_UNITS` entry (and therefore a `walmartItemId`), but `computePurchaseQuantity()` returned `undefined` because the recipe's unit doesn't exactly match the package unit and isn't in the tsp/tbsp/cup volume family (e.g. a mass unit vs. a count unit, or an unrelated unit like `tsp` vs. `clove`).

In case 2, the item still qualifies for `buildCartUrl` (since qualification only checks `walmartItemId` presence), but the quantity added to the real Walmart cart is `Math.ceil(item.quantity)` -- the raw, unconverted recipe-unit number -- not a package count. E.g. "3 tsp minced garlic" would add `3` units of a Walmart SKU that's sold "per head," not 3 tsp worth of garlic.

### Reproduction (code path, not live-confirmed)

1. Add a meal card ingredient using a curated staple name (e.g. `garlic`, which maps to `PURCHASE_UNITS.garlic` with `packageUnit: 'clove'`) with a unit that isn't `clove` and isn't `tsp`/`tbsp`/`cup`, e.g.:
   ```ts
   { name: 'Garlic', quantity: 3, unit: 'tsp', section: 'produce' }
   ```
2. `computePurchaseQuantity(3, 'tsp', garlicEntry)` returns `undefined` (unit mismatch, `tsp` not `clove` and not paired with a volume-family package unit).
3. The resulting `GroceryItem.purchase` is `undefined`.
4. `getQualifyingItems` still finds `walmartItemId = '44391372'` for the normalized key `garlic`, and `resolveQuantity` falls back to `Math.max(1, Math.ceil(3))` = `3`.
5. `buildCartUrl` includes `44391372|3` in the generated `affil.walmart.com/cart/addToCart` URL -- adding 3 units of the garlic SKU (sold per head) when the recipe actually called for 3 tsp.

### Expected

When package-unit conversion fails for an otherwise-curated ingredient, the item should not silently add a wrong-basis quantity to a real Walmart cart. Either exclude it from `buildCartUrl` (falling back to the per-item Search link, consistent with FR-06/FR-08's framing of Search as the correctness fallback) or fix the conversion.

### Actual

The item is included in `buildCartUrl` with the raw recipe-unit number substituted directly as a package count.

### Current live-data impact

Checked all 8 curated staples (`garlic`, `onion`, `chicken breast`, `canned tuna`, `eggs`, `olive oil`, `brown rice`, `greek yogurt`) against every matching ingredient usage in `src/data/cards/*.ts` as of this session: every current usage's unit exactly matches (or is a supported volume-family conversion of) its `PURCHASE_UNITS` package unit. **This bug does not currently reproduce with any ingredient in the live dataset.** It is a latent defect that would trigger the moment a future meal card introduces one of the 8 staples in a mismatched unit.

### Recommended next step

- Add a unit test to `walmartLinks.test.ts`: an item with a curated `walmartItemId` but `purchase: undefined` due to a unit-conversion failure -- assert the intended behavior (excluded vs. included with documented raw-quantity fallback).
- If excluding is chosen as the fix, change `getQualifyingItems` to skip items where `item.purchase` is `undefined` AND a `PURCHASE_UNITS` entry exists (distinguishing "no curated entry" from "curated entry, conversion failed").
- Route to PO/Dev for fix-vs-accepted-risk decision; low urgency given zero live-data impact today, but should not ship silently undocumented.
