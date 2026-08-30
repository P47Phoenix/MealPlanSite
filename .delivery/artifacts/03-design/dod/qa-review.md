## QA DoD Validation: Walmart Cart Integration -- Stage 3 Re-Validation
## Role: QA Engineer
## Task: dod-validation

Task Type: dod-validation | References: test-case-patterns.md | Scope: verify the two WARN findings from `.delivery/artifacts/03-design/review-board/qa-review.md` were actually resolved in the revised `.delivery/artifacts/03-design/ui/component-specs.md`, not merely claimed resolved.

---

### Verdict: **PASS**

Both ambiguities identified in the earlier review-board pass are resolved in the revision with specific, checkable language -- not just an assertion of "resolved" in prose. Each is verified below against the original finding's own bar ("could two engineers implement it differently and both claim compliance").

---

### Finding 1 -- Coverage-count numerator/denominator definition

**Original finding:** FR-04's AC said "accurate" / "curated-vs-total" without stating whether N counts items with a populated `walmartItemId` or items that actually survive FR-02's quantity-validity gate. Two compliant-looking builds could produce different numbers (e.g., "9 of 14" vs "8 of 14").

**What the revision actually says** (component-specs.md section 2, "Single source of truth for 'N of M'"):

- N (numerator) is explicitly defined as items with a defined `walmartItemId` **and** a quantity that survives FR-02's validity gate -- the same qualification `buildCartUrl` applies. The doc states the "walmartItemId-only" reading explicitly as the wrong reading and rules it out: "An item with a `walmartItemId` but an invalid quantity is **not** counted in N."
- M (denominator) is explicitly defined as every rendered `<li>`, curated or not.
- An **implementation contract** goes further than a definition in prose: it requires `curatedCount` be derived from the same qualification logic `buildCartUrl` uses (shared helper, e.g. `getQualifyingItems(items)`, or the literal items array `buildCartUrl` consumed), and explicitly forbids a parallel/independent check that could drift out of sync.

This closes the gap the original finding identified precisely (it directly rebuts the "walmartItemId presence alone" reading by name) and goes beyond a definition to a structural implementation constraint that prevents two engineers from independently re-deriving divergent logic. A QA test case can now be written unambiguously: construct a list with items that have `walmartItemId` but invalid quantity, assert N excludes them.

**Verdict: PASS** -- resolved, specific, unambiguous, and testable as a single case.

---

### Finding 2 -- NFR-07 fallback DOM shape (Path A vs Path B)

**Original finding:** All three Stage-3 docs left the cart control as either a real `<a href>` (satisfies NFR-07 "by construction," no second element) or a `<button onClick={window.open}>` with a conditional `.walmart-cart-fallback-link` element -- an unresolved engineering decision. No single DOM query could be written for NFR-07 until that choice was locked.

**What the revision actually says:**

- Section 1 states the implementation contract as definitive, not conditional: "the 'Add all to Walmart cart' trigger IS a real `<a href={cartUrl}...>` element... There is no separate `<button onClick={...}>` implementation path and no separate fallback-link element to build alongside it."
- Section 4 is retitled "Popup-blocked fallback (NFR-07) -- resolved by construction, no separate element" and states explicitly: "This is no longer an open 'button vs anchor' question... no engineering decision left to confirm."
- The States/Variants table's Fallback row states the DOM shape as a single fact, not a conditional: "No separate element... The cart button itself is the fallback."
- The Design Rationale table records the alternative (`<button onClick>` + conditional fallback) as considered and rejected, with a reason, rather than left open.
- The Follow-Up section explicitly marks this "Resolved, no longer open," distinct from other genuinely-still-open items in the same list (crowding verification, manual a11y pass) -- so the resolution isn't just asserted at the top of the doc while stale "if... then" language survives elsewhere. A search of the file confirms no remaining conditional framing ("if the button is `<button onClick`, "if engineering decides") tied to this decision anywhere in the document.

This gives QA exactly one DOM query to assert: an `<a class="copy-link-button walmart-cart-button" href=... target="_blank">` is present whenever `buildCartUrl` returns a value, and no `.walmart-cart-fallback-link` element exists anywhere in the DOM, ever. That is a single unambiguous test case, satisfying the original finding's own bar.

The original review's secondary point -- that NFR-07's popup-blocked trigger has no automatable simulation path -- is unrelated to the DOM-shape ambiguity and was never something the revision needed to fix; the revision correctly leaves this as a manual/exploratory item and the Follow-Up section explicitly carries this forward ("NFR-07 verification is manual/exploratory only (per QA review)"), consistent with the original review's own recommendation.

**Verdict: PASS** -- resolved, specific, unambiguous, and testable as a single case. The manual-verification classification for the popup-block trigger itself (not a DOM-shape ambiguity) is correctly preserved rather than dropped.

---

### Non-blocking items carried forward (unchanged, not part of this re-validation's scope)

- The "no reserved whitespace/layout gap" numeric-tolerance note from the original review remains a minor, non-blocking item (visual-regression snapshot threshold undefined). It was never blocking and is unaffected by this revision.

---

### Overall DoD Verdict: **PASS**

Both originally-flagged ambiguities are fixed with specific, checkable language that rules out the alternate reading by name (not just a claim of "resolved"), and each closes to exactly one unambiguous test case. No new ambiguity was introduced by the revision. Stage 3 design artifacts meet the QA Definition of Done for testability.

### Assumptions

- Scope of this re-validation is limited to verifying the two specific findings from the prior review-board pass; it does not re-run a full testability audit of the entire component-specs.md (that was already done and is not being re-litigated here).
- "Resolved" was accepted only where the revised text itself rules out the ambiguous alternate reading by name and provides a structural (not merely descriptive) constraint preventing divergent implementations -- consistent with the bar the original review applied.
