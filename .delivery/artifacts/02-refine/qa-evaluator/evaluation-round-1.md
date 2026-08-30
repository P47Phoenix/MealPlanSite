## Gate 2 Evaluation: Walmart Cart Integration PRD (Round 1)

**Artifact evaluated:** `.delivery/artifacts/02-refine/po/prd.md`
**Role:** QA

### Criterion Results

| Criterion | Result |
|---|---|
| Requirements testable | PASS |
| Acceptance criteria specific and unambiguous | PASS (minor note) |
| Edge cases considered | FAIL |
| Scope bounded | PASS |

---

### 1. Requirements testable — PASS

Every FR carries Given/When/Then AC tied to concrete artifacts (`buildCartUrl`, `buildSearchUrl`, `GroceryListView.tsx`, `README.md`). FR-05 (constraint, not build item) is testable via source/bundle grep. NFR-02/NFR-05 map to verifiable checks (secret scan, unit test existence). No untestable requirement found.

### 2. Acceptance criteria specific and unambiguous — PASS (minor note)

Most AC give exact formats (URL shape in FR-02, encoding rule in FR-03, button-hide rule in FR-04). One soft spot, not blocking:

- FR-01's data-seeding AC ("as many ... as can be hand-verified ... prioritizing high-frequency staples") sets no minimum count. The test AC only requires "at least one staple ingredient" to have a `walmartItemId" — technically satisfied by seeding just 1 of 23 entries, which would undercut the feature's stated value. PO should consider stating a minimum (e.g., "all 8 named priority staples") if that's the intent, or explicitly confirm "at least 1" is acceptable for launch.

### 3. Edge cases considered — FAIL

Strong coverage of the main edge cases (mixed list, zero-curated list, fractional/below-1 quantity, stale/delisted ID, special characters in search query). Two edge cases are not addressed anywhere in the PRD:

- **Empty grocery list (M=0):** FR-04's "N of M items" coverage text and button-visibility rule are specified for "≥1 curated item" and "zero curated items," but never for a totally empty grocery list (0 items, curated or not). Does the button/count region render at all, or is it hidden? Undefined.
- **Zero or negative computed quantity:** FR-02 specifies "floored at 1" for fractional/below-1 quantities but doesn't state behavior when `item.purchase?.quantity` is `0`, negative, `null`, or `undefined` before the `Math.ceil` fallback — does the item still get floored to 1, or excluded from the cart URL entirely? Ambiguous whether this is a "below 1" case or a distinct one.

### 4. Scope bounded — PASS

Out of Scope (Section 8) is unusually thorough and specific, with named alternatives evaluated and rejected (Instacart, Data Feed API, CrawlFeeds) and reasons given, not just a bare exclusion list. Dependencies/Risks and Open Questions sections keep unresolved items visible without expanding scope to cover them now.

---

### Findings for PO (must address before Gate 2 pass)

- Add explicit AC for the empty-grocery-list case (M=0): state whether the cart button, coverage text, and search links region render, and in what state.
- Add explicit AC for zero/negative/null/undefined computed purchase quantity in `buildCartUrl` — confirm whether it floors to 1 like the fractional case, or is treated as absent/skipped.
- Optional, non-blocking: clarify FR-01's minimum staple-seeding count, or confirm "at least 1" is intentionally the launch bar.
