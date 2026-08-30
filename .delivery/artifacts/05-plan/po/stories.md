# User Stories: Walmart Cart Integration for the Grocery List

Source: `.delivery/artifacts/02-refine/po/prd.md` (FR-01–FR-08, NFR-01–NFR-07), `.delivery/artifacts/04-architect/solution/architecture.md` (§7 build order, §3 gaps), `.delivery/artifacts/03-design/ui/component-specs.md`.

Story order follows architecture §7 build order: (1) data model + curation + guard test, (2) `walmartLinks.ts` core + qualification helper + key-normalizer, (3) `GroceryListView.tsx` wiring, (4) CSS, (5) README. Split into 8 stories, 1–3 points each, one story per FR (FR-02/FR-03 split further per architecture module boundaries; test coverage pulled into its own story since it spans both new functions).

---

## User Story 1: Curate Walmart Item IDs and Guard Data Integrity

**As a** meal planner shopping online
**I want** the app's ingredient data to carry verified Walmart product IDs for common staples
**So that** the app has real data to build one-click cart links from, without corrupting existing purchase-quantity behavior

**Story Points:** 3
**Priority:** Critical

### Acceptance Criteria

Given the updated `PurchaseUnitEntry` interface in `src/data/purchaseUnits.ts`
When an entry has no `walmartItemId`
Then the entry remains valid and the grocery list still shows a purchase quantity for it, unaffected by this change

Given the 8 named priority staples (chicken breast, eggs, olive oil, garlic, onion, brown rice, canned tuna, greek yogurt)
When each entry is inspected
Then every one of the 8 has a non-empty, all-digit `walmartItemId` sourced from a real `walmart.com/ip/.../<ID>` URL

Given any additional entries beyond the 8 that are also curated
When inspected
Then each meets the same verification standard (non-empty, all-digit, real product URL)

Given the guard test suite for `purchaseUnits.ts`
When it runs against the curated data
Then it fails if any `walmartItemId` is empty or contains non-digit characters, and it fails if any two `PURCHASE_UNITS` entries normalize to the same lowercased/trimmed key

### Test Cases

| ID | Title | Type | Priority | Preconditions | Steps | Expected Result |
|---|---|---|---|---|---|---|
| TC-PU-001 | Entry with no `walmartItemId` stays valid | Functional | High | `PURCHASE_UNITS` has an entry without `walmartItemId` | 1. Load `PURCHASE_UNITS` 2. Compute purchase quantity for that entry's ingredient | Entry passes type/schema validation; purchase quantity computed as before, unaffected |
| TC-PU-002 | All 8 priority staples carry a verified digit ID | Functional | Critical | `PURCHASE_UNITS` loaded | 1. For each of the 8 named staples, read `walmartItemId` 2. Assert non-empty, all-digit | All 8 pass; each traces to a real `walmart.com/ip/.../<ID>` URL (manual verification note) |
| TC-PU-003 | Additional curated entries beyond the 8 meet same standard | Functional | Medium | One or more entries beyond the 8 staples have `walmartItemId` set | 1. Filter entries with `walmartItemId` set, excluding the 8 staples 2. Assert non-empty, all-digit for each | All extra curated entries pass the same non-empty/all-digit check |
| TC-PU-004 (guard) | Guard test fails on empty `walmartItemId` | Negative | Critical | Test fixture: clone `PURCHASE_UNITS`, set one entry's `walmartItemId` to `""` | 1. Run guard test against fixture | Guard test fails with an assertion identifying the offending entry |
| TC-PU-005 (guard) | Guard test fails on non-digit `walmartItemId` | Negative | Critical | Test fixture: one entry's `walmartItemId` set to `"12A45"` | 1. Run guard test against fixture | Guard test fails, flags non-digit characters |
| TC-PU-006 (guard) | Guard test fails on key collision | Negative | Critical | Test fixture: two entries whose `shoppingName ?? name` normalize (lowercased/trimmed) to the same key, e.g. `"Garlic "` and `"garlic"` | 1. Run guard test against fixture | Guard test fails, identifies the colliding key/pair |
| TC-PU-007 (guard) | Guard test passes on clean curated data | Functional | Critical | Real `PURCHASE_UNITS` data as shipped | 1. Run guard test against actual `src/data/purchaseUnits.ts` | Guard test passes with 0 failures |

### Negative Test Cases

| ID | Title | Invalid Input | Expected Error |
|---|---|---|---|
| TC-PU-N01 | Whitespace-only `walmartItemId` | `walmartItemId: "   "` | Guard test fails (treated as non-digit/empty after trim) |
| TC-PU-N02 | `walmartItemId` with leading zero stripped incorrectly | N/A — leading zeros must be preserved as string, not coerced to number | Guard test does not attempt numeric coercion; passes as long as all chars are digits |
| TC-PU-N03 | Case-only key collision | Two entries differing only by case, e.g. `"Eggs"` vs `"eggs"` | Guard test fails as a collision (lowercasing applied before comparison) |

### Coverage Notes
Equivalence classes covered: valid digit ID, missing ID (opt-in field), empty ID, non-digit ID, unique keys, colliding keys (exact/whitespace/case variants). Boundary case covered: whitespace-only ID is off-boundary-invalid (BVA on "empty vs whitespace" per reference guide). Gap: real Walmart URL liveness is not machine-testable — TC-PU-002 verification is manual/one-time, not part of the automated guard.

### Definition of Ready Checklist
- [ ] Story is understood by the team
- [ ] Acceptance criteria are clear and testable
- [ ] Dependencies identified
- [ ] Story is sized and fits within one sprint
- [ ] No unresolved blockers

### Notes / Constraints
- Files touched: `src/data/purchaseUnits.ts` (add optional `walmartItemId?: string` field; populate 8 staples), new/extended test file (e.g. `src/data/purchaseUnits.test.ts`) for the guard test.
- Traces FR-01, NFR-05 (data-integrity guard portion).
- Architecture §3.7 sequencing note: write the guard test **before** hand-curating IDs so key-collision/format mistakes are caught at data-entry time.
- "As many as can be hand-verified" is a ceiling on effort, not a floor — the 8 staples are the launch minimum.
- No consumer of `PURCHASE_UNITS` outside this feature reads the new field; `computePurchaseQuantity` and `groceryList.ts` are untouched by this story.
- [INVEST check] Independent, small, testable — passes. No blocking dependency on later stories.

---

## User Story 2: Build the Cart-URL Function with a Shared Qualification Helper

**As a** meal planner shopping online
**I want** a pure function that builds a Walmart cart deep link from my grocery list's curated items
**So that** later UI work can offer a one-click "add to cart" action without duplicating item-qualification logic

**Story Points:** 3
**Priority:** Critical

### Acceptance Criteria

Given a list where every item has a `walmartItemId`
When `buildCartUrl` runs
Then it returns a URL containing exactly one `ID|QTY` pair per item, comma-joined and correctly URL-encoded via `URLSearchParams`, in the format `https://affil.walmart.com/cart/addToCart?items=ID|QTY,ID2|QTY2`

Given a mixed list of curated and uncurated items
When `buildCartUrl` runs
Then only curated items appear in the output; uncurated items are silently omitted, not errored

Given a list with zero curated items
When `buildCartUrl` runs
Then it returns `undefined`

Given an item whose resolved quantity is positive but fractional or below 1 (e.g. 0.4)
When `buildCartUrl` runs
Then the emitted quantity is rounded up to 1 and never below 1

Given an item whose resolved quantity is 0, negative, `NaN`, `null`, or `undefined`
When `buildCartUrl` runs
Then that item is skipped and omitted entirely (never emitted as `ID|1`), and the skip does not throw or halt processing of remaining items

Given a list where every item resolves to an invalid quantity
When `buildCartUrl` runs
Then it returns `undefined`, identical to a list with zero curated items

Given `GroceryListView.tsx`'s future coverage-count computation
When it needs to know which items qualify
Then an exported qualification helper (e.g. `getQualifyingItems(items)`) exists in `walmartLinks.ts` and is the single implementation both `buildCartUrl` and the coverage count call — no second, independently written filter exists

### Test Cases

| ID | Title | Type | Priority | Preconditions | Steps | Expected Result |
|---|---|---|---|---|---|---|
| TC-CART-001 | All-curated list builds full URL | Functional | Critical | List of N items, all with `walmartItemId` and valid quantities | 1. Call `buildCartUrl(items)` | Returns URL with N `ID\|QTY` pairs, comma-joined, `URLSearchParams`-encoded, matching `https://affil.walmart.com/cart/addToCart?items=...` |
| TC-CART-002 | Mixed curated/uncurated list omits uncurated silently | Functional | Critical | List has some items with `walmartItemId`, some without | 1. Call `buildCartUrl(items)` | Returns URL containing only curated items' pairs; no error thrown; uncurated items absent |
| TC-CART-003 | Zero-curated list returns undefined | Boundary | Critical | List has ≥1 item, none with `walmartItemId` | 1. Call `buildCartUrl(items)` | Returns `undefined` |
| TC-CART-004 | Fractional quantity below 1 floors to 1 | Boundary | Critical | Curated item resolves to quantity `0.4` | 1. Call `buildCartUrl(items)` | Emitted pair is `ID\|1`, never `ID\|0.4` or below 1 |
| TC-CART-005 | Invalid quantity item is skipped, not floored to 1 | Negative | Critical | Curated items with resolved quantity `0`, `-1`, `NaN`, `null`, `undefined` (one case each) | 1. Call `buildCartUrl(items)` for each case | Item omitted entirely from output; never emitted as `ID\|1`; no throw; remaining valid items still processed |
| TC-CART-006 | All-invalid-quantity list returns undefined | Boundary | Critical | All curated items resolve to invalid quantities | 1. Call `buildCartUrl(items)` | Returns `undefined`, same as zero-curated case |
| TC-CART-007 | `getQualifyingItems` is exported and shared | Functional | High | Import `getQualifyingItems` from `walmartLinks.ts` | 1. Call `getQualifyingItems(items)` directly 2. Compare to items reflected in `buildCartUrl`'s output | Same item set; `buildCartUrl` internally uses this function (no divergent second filter) |
| TC-CART-008 | Empty item array | Boundary | Medium | `items = []` | 1. Call `buildCartUrl([])` | Returns `undefined` |

### Negative Test Cases

| ID | Title | Invalid Input | Expected Error |
|---|---|---|---|
| TC-CART-N01 | Quantity is `NaN` | `item.purchase.quantity = NaN`, no fallback resolves | Item skipped, no throw, function returns for remaining items |
| TC-CART-N02 | Quantity is `null`/`undefined` with no fallback | `item.purchase = undefined`, `item.quantity = undefined` | Item skipped, no throw |
| TC-CART-N03 | Negative quantity | `item.quantity = -3` | Item skipped, never floored to 1 |

### Coverage Notes
Covers every branch named in PRD NFR-05 for `buildCartUrl`: all-curated, mixed, zero-curated, fractional floor, invalid-quantity skip, all-invalid. Equivalence classes: valid positive int, valid positive fractional, zero, negative, NaN, null, undefined. Boundary values: quantity exactly 1 (on-boundary, no flooring needed), just below 1 (0.99, floors), 0 (invalid, not floored). Gap: real network fetch of the resulting URL is out of scope for this pure-function unit test — covered functionally by the FR-02 spike, not by these test cases.

### Definition of Ready Checklist
- [ ] Story is understood by the team
- [ ] Acceptance criteria are clear and testable
- [ ] Dependencies identified
- [ ] Story is sized and fits within one sprint
- [ ] No unresolved blockers

### Notes / Constraints
- Files touched: new `src/lib/walmartLinks.ts` (create module; export `buildCartUrl`, internal-use-exported `getQualifyingItems`).
- Traces FR-02, NFR-03 (pure, framework-free, no React import).
- Depends on Story 1 (`walmartItemId` field must exist on `PurchaseUnitEntry`) but not on curated data being complete — can be built against the type shape.
- Architecture §3.2: `getQualifyingItems` MUST be exported, not a closure — `GroceryListView.tsx` (Story 5) calls it directly.
- Quantity fallback chain: `item.purchase?.quantity`, else `Math.ceil(item.quantity)`, floored at 1 only when valid and fractional.
- [INVEST check] Independent of UI stories; testable via direct function assertions.

---

## User Story 3: Build the Search-URL Function and Export a Shared Key Normalizer

**As a** meal planner shopping online
**I want** a Walmart search link available for any ingredient, curated or not, using the same lookup key the app already uses internally
**So that** I always have a manual path to buy an item even when no cart link exists, and the app's ingredient matching stays consistent

**Story Points:** 2
**Priority:** Critical

### Acceptance Criteria

Given any item name, including one with spaces or special characters
When `buildSearchUrl(itemName)` runs
Then it returns a syntactically valid, correctly percent-encoded `https://www.walmart.com/search?q=<encoded name>` URL that a browser can navigate to directly

Given `buildSearchUrl` requires no curated data
When called for any item, curated or not
Then it always returns a usable URL — never `undefined`

Given `groceryList.ts`'s existing inline key logic (`shoppingName.trim().toLowerCase()`) and `walmartLinks.ts`'s need for the identical key to look up `PURCHASE_UNITS`
When a shared `normalizeIngredientKey(name: string): string` function is exported from `groceryList.ts`
Then both `groceryList.ts`'s aggregation and `walmartLinks.ts`'s lookup call that single exported function — no inline `.trim().toLowerCase()` duplication remains in `walmartLinks.ts`

### Test Cases

| ID | Title | Type | Priority | Preconditions | Steps | Expected Result |
|---|---|---|---|---|---|---|
| TC-SEARCH-001 | Plain item name encodes correctly | Functional | Critical | `itemName = "chicken breast"` | 1. Call `buildSearchUrl("chicken breast")` | Returns `https://www.walmart.com/search?q=chicken%20breast` (or `+`-encoded per `URLSearchParams` convention); valid, navigable URL |
| TC-SEARCH-002 | Name with special characters encodes correctly | Functional | Critical | `itemName = "greek yogurt (2%)"` | 1. Call `buildSearchUrl(itemName)` | Query string percent-encodes `%`, `(`, `)`, spaces; result is a syntactically valid URL |
| TC-SEARCH-003 | Always returns a defined URL, curated or not | Functional | Critical | Item not present in `PURCHASE_UNITS` | 1. Call `buildSearchUrl(itemName)` | Returns a usable URL string, never `undefined` |
| TC-SEARCH-004 | `normalizeIngredientKey` exported and shared | Functional | High | Import from `groceryList.ts` | 1. Call `normalizeIngredientKey("  Garlic ")` 2. Compare with `groceryList.ts` aggregation's internal key for the same input, and with `walmartLinks.ts` lookup key for the same input | All three produce identical `"garlic"`; no inline `.trim().toLowerCase()` remains in `walmartLinks.ts` (source inspection) |
| TC-SEARCH-005 | Empty string name | Boundary | Medium | `itemName = ""` | 1. Call `buildSearchUrl("")` | Returns a syntactically valid URL with empty `q` param (`?q=`), does not throw |

### Negative Test Cases

| ID | Title | Invalid Input | Expected Error |
|---|---|---|---|
| TC-SEARCH-N01 | Unicode/emoji in item name | `itemName = "café ☕"` | No throw; percent-encoded correctly, still a valid URL |
| TC-SEARCH-N02 | Name with ampersand/query-breaking characters | `itemName = "salt & pepper"` | `&` is percent-encoded, does not create a spurious second query param |

### Coverage Notes
Covers `buildSearchUrl` encoding branch named in NFR-05 plus the normalizer-consistency requirement. Equivalence classes: plain alphanumeric, spaces, special/reserved URL characters, Unicode, empty string. Gap: normalizer's behavior on non-string/null input is not specified by the AC — flagged as an assumption (normalizer is only ever called with string ingredient names from existing call sites).

### Definition of Ready Checklist
- [ ] Story is understood by the team
- [ ] Acceptance criteria are clear and testable
- [ ] Dependencies identified
- [ ] Story is sized and fits within one sprint
- [ ] No unresolved blockers

### Notes / Constraints
- Files touched: `src/lib/walmartLinks.ts` (add `buildSearchUrl`, consume normalizer), `src/lib/groceryList.ts` (export `normalizeIngredientKey`, replace inline key logic at its existing call site with the exported function).
- Traces FR-03, and architecture §3.1 (key-derivation duplication gap — the one real gap the architecture pass flagged as not yet closed).
- No behavior change to `groceryList.ts`'s output — this is an extract-and-export refactor of existing logic, not new logic.
- [INVEST check] Small, independent of Story 2 (different function), can be done in parallel with it; grouped after Story 2 only per suggested build order, not a hard dependency.

---

## User Story 4: Unit Test Coverage for walmartLinks.ts

**As a** developer maintaining this feature
**I want** unit tests covering every branch of `buildCartUrl` and `buildSearchUrl`
**So that** cart-link correctness is verified automatically and regressions are caught before release

**Story Points:** 2
**Priority:** High

### Acceptance Criteria

Given `buildCartUrl` with an all-curated list, a mixed list, a zero-curated list, a fractional-quantity item, an invalid-quantity item, and an all-invalid-quantity list
When the test suite runs
Then each of these branches has a passing assertion matching PRD FR-02's acceptance criteria exactly

Given `buildSearchUrl` with a plain name and a name containing spaces/special characters
When the test suite runs
Then both produce correctly encoded, valid URLs

Given the qualification helper (`getQualifyingItems`) and the key normalizer (`normalizeIngredientKey`)
When tested directly
Then their outputs match what `buildCartUrl`/`buildSearchUrl` rely on, confirming no drift between the shared helpers and their consumers

### Test Cases

This story's job is to land TC-CART-001 through TC-CART-008 (Story 2) and TC-SEARCH-001 through TC-SEARCH-005 (Story 3) as actual passing assertions in `src/lib/walmartLinks.test.ts`, plus the following suite-completeness checks:

| ID | Title | Type | Priority | Preconditions | Steps | Expected Result |
|---|---|---|---|---|---|---|
| TC-COV-001 | All 6 `buildCartUrl` branches from NFR-05 present and passing | Functional | Critical | Test file complete | 1. Run `npm test -- walmartLinks` 2. Inspect test names against NFR-05's list: all-curated, mixed, zero-curated, fractional floor, invalid-quantity skip, all-invalid | 6/6 branches have a distinct passing test case (maps to TC-CART-001, 002, 003, 004, 005, 006) |
| TC-COV-002 | `buildSearchUrl` encoding branch present and passing | Functional | Critical | Test file complete | 1. Run test suite | Plain-name and special-character encoding both asserted (maps to TC-SEARCH-001, 002) |
| TC-COV-003 | `getQualifyingItems` tested directly, matches `buildCartUrl` usage | Functional | High | Test file complete | 1. Run `getQualifyingItems` test case directly against a fixture list 2. Compare to same fixture's `buildCartUrl` output | Item sets align — no drift |
| TC-COV-004 | `normalizeIngredientKey` tested directly, matches consumers | Functional | High | Test file complete | 1. Run normalizer test case 2. Cross-check against `groceryList.ts` and `walmartLinks.ts` usage sites | Keys match across all three call sites |
| TC-COV-005 | Full suite green in CI | Functional | Critical | CI pipeline configured | 1. Push branch / open PR 2. CI runs `npm test` | 0 failing tests in `walmartLinks.test.ts` |

### Coverage Notes
This story does not introduce new equivalence classes beyond Stories 2 and 3 — it is the enforcement point ensuring those test cases actually exist as code, matching PRD NFR-05's explicit branch list verbatim. Gap: no mutation-testing/coverage-percentage tooling specified in the PRD; pass/fail is asserted by branch presence, not a numeric coverage threshold.

### Definition of Ready Checklist
- [ ] Story is understood by the team
- [ ] Acceptance criteria are clear and testable
- [ ] Dependencies identified
- [ ] Story is sized and fits within one sprint
- [ ] No unresolved blockers

### Notes / Constraints
- Files touched: new test file (e.g. `src/lib/walmartLinks.test.ts`).
- Traces NFR-05 (test coverage for `walmartLinks.ts`).
- Depends on Stories 2 and 3 (functions must exist first).
- Architecture §7 note: no test double/mock server needed — module is pure and synchronous; assert on returned string content directly.
- [INVEST check] Could be folded into Stories 2/3, but kept separate since it spans both functions and is called out as its own NFR line item in the PRD; still small and independently deliverable once 2 and 3 land.

---

## User Story 5: Add Walmart Cart Button, Per-Item Search Links, and README Documentation (Merged Release Unit)

**Merge note:** this story merges what were originally three separate story cards (cart button + coverage count, per-item search links, README documentation). The challenger's adversarial review found that splitting these across three cards while relying on prose ("SM/PO enforce this at Sprint 2 planning; do not mark Story 5 Done while Story 8 is open") created a real risk of partial shipment on a solo project with no CI gate and no second reviewer — the cart button going live without its documented affiliate prerequisite. Merging removes that risk by construction: one story, one Done state, cannot be partially shipped. The three original scopes are kept as clearly labeled sub-sections below (5a cart button, 5b search links, 5c README) purely for traceability back to their originating FRs and test-case IDs — they are not independently completable; the story is Done only when all three sub-scopes pass together.

**As a** meal planner shopping online, and as the site operator preparing to deploy this feature
**I want** the Walmart cart button with coverage count, a per-item search link on every grocery-list line, and a README that honestly documents the affiliate prerequisite, all landing together
**So that** I can add my curated grocery items to a Walmart cart in one click, always have a manual search fallback per item, and never have the cart button live in production without its documented affiliate-enrollment prerequisite

**Story Points:** 5 (consolidation-discounted from the sum of the original three cards' 3+2+1=6 points — merging into one PR/review pass removes one round of story-level overhead (separate DoR/DoD bookkeeping, a third code-review pass, a third "story done" ceremony) while the underlying acceptance criteria and test cases are unchanged and unreduced)
**Priority:** Critical

### Sub-scope 5a: Cart Button with Coverage Count (originally Story 5, traces FR-04, FR-08)

Given a grocery list with at least one curated item
When the panel renders
Then the button is visible as a single `<a class="copy-link-button walmart-cart-button" href={cartUrl} target="_blank" rel="noopener noreferrer" aria-label="Add all to Walmart cart (opens in new tab)" aria-describedby="walmart-coverage-count">`, and adjacent text shows an accurate "N of M items" count matching the list's actual curated-vs-total ratio

Given a grocery list with zero curated items but M>0 total items
When the panel renders
Then the button is not rendered at all (not shown disabled)

Given a grocery list with zero items total (M=0)
When the panel renders
Then neither the button nor any "N of M items" coverage text is rendered (not even "0 of 0 items")

Given the button is clicked
When the new tab opens
Then it navigates to the exact URL returned by `buildCartUrl`, with no additional processing

Given N (numerator) is computed
When rendered
Then N comes from the same qualification logic `buildCartUrl` uses internally (`getQualifyingItems` from Story 2), never a separately reimplemented check

Given the site has not confirmed Impact Radius affiliate approval
When the grocery list has curated items
Then the button still renders per the rule above — it is not gated behind any approval-status flag

### Test Cases

| ID | Title | Type | Priority | Preconditions | Steps | Expected Result |
|---|---|---|---|---|---|---|
| TC-GLV-001 | Button visible with correct markup when ≥1 curated item | Functional | Critical | Grocery list with N total items, C≥1 curated | 1. Render `GroceryListView` with fixture list 2. Query for `.walmart-cart-button` | Single `<a>` present with `class="copy-link-button walmart-cart-button"`, `href={cartUrl}`, `target="_blank"`, `rel="noopener noreferrer"`, `aria-label="Add all to Walmart cart (opens in new tab)"`, `aria-describedby="walmart-coverage-count"` |
| TC-GLV-002 | Coverage count text accurate | Functional | Critical | Same fixture: C curated of M total | 1. Query `#walmart-coverage-count` text | Text reads exactly "C of M items" matching fixture's actual curated/total ratio |
| TC-GLV-003 | Button hidden when zero curated items, M>0 | Boundary | Critical | Grocery list with M>0 items, 0 curated | 1. Render component 2. Query for `.walmart-cart-button` and `#walmart-coverage-count` | Neither element is rendered (not disabled — absent) |
| TC-GLV-004 | Button and coverage text both absent when list is empty | Boundary | Critical | Grocery list with 0 items (M=0) | 1. Render component with empty list | Neither `.walmart-cart-button` nor `#walmart-coverage-count` rendered, not even "0 of 0 items" |
| TC-GLV-005 | Click navigates to exact `buildCartUrl` output | Functional | High | Fixture with curated items | 1. Compute expected `buildCartUrl(items)` 2. Render component 3. Read button's `href` | `href` equals the exact string returned by `buildCartUrl`, byte-for-byte, no additional query params appended |
| TC-GLV-006 | N derives from `getQualifyingItems`, no reimplemented filter | Functional | High | Fixture list | 1. Call `getQualifyingItems(items)` directly, get length 2. Compare to rendered "N of M" numerator | Numerator equals `getQualifyingItems(items).length` exactly |
| TC-GLV-007 | Button renders without affiliate-approval gating | Functional | Medium | No approval-status flag set anywhere in code/config | 1. Render component with ≥1 curated item, no approval flag present | Button still renders per TC-GLV-001 rule; source inspection confirms no gating flag referenced |
| TC-GLV-008 | Recompute on `groceryList` change, not `selectedCards` alone | Functional | Medium | Component mounted with initial list | 1. Change `groceryList` (e.g. add a curated item) 2. Re-render | Coverage count and `cartUrl` update to reflect new list |

### Negative Test Cases

| ID | Title | Invalid Input | Expected Error |
|---|---|---|---|
| TC-GLV-N01 | Zero curated, non-zero total does not render disabled button | 0 curated, 5 total items | No `<a>` element rendered at all (assert absence, not `disabled` attribute) |
| TC-GLV-N02 | Empty list does not render "0 of 0 items" | 0 items | Coverage text node absent entirely from DOM |

### Coverage Notes
Covers component-level cases requested: button visible/hidden states (TC-GLV-001, 003, 004), coverage count accuracy (TC-GLV-002, 006), and confirms this story's own button click behavior (TC-GLV-005). Gap: actual new-tab navigation and popup-blocking (NFR-07 fallback) is not verifiable in a component test — flagged for manual/E2E verification at Stage 7 UAT.

Notes for sub-scope 5a: files touched `src/components/GroceryListView.tsx` (add cart `<a>` in `.grocery-panel__header`, coverage `<span id="walmart-coverage-count" class="target-note walmart-coverage-count">`; compute `cartUrl`/`curatedCount`/`totalCount` via `useMemo` keyed on `[groceryList]`, using `allItems = sectionEntries.flatMap(([, items]) => items)`). Depends on Story 2 (`buildCartUrl`, `getQualifyingItems`) and Story 3 (module must exist). Architecture §2a locks this as a single anchor element — no `<button onClick={window.open}>` path, no separate fallback element; satisfies NFR-07 by construction. Architecture §3.3: derive from the same `useMemo` dependency as the existing `groceryList` memo to avoid desync — do not key independently off `selectedCards`.

### Sub-scope 5b: Per-Item Walmart Search Link (originally Story 6, traces FR-06)

Given any grocery-list line, curated or not
When rendered
Then it has a working "Search" link (`<a class="grocery-item__search-link" href={buildSearchUrl(item.name)} target="_blank" rel="noopener noreferrer" aria-label={`Search for ${item.name} (opens in new tab)`}>Search</a>`) that opens Walmart's search results for that item's name in a new tab

Given a `walmartItemId` that is stale or delisted at Walmart's end
When the user cannot complete checkout via the cart deep link
Then the per-item search link on that same line still works as a manual recovery path, unaffected by cart-link failure

Given the `showSourceRecipes` sub-list is expanded under an item
When the panel re-renders
Then the search link stays attached to the parent `<li>` and is never duplicated per source recipe

### Test Cases

| ID | Title | Type | Priority | Preconditions | Steps | Expected Result |
|---|---|---|---|---|---|---|
| TC-SL-001 | Per-item search link present on curated line | Functional | Critical | Grocery list line for a curated item | 1. Render `GroceryListView` 2. Query that `<li>` for `.grocery-item__search-link` | Link present with `href={buildSearchUrl(item.name)}`, `target="_blank"`, `rel="noopener noreferrer"`, `aria-label="Search for {item.name} (opens in new tab)"`, text "Search" |
| TC-SL-002 | Per-item search link present on uncurated line | Functional | Critical | Grocery list line for an item with no `walmartItemId` | 1. Render component 2. Query that `<li>` | Same link present and correctly targeted, identical treatment to curated line |
| TC-SL-003 | Search link is present on every line across all sections | Functional | High | Grocery list with multiple sections (e.g. produce, dairy) | 1. Render component 2. Query all `<li>` elements for `.grocery-item__search-link` | Every `<li>` in every section has exactly one search link |
| TC-SL-004 | Search link unaffected by stale/delisted `walmartItemId` | Functional | Medium | Item has a curated `walmartItemId` (staleness not detectable client-side) | 1. Render line 2. Read `href` | `href` still points to `buildSearchUrl(item.name)`, independent of cart-link validity |
| TC-SL-005 | `showSourceRecipes` expansion does not duplicate link | Functional | High | Item with source recipes, `showSourceRecipes` toggled expanded | 1. Render collapsed, count search links for that item 2. Expand `showSourceRecipes` sub-list 3. Re-count | Exactly one search link before and after expansion; link stays attached to parent `<li>`, not duplicated per source recipe |

### Negative Test Cases

| ID | Title | Invalid Input | Expected Error |
|---|---|---|---|
| TC-SL-N01 | Item name with special characters still produces a working link | `item.name = "greek yogurt (2%)"` | `href` correctly percent-encoded (delegates to TC-SEARCH-002); link still renders |

### Coverage Notes
Covers per-item search link presence requested for GroceryListView.tsx: presence on every line (curated and uncurated, TC-SL-001/002/003), and the no-duplication-on-expansion edge case (TC-SL-005) which is the one state-dependent branch in this story. Gap: actual new-tab open behavior is a browser-level concern, not testable at component level — deferred to manual verification.

Notes for sub-scope 5b: files touched `src/components/GroceryListView.tsx` (append `<a class="grocery-item__search-link">` to the end of each `<li>`'s text run, unconditionally, in every section). Depends on Story 3 (`buildSearchUrl`). Same file/PR as sub-scope 5a — sequenced per build order for a single coherent `GroceryListView.tsx` change.

### Sub-scope 5c: README Documentation of the Affiliate Prerequisite (originally Story 8, traces FR-07)

Given the README
When read
Then it states plainly that the `affil.walmart.com/cart/addToCart` endpoint used by the add-to-cart link requires Impact Radius affiliate enrollment for production use

Given the README's wording
When read
Then it does not assert the project currently holds that enrollment unless confirmed true at ship time; absent confirmation, it is phrased as a requirement/prerequisite, not a claim of current status

Given the shipped code
When reviewed alongside the README
Then no affiliate tracking ID is fabricated or hardcoded anywhere in the URL-building code, consistent with the README's documented requirement

### Test Cases (5c)

| ID | Title | Type | Priority | Preconditions | Steps | Expected Result |
|---|---|---|---|---|---|---|
| TC-README-001 | README states Impact Radius requirement plainly | Functional | High | `README.md` updated | 1. Read README section on Walmart cart feature | States the `affil.walmart.com/cart/addToCart` endpoint requires Impact Radius affiliate enrollment for production use |
| TC-README-002 | README does not falsely claim current enrollment | Functional | High | `README.md` updated | 1. Read wording of the affiliate section | Phrased as requirement/prerequisite ("requires," "affiliate-pending"), not an assertion of current approval, unless confirmed true at ship time |
| TC-README-003 | No hardcoded affiliate tracking ID in code | Negative | Critical | Shipped `walmartLinks.ts` and related source | 1. `git grep` for tracking-ID-shaped strings / publisher params in URL-building code | Zero matches; `buildCartUrl`/`buildSearchUrl` contain no fabricated affiliate ID |

Notes for sub-scope 5c: files touched `README.md`. No code dependency, but is part of this story's single Done state — the story (and therefore the whole release unit) is not Done while 5c is open, even if 5a/5b's code is merged. This is the structural fix for the original merge-grouping risk: previously three cards with a prose rule against shipping 5 without 8; now one card that cannot be Done-and-merged partially. Open question (PRD OQ-1) on exact wording ("affiliate-pending" vs. asserting approval) is owned by Product Owner before Stage 7 UAT sign-off — this sub-scope ships the requirement statement; final wording confirmation is a pre-UAT check, not a blocker to writing the draft.

### Test Cases (5a, 5b — unchanged from original Stories 5 and 6)

| ID | Title | Type | Priority | Preconditions | Steps | Expected Result |
|---|---|---|---|---|---|---|
| TC-GLV-001 | Button visible with correct markup when ≥1 curated item | Functional | Critical | Grocery list with N total items, C≥1 curated | 1. Render `GroceryListView` with fixture list 2. Query for `.walmart-cart-button` | Single `<a>` present with `class="copy-link-button walmart-cart-button"`, `href={cartUrl}`, `target="_blank"`, `rel="noopener noreferrer"`, `aria-label="Add all to Walmart cart (opens in new tab)"`, `aria-describedby="walmart-coverage-count"` |
| TC-GLV-002 | Coverage count text accurate | Functional | Critical | Same fixture: C curated of M total | 1. Query `#walmart-coverage-count` text | Text reads exactly "C of M items" matching fixture's actual curated/total ratio |
| TC-GLV-003 | Button hidden when zero curated items, M>0 | Boundary | Critical | Grocery list with M>0 items, 0 curated | 1. Render component 2. Query for `.walmart-cart-button` and `#walmart-coverage-count` | Neither element is rendered (not disabled — absent) |
| TC-GLV-004 | Button and coverage text both absent when list is empty | Boundary | Critical | Grocery list with 0 items (M=0) | 1. Render component with empty list | Neither `.walmart-cart-button` nor `#walmart-coverage-count` rendered, not even "0 of 0 items" |
| TC-GLV-005 | Click navigates to exact `buildCartUrl` output | Functional | High | Fixture with curated items | 1. Compute expected `buildCartUrl(items)` 2. Render component 3. Read button's `href` | `href` equals the exact string returned by `buildCartUrl`, byte-for-byte, no additional query params appended |
| TC-GLV-006 | N derives from `getQualifyingItems`, no reimplemented filter | Functional | High | Fixture list | 1. Call `getQualifyingItems(items)` directly, get length 2. Compare to rendered "N of M" numerator | Numerator equals `getQualifyingItems(items).length` exactly |
| TC-GLV-007 | Button renders without affiliate-approval gating | Functional | Medium | No approval-status flag set anywhere in code/config | 1. Render component with ≥1 curated item, no approval flag present | Button still renders per TC-GLV-001 rule; source inspection confirms no gating flag referenced |
| TC-GLV-008 | Recompute on `groceryList` change, not `selectedCards` alone | Functional | Medium | Component mounted with initial list | 1. Change `groceryList` (e.g. add a curated item) 2. Re-render | Coverage count and `cartUrl` update to reflect new list |
| TC-SL-001 | Per-item search link present on curated line | Functional | Critical | Grocery list line for a curated item | 1. Render `GroceryListView` 2. Query that `<li>` for `.grocery-item__search-link` | Link present with `href={buildSearchUrl(item.name)}`, `target="_blank"`, `rel="noopener noreferrer"`, `aria-label="Search for {item.name} (opens in new tab)"`, text "Search" |
| TC-SL-002 | Per-item search link present on uncurated line | Functional | Critical | Grocery list line for an item with no `walmartItemId` | 1. Render component 2. Query that `<li>` | Same link present and correctly targeted, identical treatment to curated line |
| TC-SL-003 | Search link is present on every line across all sections | Functional | High | Grocery list with multiple sections (e.g. produce, dairy) | 1. Render component 2. Query all `<li>` elements for `.grocery-item__search-link` | Every `<li>` in every section has exactly one search link |
| TC-SL-004 | Search link unaffected by stale/delisted `walmartItemId` | Functional | Medium | Item has a curated `walmartItemId` (staleness not detectable client-side) | 1. Render line 2. Read `href` | `href` still points to `buildSearchUrl(item.name)`, independent of cart-link validity |
| TC-SL-005 | `showSourceRecipes` expansion does not duplicate link | Functional | High | Item with source recipes, `showSourceRecipes` toggled expanded | 1. Render collapsed, count search links for that item 2. Expand `showSourceRecipes` sub-list 3. Re-count | Exactly one search link before and after expansion; link stays attached to parent `<li>`, not duplicated per source recipe |

### Definition of Ready Checklist
- [ ] Story is understood by the team
- [ ] Acceptance criteria for 5a, 5b, and 5c are all clear and testable
- [ ] Dependencies identified (5a/5b depend on Stories 2/3; 5c has no code dependency but is gated into this same story)
- [ ] Story is sized and fits within one sprint
- [ ] No unresolved blockers

### Definition of Done (story-level, all three sub-scopes required)
- [ ] 5a acceptance criteria pass, TC-GLV-001–008 and negative cases green
- [ ] 5b acceptance criteria pass, TC-SL-001–005 and negative case green
- [ ] 5c acceptance criteria pass, TC-README-001–003 green
- [ ] Merged/landed to `main` as a single release unit — one PR, or multiple PRs merged back-to-back with no gap where the button is live without the README's documented prerequisite
- [ ] [INVEST check] Larger than a typical single card (5 pts) by design — the merge trades away Independent/Small in exchange for removing the partial-ship risk the challenger identified; still fits within Sprint 2 capacity and is a single coherent, testable, valuable unit (delivers the whole user-facing capability, not a fragment of it)

---

## User Story 6: Style the Cart Button, Coverage Text, and Search Link

**As a** meal planner shopping online
**I want** the new Walmart cart button, coverage count, and search links to look consistent with the rest of the grocery list
**So that** the new controls feel native to the app rather than bolted on

**Story Points:** 1
**Priority:** High

### Acceptance Criteria

Given the cart button
When rendered
Then it reuses `.copy-link-button` verbatim with an empty `.walmart-cart-button` modifier class carrying no new visual properties

Given the coverage-count text
When rendered
Then it reuses `.target-note` verbatim with an empty `.walmart-coverage-count` hook class carrying no styling of its own

Given the per-item search link
When rendered
Then it uses the new `.grocery-item__search-link` class built only from existing tokens (`--text-muted`, `--text`, `--focus-ring`, `--space-2`), with default muted+underlined styling, a hover/focus color shift to `--text`, and a `:focus-visible` outline (3px `--focus-ring`, 2px offset) matching `.copy-link-button:focus-visible`

Given the site's dark-mode theme
When any of the three elements render
Then dark mode is inherited automatically from already-declared token overrides — no new dark-mode-specific rule is added

### Test Cases

| ID | Title | Type | Priority | Preconditions | Steps | Expected Result |
|---|---|---|---|---|---|---|
| TC-CSS-001 | `.walmart-cart-button` adds no new visual properties | Functional | Medium | `src/styles.css` built | 1. Inspect `.walmart-cart-button` rule | Selector exists but declares zero properties (or only inherits `.copy-link-button`); no size/color/spacing override |
| TC-CSS-002 | `.walmart-coverage-count` adds no new visual properties | Functional | Medium | `src/styles.css` built | 1. Inspect `.walmart-coverage-count` rule | Selector exists as an empty hook class; `.target-note` styling applies unmodified |
| TC-CSS-003 | `.grocery-item__search-link` uses only existing tokens | Functional | High | `src/styles.css` built | 1. Inspect `.grocery-item__search-link` rule | Only references `--text-muted`, `--text`, `--focus-ring`, `--space-2`; default muted+underlined; hover/focus shifts color to `--text` |
| TC-CSS-004 | `:focus-visible` outline matches `.copy-link-button` pattern | Functional | Medium | Rendered search link, keyboard focus | 1. Tab-focus the search link 2. Inspect computed outline | 3px `--focus-ring` outline, 2px offset, matching `.copy-link-button:focus-visible` |
| TC-CSS-005 | Dark mode inherits without new rules | Functional | Medium | Site in dark-mode theme | 1. Toggle dark mode 2. Render cart button, coverage text, search link | All three render with dark-mode-appropriate colors via existing token overrides; no new `@media`/dark-mode selector added for these classes (source inspection) |

### Coverage Notes
This story is visual/inspection-based, not logic-branching — test cases are primarily source-inspection plus manual/visual verification in both themes. No new equivalence classes; gap: pixel-level regression (visual diff) is out of scope, left to manual review per Notes/Constraints.

### Definition of Ready Checklist
- [ ] Story is understood by the team
- [ ] Acceptance criteria are clear and testable
- [ ] Dependencies identified
- [ ] Story is sized and fits within one sprint
- [ ] No unresolved blockers

### Notes / Constraints
- Files touched: `src/styles.css` (add `.grocery-item__search-link`, `.walmart-cart-button`, `.walmart-coverage-count` rules, placed near `.target-note`/`.copy-link-button`, around line 315–359).
- Traces NFR-04 (reuse existing design tokens, no new visual language).
- Depends on Story 5 (merged) — markup/class names from sub-scopes 5a and 5b must exist to style against.
- [INVEST check] Small, purely additive CSS, no logic — clean 1-point story.

---

## Story Summary Table

| # | Story | Points | Priority | Build-Order Phase | FR(s) |
|---|-------|--------|----------|--------------------|-------|
| 1 | Curate Walmart item IDs + guard test | 3 | Critical | 1. Data model + curation + guard test | FR-01, NFR-05 (data) |
| 2 | Build `buildCartUrl` + qualification helper | 3 | Critical | 2. walmartLinks.ts core | FR-02 |
| 3 | Build `buildSearchUrl` + key normalizer | 2 | Critical | 2. walmartLinks.ts core | FR-03 |
| 4 | Unit tests for `walmartLinks.ts` | 2 | High | 2. walmartLinks.ts core | NFR-05 (function tests) |
| 5 | Cart button + coverage count + per-item search link + README (merged release unit; sub-scopes 5a/5b/5c) | 5 | Critical | 3. GroceryListView.tsx wiring + 5. README | FR-04, FR-06, FR-07, FR-08 |
| 6 | CSS styling (formerly Story 7) | 1 | High | 4. CSS | NFR-04 |

**Total: 16 points across 6 stories.** (Was 17 points across 8 stories before the merge; Stories 5, 6, and 8 — 3+2+1=6 points — merged into one 5-point story, a 1-point consolidation discount, for a net -1 point overall. Former Story 7 is renumbered Story 6.)

Not decomposed into a separate story: FR-05 (do-not-use-Marketplace/I/O-Affiliate-API constraint) — this is a negative constraint enforced by omission across Stories 2–4, not a buildable unit of work; NFR-01/02/03/06 — cross-cutting constraints verified within the stories above (no server code added, no secrets, pure module, no URL-length cap), not independently valuable stories on their own.

## Open Questions Carried Forward (Not Story-Blocking)

- PRD OQ-1 / OQ-5 (affiliate approval status / ToS-compliance timing) — owned by Product Owner/Legal, due before Stage 7 UAT sign-off. Does not block Stories 1–6; affects only the exact wording finalized in Story 5's sub-scope 5c.
- PRD OQ-4 (staleness-recheck cadence for curated IDs) — non-blocking, explicitly deferrable.
