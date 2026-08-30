## QA Engineer DoD Validation — Stage 2 (Refine)

**Artifact validated:** `.delivery/artifacts/02-refine/po/prd.md`
**Prior round reference:** `.delivery/artifacts/02-refine/qa-evaluator/evaluation-round-2.md` (Gate 2: PASS, all round-1 findings fixed)
**Role:** QA Engineer
**Task Type:** dod-validation | Scope: Stage 2 gate — testability and AC specificity

---

### Gate Criteria Results

| # | Criterion | Result |
|---|-----------|--------|
| 1 | Every FR has Given/When/Then or equivalent specific, testable acceptance criteria | PASS |
| 2 | Edge cases (empty list, invalid/zero quantities, key collisions, URL length, popup blocking) covered by explicit AC or NFR, not left implicit | PASS |
| 3 | No AC uses vague language ("should"/"might"/"could" — must use "must" or present-tense assertions) | PASS |

---

### Criterion 1: Given/When/Then coverage

Checked all 8 FRs (FR-01 through FR-08) in Section 6:

- FR-01: 2 Given/When/Then clauses (unaffected-entries case; all-8-staples verification case).
- FR-02: 6 Given/When/Then clauses (full curation, mixed list, zero-curated, fractional floor, invalid-quantity skip, all-invalid-quantities).
- FR-03: 1 Given/When/Then clause (encoding correctness).
- FR-04: 4 Given/When/Then clauses (≥1 curated, zero-curated-but-M>0, M=0 empty list, click-through navigation).
- FR-05: 1 Given/When/Then clause (code review finds zero credential/OAuth references) — appropriate for a constraint-type requirement.
- FR-06: 2 Given/When/Then clauses (every line has working search link; stale-ID recovery path).
- FR-07: 1 Given/When/Then clause (README states requirement without over-claiming enrollment).
- FR-08: 2 Given/When/Then clauses (button renders pre-approval; search fallback covers rejection).

Every FR has at least one concrete Given/When/Then AC tied to real, inspectable artifacts (source files, README, rendered UI). No FR relies on prose description alone. PASS.

### Criterion 2: Named edge cases

| Edge case | Coverage | Location |
|---|---|---|
| Empty list | Explicit 3-way distinction (curated≥1 / zero-curated-but-M>0 / M=0) with dedicated GWT AC stating button, coverage text, and FR-06 links all render nothing | FR-04 "Empty-list case (M=0)" clause + 3rd AC |
| Invalid/zero quantities | Explicit "Quantity validity gate": 0/negative/NaN/null/undefined → item skipped, never floored to 1, distinguished from valid-fractional-floors-to-1; 2 dedicated GWT ACs plus an all-invalid → `undefined` case | FR-02 clause + AC |
| Key collisions | Explicit data-integrity guard requirement: no two `PURCHASE_UNITS` entries normalize to the same lowercased/trimmed key, called out as a distinct failure mode from malformed-ID format, with a required test case | NFR-05 |
| URL length | Explicitly addressed with reasoning (2000+ char browser tolerance vs. realistic list size) and an explicit decision not to add a code-level cap this release, documented as an accepted/monitored risk rather than left unmentioned | NFR-06 |
| Popup blocking | Explicit requirement that `target="_blank"` alone does not satisfy the NFR; a visible, clickable fallback link must be present; stated as a GWT AC | NFR-07 |

All five named edge cases are addressed by explicit AC or NFR text — none is left to be inferred. NFR-06 (URL length) is the one case resolved as "documented accepted risk, no enforced cap" rather than a pass/fail test, but the gate criterion only requires the edge case be addressed explicitly rather than left implicit; the risk-acceptance rationale is stated plainly with a revisit trigger ("revisit if `PURCHASE_UNITS` grows an order of magnitude"), so this satisfies the criterion. PASS.

### Criterion 3: No vague AC language

Searched the full PRD for "should", "might", "could":

- Line 61 ("should be treated as a distinct internal persona") — inside Open Question OQ-3 narrative, not an AC.
- Line 80 ("a policy question the spike could not resolve") — inside FR-02's spike-findings narrative, not the AC column.
- Line 118 ("Walmart could change or discontinue...") — inside the Dependencies & Risks table's risk description, not an AC.
- Line 137 ("should the README instead state...") — inside Open Question OQ-1, not an AC.
- Line 141 similar — inside Open Question OQ-5 narrative.

None of these occurrences appear inside a Given/When/Then AC clause or an FR/NFR "Acceptance Criteria" column. Every AC clause inspected uses "then it [returns/renders/opens/is/contains]..." present-tense assertions or "must" (e.g., NFR-07: "must not be the only path," "must be present"). PASS — no vague modal language contaminates any acceptance criterion.

---

### Rationale

This is a re-validation following Gate 2 QA-evaluator round 2, which already confirmed all three round-1 gaps (empty list, invalid quantity, FR-01 soft minimum) were fixed. This DoD pass independently re-derived the same conclusion by checking the gate's specific named criteria (GWT presence, the five explicit edge cases, and vague-language scan) directly against the current PRD text rather than relying on the prior evaluation's summary — no regression found, and the additional NFR-06/NFR-07/NFR-05 cross-checks (URL length, popup blocking, key collision) not itemized in the QA-evaluator's round 2 report are confirmed present here.

### Assumptions

- "Equivalent specific, testable acceptance criteria" for FR-05 (a constraint-type requirement) is satisfied by a single code-review-style GWT clause, since a "no negative behavior exists" requirement cannot be tested via multiple positive-path scenarios the way FR-02 can.
- NFR-06's risk-acceptance framing (explicit decision to not add a cap) counts as "covered," per the gate's own wording ("not left implicit") — an explicit decision not to test something is distinct from an omission.

### Gaps / Risks

- None blocking. Open questions OQ-1 and OQ-5 (Impact Radius affiliate/ToS status) remain unresolved but are explicitly scoped as pre-UAT gates in the PRD itself, not testability gaps in this artifact.

---

### Overall DoD Result: PASS

All three Stage 2 QA gate criteria are met. No fix required.
