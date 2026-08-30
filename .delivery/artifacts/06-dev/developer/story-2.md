# Story 2 Implementation Notes: Cart-URL Function with Shared Qualification Helper

## Language: TypeScript
## Task: write

### Code

Extended `src/lib/walmartLinks.ts` (created by the parallel Story 3 work with `buildSearchUrl`; left that function untouched, added the following):

- `QualifyingItem` interface: `{ id: string; qty: number }`.
- `resolveQuantity(item: GroceryItem): number | undefined` — internal helper implementing the fallback chain (`item.purchase?.quantity` else `Math.ceil(item.quantity)`), returning `undefined` for any non-positive/NaN/null/undefined result, and flooring valid-but-fractional results up to 1 via `Math.max(1, Math.ceil(raw))`.
- `getQualifyingItems(items: GroceryItem[]): QualifyingItem[]` — exported, the single shared qualification/quantity-resolution implementation. Looks up `PURCHASE_UNITS[normalizeIngredientKey(item.name)]?.walmartItemId`, skips items with no ID, resolves quantity via `resolveQuantity`, skips items with an invalid quantity.
- `buildCartUrl(items: GroceryItem[]): string | undefined` — calls `getQualifyingItems` exclusively (no second filter), returns `undefined` on zero qualifying items, otherwise builds `https://affil.walmart.com/cart/addToCart?items=ID|QTY,ID2|QTY2` via `URLSearchParams({ items: ... })` for correct encoding.

Imports added: `normalizeIngredientKey` and `type GroceryItem` from `./groceryList`; `PURCHASE_UNITS` from `../data/purchaseUnits`.

### Key Decisions
- `resolveQuantity` isolated as a private helper so the invalid-vs-floor distinction (skip entirely vs. floor to 1) is expressed once and unit-testable indirectly through `getQualifyingItems`/`buildCartUrl`.
- `getQualifyingItems` is the sole exported qualification path per architecture §3.2 — `buildCartUrl` contains zero independent filtering logic, satisfying TC-CART-007's shared-implementation requirement.
- Used `URLSearchParams({ items: itemsParam })` (single key, pre-joined value) rather than repeated `append` calls, matching the acceptance criterion's exact `items=ID|QTY,ID2|QTY2` format while still getting correct percent-encoding of `|` and `,`.
- Kept the module framework-free (no React import), consistent with NFR-03 and the existing `buildSearchUrl`.

### Test Suggestions
- TC-CART-001: all-curated list of N items → URL has N `ID|QTY` pairs.
- TC-CART-002: mixed curated/uncurated → uncurated silently absent.
- TC-CART-003 / 008: zero-curated or empty array → `undefined`.
- TC-CART-004: quantity `0.4` → emitted as `ID|1`.
- TC-CART-005 / N01-N03: quantity `0`, `-1`, `NaN`, `null`, `undefined` → item skipped, no throw, remaining valid items still processed.
- TC-CART-006: all items resolve invalid → `undefined`.
- TC-CART-007: `getQualifyingItems(items)` called directly, compare its `id`s against the `ID`s embedded in `buildCartUrl(items)`'s query string — same set.

### Verification Status
- **Verified by inspection**: all acceptance criteria and TC-CART-001–008, N01–N03 (logic reviewed against each branch; `tsc --noEmit` passes with no errors).
- **Requires runtime validation**: none — pure function, no I/O, no React.
- **Verification gaps**: no automated test file was written for this module in this story (full test suite is Story 4 per task scope); only manual code-path review and typecheck were performed here.

### Follow-Up
- Story 4 should add `walmartLinks.test.ts` covering TC-CART-001 through N03 exactly as enumerated in stories.md.
- Story 5 (`GroceryListView.tsx`) should import and call `getQualifyingItems` directly for its coverage-count computation, per architecture §3.2 — do not re-implement filtering there.
