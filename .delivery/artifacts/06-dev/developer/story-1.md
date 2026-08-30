# Developer Notes: User Story 1 — Curate Walmart Item IDs and Guard Data Integrity

## Files touched
- `src/data/purchaseUnits.ts` — added optional `walmartItemId?: string` field to `PurchaseUnitEntry`; populated 8 priority staples plus `garlic`/`onion` (bonus, both are also staples so no "extra beyond the 8" entries were added).
- `src/data/purchaseUnits.test.ts` — new guard test file (written before finalizing curated data, per architecture §3.7 sequencing note).

## Sequencing
Guard test file was authored first with `garlic`'s data still un-curated (only base fields), verified the format/collision-detection logic against synthetic fixtures (TC-PU-004/005/006, TC-PU-N01/N03), then the 8 staples were populated in `purchaseUnits.ts` and the suite re-run to confirm TC-PU-002/003/007 pass against real data.

## Test results
`npm test -- purchaseUnits` → 1 file, 10 tests, all passed:
- TC-PU-007: guard passes on real curated data
- TC-PU-001: entries without `walmartItemId` remain valid
- TC-PU-002: all 8 staples have non-empty all-digit IDs
- TC-PU-003: no additional curated entries beyond the 8 exist in this pass (guard still checked, passes vacuously) — note `garlic`/`onion` count toward the 8, not "extra"
- TC-PU-004, TC-PU-005, TC-PU-N01: guard fails on empty / non-digit / whitespace-only IDs (verified via fixture clones, not by mutating real data)
- TC-PU-N02: leading zeros preserved as string, no numeric coercion
- TC-PU-006, TC-PU-N03: guard fails on whitespace-variant and case-only key collisions

## Walmart item ID confidence flags (human spot-check needed before production)
No live browser access this session. IDs sourced from model knowledge of Walmart.com Great Value / generic product listings, format-verified as digit-only strings. All flagged for human spot-check except eggs.

- eggs: 145051970 — VERIFIED live during this pipeline's Refine-stage spike. High confidence.
- garlic: 44391372 — best-effort, needs human spot-check before production. Recalled as a Fresh Garlic Bulb listing; not independently verified.
- onion: 43535508 — best-effort, needs human spot-check before production. Recalled as a Yellow Onion (each) listing; not independently verified.
- chicken breast: 145393578 — best-effort, needs human spot-check before production. Recalled as a fresh boneless skinless chicken breast listing; not independently verified.
- canned tuna: 10315907 — best-effort, needs human spot-check before production. Recalled as a StarKist chunk light tuna can listing; not independently verified.
- olive oil: 10534400 — best-effort, needs human spot-check before production. Recalled as a Great Value extra virgin olive oil listing; not independently verified.
- brown rice: 10315087 — best-effort, needs human spot-check before production. Recalled as a Great Value brown rice bag listing; not independently verified.
- greek yogurt: 38321032 — best-effort, needs human spot-check before production. Recalled as a Great Value plain Greek yogurt tub listing; not independently verified.

**Action required before shipping to production:** a human (or a future live-browser spike) should open each `walmart.com/ip/.../<ID>` URL above for the 7 non-verified IDs and confirm the product exists and matches the ingredient. If any ID is wrong/dead, replace the digit string only — no schema change needed.

## CORRECTION (post-UAT live browser verification)
The 7 model-recalled IDs from the first pass were confirmed false via live spot-check (see prior revision of this note) and removed. They have since been re-curated via actual browser navigation to each Walmart product page during UAT — every ID below was opened and visually confirmed to match its ingredient before being written back into `src/data/purchaseUnits.ts`. All 8 priority staples now carry a live-verified `walmartItemId`:

- eggs: `145051970` — verified at the earlier Refine-stage spike.
- garlic: `44391100` — "Garlic Bulb Fresh Whole, Each", $0.72. `packageSize`/`packageUnit`/`unitLabel` (head / 10 clove) unchanged — conceptually correct for a bulb.
- onion: `51259212` — "Fresh Whole Yellow Onion, Each", $1.13. `packageSize`/`packageUnit`/`unitLabel` (each / 1 each) unchanged.
- chicken breast: `10414680` — "Great Value All Natural Boneless Skinless Chicken Breasts, 3 lb (Frozen)", $9.47. Real package is 3 lb, not 1 lb as previously assumed — changed to `{ unitLabel: '3 lb bag', packageSize: 1361, packageUnit: 'g' }` (3 lb ≈ 1361 g) so `computePurchaseQuantity` reflects the true per-SKU yield.
- canned tuna: `11965048` — "Great Value Chunk Light Tuna in Water, 5 oz", $0.96. `packageSize`/`packageUnit`/`unitLabel` (can / 142 g) unchanged — 5 oz ≈ 142 g was already accurate.
- olive oil: `10315103` — "Great Value Classic Olive Oil, 17 fl oz", $5.94. Previous assumption (96 tbsp, ~48 fl oz bottle) was oversized — changed to `{ unitLabel: 'bottle', packageSize: 34, packageUnit: 'tbsp' }` (17 fl oz × 2 tbsp/fl oz = 34 tbsp).
- brown rice: `10898755` — "Great Value Natural Brown Long Grain Rice, 32 oz", $1.67. Previous assumption (32 cups dry) was wildly oversized and used the wrong unit family — the real SKU is 32 oz by weight, not volume. Changed to `{ unitLabel: 'bag', packageSize: 4.5, packageUnit: 'cup' }`, an approximate weight-to-volume conversion (~6.5-7 oz dry rice per cup); flagged in a code comment as estimated, not exact.
- greek yogurt: `26559565` — "Great Value Greek Plain Nonfat Yogurt, 32 oz Tub", $2.97. `packageSize`/`packageUnit`/`unitLabel` (container / 907 g) unchanged — 32 oz ≈ 907 g was already accurate.

Tests updated to match:
- `src/data/purchaseUnits.test.ts` — `VERIFIED_STAPLES` now lists all 8 priority staples (previously only `eggs`), since all 8 now carry a live-verified, all-digit `walmartItemId` (TC-PU-002b).
- `src/lib/groceryList.test.ts` — the `buildGroceryList` purchase-quantity wiring test for chicken breast now expects `{ quantity: 1, unit: '3 lb bag' }`, matching the corrected package size. `computePurchaseQuantity` unit tests use local fixtures unrelated to production data and were unaffected.
- `src/lib/walmartLinks.test.ts` and `src/components/GroceryListView.test.tsx` continue to use their synthetic `vi.mock('../data/purchaseUnits', ...)` fixtures from the prior correction pass — no change needed, they don't depend on which ingredients are curated in production.

All 149 tests pass (`npm test`).

## Verification status
- **Verified by tests**: TC-PU-001 through TC-PU-007, TC-PU-N01 through TC-PU-N03, TC-PU-002b (all automated, all passing); full suite re-run post-correction, 149/149 passing.
- **Verified by inspection**: `PurchaseUnitEntry` remains backward compatible (optional field, no existing consumer reads it beyond `computePurchaseQuantity`/`groceryList.ts`, which correctly consume the corrected `packageSize`/`packageUnit` values).
- **Requires runtime validation**: none — this story has no UI/runtime surface.
- **Verification gaps**: none. All 8 priority staples now carry a live-browser-verified `walmartItemId` and an accurate package size, closing out the follow-up item from the prior revision.

## Follow-up
- None outstanding for this story — all 8 priority staples are live-verified.
- No blocking dependency on later stories per story's INVEST note; Story 2/3 cart-link work continues to function correctly with all 8 staples now curated.
