## Test Strategy: Walmart Cart Integration for the Grocery List

### Scope

In scope: `src/data/purchaseUnits.ts` (`walmartItemId` field + data-integrity guard test), `src/lib/walmartLinks.ts` (`buildCartUrl`, `buildSearchUrl`, `getQualifyingItems`), `src/lib/groceryList.ts` (`normalizeIngredientKey` export/refactor), `src/components/GroceryListView.tsx` (cart button, coverage count, per-item search links), `src/styles.css` (new rules, inspection-only), `README.md` (documentation, inspection-only).

Out of scope: verifying Walmart's live endpoint behavior beyond the one-time spike already recorded in `spike-findings.md`; Impact Radius affiliate-approval status (external, non-testable from repo); `walmartItemId` staleness/package-size drift (accepted risk per PRD, no automated detection); analytics/telemetry (none exists); any retailer other than Walmart.

### Test Types

| Type | Purpose | Level | Tools/Approach |
|---|---|---|---|
| Unit | Verify `buildCartUrl`/`buildSearchUrl`/`getQualifyingItems` branch logic | Unit | Vitest, pure-function assertions on `walmartLinks.ts` |
| Unit (data-integrity guard) | Verify `PURCHASE_UNITS` has valid `walmartItemId` format and no key collisions | Unit | Vitest, `purchaseUnits.test.ts`, NFR-05 |
| Component | Verify button/coverage-count/search-link render states and props | Component | Vitest + Testing Library, `GroceryListView.test.tsx` |
| Regression | Confirm existing suites still pass unmodified in behavior | Unit + Component | `groceryList.test.ts`, `App.test.tsx` re-run in CI |
| Manual (source inspection) | Verify CSS token reuse, no hardcoded affiliate ID, README wording | Manual | Code review / `git grep` |
| Manual (live behavior) | Verify actual Walmart cart-URL open behavior, popup-blocked fallback, dark-mode rendering | Manual | `npm run dev`, real browser, real walmart.com |

### Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| `buildCartUrl` mis-skips/mis-floors quantities (silent bad cart) | Medium | High | Full branch coverage per NFR-05 (TC-CART-001–008), asserted in unit tests, CI-gated |
| Key-derivation drift between `groceryList.ts` and `walmartLinks.ts` | Medium | High (silent lookup miss) | Shared `normalizeIngredientKey` export, tested at all three call sites (TC-SEARCH-004) |
| Two independent qualification filters diverge (`buildCartUrl` vs coverage count) | Medium | Medium | Single exported `getQualifyingItems`, cross-checked in both unit (TC-CART-007) and component (TC-GLV-006) tests |
| Duplicate/near-duplicate ingredient keys collide silently in `PURCHASE_UNITS` | Low | High (wrong item added to cart) | NFR-05 guard test, mandatory in CI, written before curation per architecture §3.7 |
| Regression in existing grocery-list/App behavior from additive changes | Low | High | `groceryList.test.ts` and `App.test.tsx` re-run unmodified in same CI job, zero tolerance for new failures |
| Live cart URL rejected/broken by Walmart (endpoint change, ToS, no affiliate approval) | Medium | Medium | Not automatable; manual pre-release verification + search-link fallback always present (FR-06) |
| Popup blocked, no visible fallback (NFR-07) | Low | Medium | Architecturally closed by single-anchor design; still needs one manual check per release since it's a browser-behavior claim, not a unit-testable one |
| `walmartItemId` staleness (delisted/relisted product) | Medium (over time) | Low-Medium | Accepted risk, out of automated scope; search link is the standing mitigation |

### Entry Criteria

- Stories 1–8 code merged to feature branch; build is green (`npm run build`)
- `PurchaseUnitEntry` extended and 8 priority staples curated with hand-verified `walmartItemId` values
- `walmartLinks.ts`, `normalizeIngredientKey` export, and `GroceryListView.tsx` wiring complete
- Existing `groceryList.test.ts` and `App.test.tsx` pass on the feature branch before new tests are added (baseline confirmed clean)
- Local dev environment (`npm run dev`) available for manual verification pass

### Exit Criteria

- All NFR-05-listed branches (6 `buildCartUrl` branches, `buildSearchUrl` encoding, guard test's format + collision checks) have passing unit tests
- `purchaseUnits.test.ts` guard test passes against real curated data (0 failures) and independently proven to fail against each of the 3 negative fixtures (empty ID, non-digit ID, key collision)
- `GroceryListView.test.tsx` covers all 3 render states (curated≥1, zero-curated M>0, empty M=0) plus href-exactness and N-derivation-matches-`getQualifyingItems` checks
- `groceryList.test.ts` and `App.test.tsx` pass unmodified — zero new failures, zero skipped/weakened assertions
- 5-step manual verification pass complete on `npm run dev` (button appears with accurate count, click opens correct real Walmart cart, every line has a working search link, button fully hidden at zero coverage/empty list, popup-blocked fallback confirmed clickable)
- `git grep` confirms zero hardcoded affiliate/tracking IDs and zero Marketplace/I/O-Affiliate API references (FR-05, NFR-02)
- README states the Impact Radius prerequisite per Story 8 wording, reviewed against PRD OQ-1 resolution status

### Environment Requirements

- Local: Node/Vitest for unit and component tests, no network dependency (pure functions, mocked/fixture `GroceryItem[]` and `PURCHASE_UNITS` data)
- CI: same test commands (`npm test`) run headless on every PR touching `src/lib/walmartLinks.ts`, `src/data/purchaseUnits.ts`, `src/components/GroceryListView.tsx`, or their test files
- Manual pass: real browser (`npm run dev`), real network access to `walmart.com`/`affil.walmart.com` — this cannot be sandboxed or CI-run since it hits a live external site outside project control
- No test double/mock server needed for `walmartLinks.ts` — confirmed pure and synchronous per architecture §7

### Approach

Risk drives test order: the guard test for `purchaseUnits.ts` is written and CI-gated first, before hand-curating IDs, per architecture §3.7 — this is shift-left in the strictest sense, catching key-collision and format mistakes at data-entry time rather than after `walmartLinks.ts` is built on unverified data. `buildCartUrl`'s six branches (NFR-05) get full unit coverage next since a silent bad quantity or wrong-item cart link is the highest-impact defect class in this feature and is fully unit-testable — no reason to defer it to manual checking. Component tests for `GroceryListView.tsx` follow, focused on the three render states and the cross-check that N (coverage count) and `buildCartUrl`'s item set never diverge, since that divergence risk was explicitly flagged by the architect (§3.2) as structurally possible if `getQualifyingItems` isn't the single source of truth both consumers call.

What's automated vs. manual, and why: everything expressible as a pure-function input/output pair or a component-render assertion is automated (`walmartLinks.ts`, `purchaseUnits.ts` guard, `GroceryListView.tsx` render states, href exactness, ARIA attributes). What's left manual is exactly what cannot be verified without a live external system this project doesn't control: whether `affil.walmart.com/cart/addToCart` actually accepts the built URL and adds the right items server-side, whether the popup-blocked fallback is genuinely clickable in a real browser under real popup-blocking, and dark-mode/visual rendering. The FR-02 spike already exercised the live endpoint once and is treated as prior evidence, not a substitute for the pre-release manual pass — Walmart's endpoint has no published contract and could change without notice (PRD Dependencies & Risks), so each release still needs its own manual check rather than trusting the spike indefinitely.

Regression is a first-class gate, not an afterthought: `groceryList.test.ts` and `App.test.tsx` are pre-existing, unrelated-looking suites that this feature's changes can still break silently — `normalizeIngredientKey`'s extraction from `groceryList.ts`'s inline key logic (Story 3) is a refactor of code both suites already exercise, and `GroceryListView.tsx` is a shared component both may render through. Both suites run in the same CI job as the new tests, with zero tolerance for new failures; a passing new-test suite alongside a broken existing suite does not satisfy exit criteria.

The NFR-05 guard test fits into CI as an unconditional, always-run unit test (`purchaseUnits.test.ts`), not a manual or pre-release-only check — because a duplicate/near-duplicate key or malformed ID is a pure-data defect fully expressible without any UI or network dependency, it belongs at the fastest, cheapest layer of the pyramid and should block every PR that touches `purchaseUnits.ts`, not just release branches. It runs alongside `walmartLinks.test.ts` and the pre-existing suites in one `npm test` CI step; a failure here blocks merge the same way any other unit test failure does, catching data-entry mistakes (bad ID format, colliding keys) before they ever reach a curated-count claim in the UI or a manual verification pass.
