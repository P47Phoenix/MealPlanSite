## Technical Architecture: Walmart Cart Integration for the Grocery List
## Role: Solution Architect
## Task: design (Light depth)

Traces PRD (`.delivery/artifacts/02-refine/po/prd.md`), UI component-specs.md, UX user-flows.md. This is a formalization/confirmation pass — requirements are already precisely specified; scope here is module boundaries, data flow, formalizing decisions already made upstream, and flagging implementation-sequencing gaps before Dev starts. No new service, no new data store, no new deployment topology.

---

### Prior Art Analysis

| Spec Element | Classification | Rationale |
|---|---|---|
| No backend/server component; static GitHub Pages hosting only | Decision Already Made | PRD NFR-01, FR-05 — architecturally load-bearing constraint, not negotiable |
| Cart mechanism = `affil.walmart.com/cart/addToCart` deep link, no auth | Decision Already Made | PRD FR-02, verified live via spike 2026-08-29 |
| `walmartLinks.ts` pure, framework-free, in `src/lib/` | Decision Already Made | PRD NFR-03, matches `groceryList.ts`/`shareState.ts`/`preferences.ts` convention |
| `PurchaseUnitEntry` extended with optional `walmartItemId: string` | Decision Already Made | PRD FR-01 |
| `buildCartUrl(items): string \| undefined`, `buildSearchUrl(name): string` signatures, URL formats, quantity-validity gate | Decision Already Made | PRD FR-02, FR-03 — exact formats and edge-case behavior specified |
| Cart control is a single `<a href target="_blank" rel="noopener noreferrer">`, no separate fallback element, no `<button onClick={window.open}>` path | Decision Already Made | PRD NFR-07 as resolved by component-specs.md §1/§4 and user-flows.md's Popup-Blocked Edge Case — explicitly locked, "no longer open" | 
| Coverage count `N of M` — N derived from same qualification logic as `buildCartUrl` | Decision Already Made | component-specs.md §2, resolves QA Gap 1 / Architect Warning 1 from a prior review pass |
| Per-item Search link on every line, unconditional | Decision Already Made | PRD FR-06, component-specs.md §3 |
| No new backend detection of affiliate-approval status | Decision Already Made | PRD FR-08 |
| Ingredient key derivation reuse (not reimplementation) between `groceryList.ts` and `walmartLinks.ts` | Open Question (stated as a requirement, no implementation exists yet) | PRD Dependencies & Risks table asserts this as a mitigation, but `groceryList.ts` has no exported key-derivation function today (see §3 below) — this is the one real gap this pass closes |
| Where `.grocery-item__search-link`/`.walmart-cart-button`/`.walmart-coverage-count` CSS rules land in `src/styles.css` | Decision Already Made (placement), Open (exact insertion point) | component-specs.md says "near `.target-note`/`.copy-link-button`, around line 315-359" — advisory, Dev confirms exact line at implementation time |

No blockers found against any Decision Already Made element. This pass builds on the existing design; §3 below fills the one real gap (key-derivation coupling) and flags sequencing/risk items the PRD/design artifacts didn't fully close.

---

### 1. Module Boundaries

Three touch points, all additive, no existing module's public contract changes shape:

**`src/data/purchaseUnits.ts` (extend, do not restructure)**
- Add optional `walmartItemId?: string` to `PurchaseUnitEntry`.
- Populate for the 8 named priority staples minimum (FR-01): `chicken breast`, `eggs`, `olive oil`, `garlic`, `onion`, `brown rice`, `canned tuna`, `greek yogurt` — all already exist as keys in `PURCHASE_UNITS` today, so this is a same-object field addition on existing entries, not new entries.
- No consumer of `PURCHASE_UNITS` outside this feature reads the new field, so this extension is backward-compatible by construction — `computePurchaseQuantity` and `groceryList.ts` are untouched.

**`src/lib/walmartLinks.ts` (new module)**
- Pure, framework-free (no React import), matching `shareState.ts`/`preferences.ts` conventions: defensive, no throw on bad input, no side effects, fully unit-testable in isolation.
- Exports: `buildCartUrl(items: GroceryItem[]): string | undefined`, `buildSearchUrl(itemName: string): string`.
- Internal-only export candidate: a qualification helper (e.g. `getQualifyingItems(items)`) that both `buildCartUrl` and `GroceryListView.tsx`'s coverage-count computation call, per component-specs.md §2's "single source of truth" contract. This MUST be exported (not just an internal closure) — `GroceryListView.tsx` needs it directly to compute N without reimplementing the qualification check.
- Depends on: `PURCHASE_UNITS` (read-only, from `purchaseUnits.ts`), `GroceryItem` type (from `groceryList.ts`). Introduces no new type into `groceryList.ts` or `purchaseUnits.ts` beyond the one field above — `walmartLinks.ts` is the sole owner of Walmart URL-building logic, keeping the boundary clean: `groceryList.ts` knows nothing about Walmart, `purchaseUnits.ts` only carries the ID as inert data.

**`src/components/GroceryListView.tsx` (extend existing component)**
- Add: cart `<a>` element in `.grocery-panel__header` (beside `.copy-link-button` siblings), coverage `<span id="walmart-coverage-count">`, per-item `<a class="grocery-item__search-link">` appended to each `<li>`'s text run.
- Compute `cartUrl = buildCartUrl(allItems)` and `{curatedCount, totalCount}` once per render via `useMemo`, keyed on the same dependency (`groceryList`/`selectedCards`) the existing `groceryList` memo already uses — no new state, no new effect. This is a derived-value addition, same shape as the existing `totals` memo already in the file.
- `allItems` must be the flattened list across all sections (`sectionEntries.flatMap(([, items]) => items)`), not per-section — cart button and coverage count are panel-header-level, not section-level.
- No changes to `preferences.ts`, `shareState.ts`, or the display-mode/show-source-recipes state machine — this feature is orthogonal to those.

**`src/styles.css` (extend)**
- New rules for `.grocery-item__search-link` (and empty modifier hooks `.walmart-cart-button`, `.walmart-coverage-count`) placed near `.target-note`/`.copy-link-button` per component-specs.md. No new tokens.

No fourth module is touched. `README.md` gets a documentation addition (FR-07) — not an architectural change, noted for completeness only.

---

### 2. Data Flow

```
selectedCards (MealCard[])
   |
   v  (existing, unchanged)
buildGroceryList()  [groceryList.ts]
   |
   v
GroceryList  { produce: GroceryItem[], protein: GroceryItem[], ... }
   |
   v  (new: GroceryListView.tsx flattens sections)
GroceryItem[]  (all items, panel-header scope)
   |
   |-----------------------------------------------.
   v                                                v
buildCartUrl(items)              [walmartLinks.ts]  buildSearchUrl(item.name)  [walmartLinks.ts, per item]
   |  for each item:                                    |  no lookup, always succeeds
   |    key = item.name.trim().toLowerCase()             |
   |    entry = PURCHASE_UNITS[key]                       v
   |    skip if !entry?.walmartItemId                 `https://www.walmart.com/search?q=<encoded name>`
   |    qty = item.purchase?.quantity                      |
   |          ?? Math.ceil(item.quantity)                  v
   |    skip if qty invalid (<=0, NaN, null, undefined) per-item <a href> (every <li>, unconditional)
   |    else floor to >=1 if fractional
   v
string | undefined
   |
   v
GroceryListView.tsx: cartUrl
   |
   |-- defined --> render <a class="copy-link-button walmart-cart-button" href={cartUrl}
   |                  target="_blank" rel="noopener noreferrer">, plus coverage <span>
   |                  N (from same qualifying-items helper) of M (flattened item count)
   |
   `-- undefined --> render nothing (no button, no coverage span) — same code path
                      for zero-coverage (M>0, N=0) and empty-list (M=0)
```

Key derivation confirmed exact-match, no drift risk from casing: `groceryList.ts` line 102-103 sets `key = shoppingName.trim().toLowerCase()` and stores `displayName = shoppingName` (trimmed, un-lowercased) as `GroceryItem.name`. So `item.name.trim().toLowerCase()` in `walmartLinks.ts` reproduces the exact same key `PURCHASE_UNITS` is indexed by — no title-casing, no punctuation stripping, no other transform sits between them today. This closes the coupling risk in principle, but the derivation is currently *duplicated* rather than *shared* — see §3.

---

### 2a. Architecture Decision — Cart Control Is a Single Anchor (Formalized, Not Relitigated)

This decision was made upstream (component-specs.md §1/§4, user-flows.md's Popup-Blocked Edge Case) and is carried through here as-is, for Dev's benefit as a single authoritative statement, not reopened:

**Decision:** the "Add all to Walmart cart" control is exactly one DOM element: `<a class="copy-link-button walmart-cart-button" href={cartUrl} target="_blank" rel="noopener noreferrer" aria-label="Add all to Walmart cart (opens in new tab)" aria-describedby="walmart-coverage-count">`. There is no `<button onClick={() => window.open(cartUrl)}>` implementation path anywhere in this feature, and no second, conditionally-rendered fallback element (`.walmart-cart-fallback-link` or equivalent) exists or is to be built.

**Why this satisfies NFR-07 architecturally:** a native anchor's activation is a direct user gesture. Browsers block script-initiated `window.open()` calls as popups; they do not block direct-gesture anchor navigation the same way. A blocked popup on this control degrades at most to "no new tab auto-opened" — the element itself never disappears, was clickable before the click, and remains clickable (repeat click, right-click-open-in-new-tab, keyboard Enter) after. This means NFR-07's "visible fallback must be present" requirement is satisfied by the primary element's own nature, not by an additional element Dev has to build and keep in sync.

**Implementation implication for Dev:** do not build a `window.open()` variant "for consistency with the Copy link/Copy list buttons" (which are `<button onClick>` because they call `navigator.clipboard`, an inherently async/imperative API with no href to point at). The cart and search links are declarative navigations with a known href at render time — they get `<a href>`, full stop. Mixing control types here would reopen the exact popup-blocking failure mode this decision closes.

**Rejected alternative (carried from component-specs.md, restated for completeness):** `<button onClick={window.open}>` + conditional `.walmart-cart-fallback-link` — rejected because return-value-based popup-block detection is unreliable across browsers/extensions, and it introduces two DOM shapes for one action with no benefit over a single always-present anchor.

---

### 3. Technical Risks and Sequencing Concerns Not Fully Closed by PRD/Design

The PRD and design artifacts are thorough; the items below are the residue after that review — mostly small, one worth a concrete Dev instruction.

1. **Key-derivation duplication (the one real gap).** `groceryList.ts`'s key logic (`shoppingName.trim().toLowerCase()`) is inline at line 102-103, not exported. PRD's own Dependencies & Risks table states the mitigation as "reusing/exporting the existing key-derivation function rather than reimplementing it," but no such function exists to import today. Recommendation for Dev (Light-weight, ~2-line change): export a `normalizeIngredientKey(name: string): string` from `groceryList.ts` (or a shared tiny util) and have both `groceryList.ts`'s aggregation and `walmartLinks.ts`'s lookup call it. This is cheap now and eliminates a silent-divergence risk later (e.g., if `groceryList.ts` ever adds punctuation-stripping or accent-folding to its key logic, `walmartLinks.ts` would silently stop matching curated items unless it shares the same function). Until this export exists, `walmartLinks.ts` inlining `.trim().toLowerCase()` is behaviorally correct today but is coupled-by-convention, not by-contract — flag as a one-line follow-up, not a blocker.

2. **Qualifying-items helper must be a genuine shared function, not two independent implementations.** component-specs.md §2 mandates N (coverage count) and `buildCartUrl`'s item selection use identical logic. The straightforward way to guarantee this in `walmartLinks.ts` is to write `buildCartUrl` as a thin wrapper around an exported `getQualifyingItems(items: GroceryItem[]): { id: string; qty: number }[]` (or similar), with `GroceryListView.tsx` calling `getQualifyingItems(...).length` for N. Flagging explicitly because it is easy for Dev to satisfy the two ACs (FR-02's URL content, component-specs.md's count) with two separately-written filters that happen to agree today and drift later — the module design should make drift structurally impossible, not just currently absent.

3. **`useMemo` dependency correctness.** `cartUrl`/`curatedCount`/`totalCount` must be recomputed whenever `groceryList` changes (same trigger as the existing `groceryList` `useMemo`), not independently keyed off `selectedCards` in a way that could desync if `groceryList`'s memo and the new memo ever get different dependency arrays. Cheapest safe implementation: derive `allItems` and the Walmart values inside the same `useMemo` block that already produces `groceryList`, or a second `useMemo` keyed on `[groceryList]` (the object, not `selectedCards`) so there is one source of truth for "what changed."

4. **`walmartItemId` staleness / package-size drift** — already accepted risk in PRD (OQ-4, Out of Scope), no architectural action needed this release; noted only to confirm it's not silently reintroduced as an implicit requirement during implementation. No caching, no validation-at-build-time is in scope.

5. **URL length (NFR-06)** — PRD already accepts this as unbounded/monitored, not gated. No architectural concern at current `PURCHASE_UNITS` scale (23 entries); revisit only if that data set grows an order of magnitude, per PRD's own note.

6. **Endpoint longevity (`affil.walmart.com/cart/addToCart`)** — external risk, already documented in PRD Dependencies & Risks with the correct mitigation (search fallback is endpoint-format-independent). No code-level mitigation is architecturally possible from a static site; nothing further to add here.

7. **Test placement.** NFR-05 requires unit tests for `walmartLinks.ts` and a data-integrity guard test for `purchaseUnits.ts` (non-empty digit-string IDs, no key collisions). Sequencing note for Dev: write the `purchaseUnits.ts` guard test before hand-curating the 8 staples' IDs so key-collision/format mistakes are caught at data-entry time, not after `walmartLinks.ts` is built on top of bad data.

None of the above changes any FR/NFR or reopens a UI/UX decision — they are implementation-sequencing guidance so Dev doesn't have to make an unstated call mid-build.

---

### 4. Assumptions

- `GroceryItem.name` remains the trimmed, non-lowercased `shoppingName`/`name` as currently implemented in `groceryList.ts` — if that shape changes, `walmartLinks.ts`'s lookup key derivation must change with it (reinforces §3 item 1).
- No new environment/build-config surface is needed — `walmartItemId` values are literal strings in `purchaseUnits.ts`, not sourced from env vars or a config file.
- `URLSearchParams` (used for cart-URL encoding per FR-02) is available in all target browsers per the project's existing baseline (already relied on by `shareState.ts`) — no new browser-support risk introduced.

### 5. Risks (Summary)

| Risk | Severity | Mitigation |
|---|---|---|
| Key-derivation logic duplicated between `groceryList.ts` and `walmartLinks.ts` | Low-Medium (silent future drift, not a launch blocker) | Export shared `normalizeIngredientKey` (§3.1) — recommended before or during this feature's Dev pass |
| Coverage-count and cart-URL qualification logic implemented as two independent filters | Low-Medium (same class of risk as above) | Single exported qualification helper both call (§3.2) |
| `useMemo` dependency desync between existing `groceryList` memo and new Walmart-derived memo | Low | Derive from `[groceryList]`, not `[selectedCards]` independently (§3.3) |
| Walmart endpoint/ToS/affiliate-approval risks (OQ-1, OQ-5, endpoint longevity) | External, already governed | No architectural action this release — PRD's mitigations (search fallback, README documentation) stand as-is |

### 6. Open Questions Carried Forward (Not New)

- OQ-1, OQ-5 (affiliate approval / ToS-compliance timing) — Product Owner/Legal, per PRD, before Stage 7 UAT sign-off. No architectural dependency; feature ships functionally regardless per FR-08.
- OQ-4 (staleness-recheck cadence) — Product Owner, non-blocking for this Dev pass.

### 7. Downstream Notes for Development

- Build order suggestion (not a hard requirement): (1) extend `PurchaseUnitEntry` + curate the 8 staples + write the data-integrity guard test (NFR-05, §3.7), (2) build `walmartLinks.ts` with the shared qualification helper (§3.2) and, ideally, the exported key-normalizer (§3.1), (3) wire `GroceryListView.tsx` off the single `useMemo` (§3.3), (4) add CSS per component-specs.md placement guidance, (5) README update (FR-07).
- The anchor-only cart control (§2a) is not an open implementation choice — build it as specified, do not introduce a `window.open()` path.
- No test double / mock server is needed for `walmartLinks.ts` tests — it is pure and synchronous; assert on returned string content directly per NFR-05's enumerated branches.
