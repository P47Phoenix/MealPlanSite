# QA Definition of Done Review: Walmart Cart Integration Sprint Plan

**Role:** QA (Quality)
**Task Type:** dod-validation
**Scope:** Validate final sprint plan, stories, and test strategy against QA DoD — test strategy covers critical paths.

Artifacts reviewed:
- `.delivery/artifacts/05-plan/po/stories.md`
- `.delivery/artifacts/05-plan/qa/test-strategy.md`
- `.delivery/artifacts/05-plan/sm/sprint-plan.md`

---

## Gate Criterion 1: Merged Story 5+6+8 test cases cover all three original stories' test cases without loss

**Result: PASS**

`stories.md` User Story 5 ("Merged Release Unit") retains all three original scopes as sub-sections with their full test-case tables intact:

- **5a (cart button + coverage count, originally Story 5):** TC-GLV-001 through TC-GLV-008, plus negative cases TC-GLV-N01/N02 (lines 305–323).
- **5b (per-item search links, originally Story 6):** TC-SL-001 through TC-SL-005, plus negative case TC-SL-N01 (lines 344–358).
- **5c (README, originally Story 8):** TC-README-001 through TC-README-003 (lines 379–385).

A second table, explicitly labeled "Test Cases (5a, 5b — unchanged from original Stories 5 and 6)" (lines 389–405), reproduces TC-GLV-001–008 and TC-SL-001–005 verbatim — confirming byte-for-byte the merge did not drop or reword any case. The story-level Definition of Done (lines 414–419) requires all three sub-scopes' test cases green before the story is Done, and explicitly ties the merge rationale to preventing partial shipment rather than to reducing test scope ("the underlying acceptance criteria and test cases are unchanged and unreduced," line 276). No test case ID present in the pre-merge set is missing post-merge.

---

## Gate Criterion 2: Critical paths remain covered (buildCartUrl branches, buildSearchUrl encoding, purchaseUnits.ts guard test)

**Result: PASS**

- **`buildCartUrl` branches:** Story 2 test cases TC-CART-001–008 cover all 6 branches named in PRD NFR-05 (all-curated, mixed, zero-curated, fractional floor, invalid-quantity skip, all-invalid) plus the shared-qualification-helper check and empty-array boundary. Story 4 (TC-COV-001) re-verifies all 6 branches land as passing assertions in `walmartLinks.test.ts`. `test-strategy.md` Exit Criteria (line 43) explicitly requires "All NFR-05-listed branches (6 `buildCartUrl` branches...) have passing unit tests," and the Risk Assessment table (line 24) rates this the top likelihood/impact risk with mitigation tied directly to TC-CART-001–008, CI-gated.
- **`buildSearchUrl` encoding:** Story 3 test cases TC-SEARCH-001–005 cover plain-name encoding, special-character encoding, always-defined behavior, normalizer consistency, and empty-string boundary, plus negative cases for Unicode and ampersand handling. `test-strategy.md` Exit Criteria (line 43) names "`buildSearchUrl` encoding" explicitly.
- **`purchaseUnits.ts` guard test:** Story 1 test cases TC-PU-004–007 (guard fails on empty ID, non-digit ID, key collision; guard passes on clean data) plus negative cases TC-PU-N01–N03. `test-strategy.md` Exit Criteria (line 44) requires the guard to "pass against real curated data (0 failures) and independently proven to fail against each of the 3 negative fixtures," matching the story's test cases exactly. The Approach section (lines 58, 66) confirms this guard is sequenced first (shift-left) and is CI-gated as an unconditional unit test, not deferred to manual/release-only checking.

All three critical paths are named explicitly in both the stories' test-case tables and the test strategy's Exit Criteria and Risk Assessment, with no gap between what's claimed covered and what's enumerated.

---

## Gate Criterion 3: Recurring-verification-checklist item is honestly labeled, not overclaimed as "resolved"

**Result: PASS**

`sprint-plan.md` Risks to Sprint Goal (line 75) labels the live/manual cart-verification habit as: **"Acknowledged, unenforced process discipline — a manual habit, not a gate."** It states plainly: "No checklist file, CI check, or branch-protection rule exists today, and none is being added by this plan... If it lapses, nothing in this plan catches it — that is a known, accepted gap, stated plainly rather than dressed up as a resolved risk."

This labeling is reinforced consistently elsewhere:
- Sprint-level DoD (line 110): "The recurring manual-verification habit... is carried forward explicitly into Sprint 2 as acknowledged, unenforced process discipline — not as a resolved gate."
- `test-strategy.md` (line 62): treats the FR-02 spike as "prior evidence, not a substitute for the pre-release manual pass," and states each release "still needs its own manual check rather than trusting the spike indefinitely" — consistent with an open, ongoing risk rather than a closed one.
- Risk Assessment table in `test-strategy.md` (line 31): `walmartItemId` staleness is listed as "Accepted risk, out of automated scope" — not marked resolved.

No artifact reviewed asserts this item is "resolved," "closed," or "mitigated" in a way that overstates its actual (unenforced, habit-only) status. The language consistently signals an accepted, ongoing gap.

---

## Overall Verdict

**PASS — all three gate criteria satisfied.** No fixes required.
