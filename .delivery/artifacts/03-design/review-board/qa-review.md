## QA Design Review: Walmart Cart Integration -- Stage 3 Testability Audit
## Role: QA Engineer
## Task: design-review

Task Type: design-review | References: test-case-patterns.md, test-strategy.md | Scope: testability audit of user-flows.md, wireframes.md, component-specs.md against prd.md

---

### Verdict: **WARN**

The majority of states (button visible/hidden, Search-link href, cart-URL format) are specified precisely enough to convert directly into test cases with a single unambiguous expected result. Two gaps are real enough that two engineers could each implement a compliant-looking build and produce different, contradictory outputs on the same test input. Neither gap invalidates the whole design, so this does not rise to BLOCK, but both must be resolved before test cases are finalized -- otherwise QA will be forced to write two divergent test suites and guess which one is "correct."

---

### What Is Testable As-Is

| Behavior | Source | Verdict |
|---|---|---|
| Button renders iff `buildCartUrl(...)` returns a defined string | FR-04 AC, component-specs.md States table | Clear -- single boolean condition, directly assertable |
| Button absent (not disabled/greyed) at zero-coverage and empty-list | FR-04 AC, wireframes State C/D | Clear -- explicit negative assertion ("not rendered at all," "no reserved whitespace") |
| Cart URL format: `https://affil.walmart.com/cart/addToCart?items=ID\|QTY,ID2\|QTY2` | FR-02 | Clear -- exact format, exact encoding method (`URLSearchParams`) named |
| Quantity resolution and flooring rules (fallback chain, floor at 1, skip on 0/negative/NaN/null/undefined) | FR-02 AC | Clear -- every branch has an explicit Given/When/Then, including the "never floored to 1 when invalid" negative case |
| Search link href: `https://www.walmart.com/search?q=<encoded name>` | FR-03, component-specs.md #3 | Clear -- exact format, unconditional presence on every line |
| Search link label text is literally "Search" | wireframes.md, component-specs.md | Clear -- exact string given, not "approximately" or "similar to" |
| Search link present on every `<li>` regardless of curation state, including under expanded `showSourceRecipes` | FR-06, wireframes Error/Edge table | Clear -- single element, single position rule ("stays on parent `<li>`, never duplicated") |
| Coverage text renders only paired 1:1 with the button (never standalone, never "0 of M") | FR-04 AC, component-specs.md States table | Clear -- binary co-occurrence rule |
| `target="_blank" rel="noopener noreferrer"` on both button and Search link | FR-04, FR-06, component-specs.md | Clear -- exact attribute values named |
| Focus-visible outline: 3px `--focus-ring`, 2px offset | component-specs.md Accessibility | Clear -- exact numeric values, directly assertable via computed style |

---

### Gap 1 -- Coverage-count numerator is not unambiguously defined (BLOCKING for that specific test case)

FR-04's AC says the count must be "accurate" and match "the list's actual curated-vs-total ratio." Neither the PRD nor the UI spec states, in one place, what "curated" means once FR-02's quantity-validity gate is factored in.

- FR-02 explicitly treats an item with an invalid resolved quantity (0/negative/NaN/null/undefined) as **skipped from the cart URL entirely** -- "same as an item with no `walmartItemId`."
- FR-04's AC, by contrast, only says the count should reflect "curated-vs-total," which on a literal reading could mean "has a populated `walmartItemId` field" -- a check that does **not** look at quantity validity at all.
- user-flows.md's own Error and Edge Cases table flags this directly: *"Coverage count 'N of M' should reflect items that actually got included in the URL, not merely items with a populated walmartItemId, or the count becomes dishonest for this edge case -- flagging as a UI-detail open question below."*

This means two engineers can both point at FR-04's AC and claim compliance while producing different numbers for the same input list (e.g., 9 items have a `walmartItemId` but 1 of those resolves to quantity `0` -- one implementation shows "9 of 14," the other "8 of 14"). A QA test case that asserts "coverage text reads exactly 'N of M items'" cannot be written today without knowing which counting rule was built, and a passing implementation of either rule would look correct against the AC text as written.

**Recommendation:** PRD/FR-04 AC needs one sentence added: "N = count of items actually present in `buildCartUrl`'s output (i.e., passed the FR-02 quantity-validity gate), not merely items with a populated `walmartItemId`." Until that line exists, this specific assertion is BLOCKED as a test case -- everything else in the coverage-count spec (positioning, muted styling, absence rule) is fine.

### Gap 2 -- NFR-07 fallback element is spec'd as two mutually exclusive DOM shapes, unresolved at design-freeze (WARN)

All three design docs (user-flows.md, wireframes.md, component-specs.md) present NFR-07 compliance as an either/or, contingent on an engineering decision not yet made:

- **Path A (recommended):** button itself is `<a href={cartUrl} target="_blank">`. No separate fallback element exists in the DOM at all -- satisfied "by construction."
- **Path B (if button is `<button onClick={window.open}>`):** a second, always-visible element `.copy-confirmation.walmart-cart-fallback-link` with text "Open Walmart cart" must render adjacent to the button.

Both paths are explicitly still open per each document's own "Follow-Up" section ("Confirm with engineering whether the cart action is implemented as `<a href>` or `<button onClick={window.open}>`"). This is a legitimate design choice, not sloppiness -- but it means **no single test case for NFR-07 can be written from the current artifacts.** A test asserting "a `.walmart-cart-fallback-link` element is present" passes under Path B and incorrectly fails (element genuinely absent) under Path A; a test asserting "the button href is directly reachable via left-click regardless of popup blocker" is the only formulation that is implementation-agnostic and should be preferred -- but that reframing isn't written anywhere in the artifacts as the actual acceptance criterion. As written, QA cannot pin an exact DOM query to NFR-07 until engineering's choice is recorded, and cannot yet tell whether "fallback element present" or "fallback element absent" is the passing state for a given build.

Additionally: NFR-07's underlying trigger ("browser or extension blocks `target="_blank"`") has no reliable, deterministic way to simulate in an automated test -- popup-blocking behavior is browser/extension-specific and not scriptable from Playwright/Cypress in the general case. This isn't a design ambiguity (the design correctly avoids depending on JS-side detection), but it does mean this AC is **manual/exploratory-only test territory**, not automatable as currently scoped. Recommend the test strategy explicitly classify NFR-07 verification as a manual check (e.g., install a known popup-blocking extension, click, confirm fallback reachable) rather than leaving it implied as automatable alongside the rest of NFR-05's unit-test suite.

**Recommendation:** Once engineering locks in Path A vs. B, update component-specs.md section 4's "if... " framing into a single declarative spec, and add one line to NFR-07's AC in the PRD naming the manual verification method for popup-blocking, since no automated trigger exists.

### Minor Note (non-blocking) -- "no reserved whitespace/layout gap" is not a numeric assertion

component-specs.md's States table says the hidden button leaves "no reserved whitespace/layout gap." This is directionally clear and testable via visual regression snapshot, but has no numeric tolerance defined (e.g., pixel diff threshold). Not blocking -- standard snapshot-testing practice covers this -- but flagging so the automation strategy doesn't skip a threshold definition when this becomes a visual regression test.

---

### Flow-to-Test-Case Mapping Check

Ran each of the four documented flows plus the popup-blocked edge case through "can this become one unambiguous test case":

| Flow | Testable as one case? | Notes |
|---|---|---|
| Flow 1 -- Primary (button click -> new tab) | Yes | Deterministic input (curated items) -> deterministic URL output, per FR-02's exact format |
| Flow 2 -- Fallback Search link | Yes | Single href format, unconditional presence, no branching |
| Flow 3 -- Zero-coverage | Yes | Binary absence assertion, exact same treatment as Flow 4 (explicitly stated) |
| Flow 4 -- Empty-list | Yes | Explicitly a subset of Flow 3's visual treatment per the doc's own note; existing empty-state behavior is out of scope and unchanged |
| Popup-blocked edge case | **No -- see Gap 2** | Contingent on unresolved implementation choice; underlying trigger is not automatable |

---

### Assumptions

- This review evaluates testability only, not requirement correctness, UX quality, or accessibility completeness (those are other review board seats' concerns).
- "Two engineers could implement it differently and both claim compliance" was applied as the literal bar for BLOCK vs. WARN vs. APPROVE per the task instructions; Gap 1 meets that bar for one specific assertion (coverage-count numerator), Gap 2 meets it for one specific element (fallback link) but is already flagged as pending in the artifacts themselves, which is why the overall verdict is WARN rather than BLOCK.
- Assumed the reviewer should score the artifact set holistically (WARN) rather than issuing a hard BLOCK on the whole design, since 9 of the ~11 distinct testable behaviors surveyed have zero ambiguity and the two gaps found are narrow, named, and already partially self-identified by the UX author.

### Risks / Gaps Summary

1. **Blocking for one test case:** coverage-count numerator definition (walmartItemId presence vs. FR-02-gated inclusion) is undefined across FR-04's AC and the UX flow doc's own flagged open question.
2. **Blocking for one test case:** NFR-07 fallback DOM shape depends on an unresolved engineering implementation choice (Path A vs. Path B), so no single query/assertion can be written yet.
3. **Process gap:** NFR-07's popup-blocked trigger has no automatable simulation path; test strategy should classify it manual/exploratory rather than assume it lands in an automated regression suite.
4. **Minor:** "no layout gap" assertion needs a numeric snapshot-diff threshold defined before automation, not before this review passes.

---

### Recommendation to Delivery Pipeline

Do not re-run the full design stage. Route Gap 1 back to Product Owner for a one-line AC clarification on FR-04's coverage-count definition, and route Gap 2 to Engineering (Stage 4/Architect or Stage 6/Development kickoff) to lock the `<a>` vs. `<button>` decision before story acceptance criteria are finalized for the cart-button story. Both are narrow, low-effort fixes; neither requires redesigning the wireframes or component specs.
