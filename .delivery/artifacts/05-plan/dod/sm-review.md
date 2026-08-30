# Scrum Bag DoD Review: Sprint 1 Plan (Walmart Cart Integration) — Round 2

**Reviewer role:** Scrum Bag (SM)
**Artifact reviewed:** `.delivery/artifacts/05-plan/sm/sprint-plan.md` (revised)
**Round:** 2 of up to 3 — re-validating the single round-1 FAIL (Criterion 2)
**Date:** 2026-08-29

---

## Criterion 1 — Process soundness / capacity honesty (false-citation fix)

**Verdict: PASS** (unchanged from round 1 — not in scope for this round, re-confirmed on read)

- Capacity Matrix "Historical velocity (hrs/point)" row (line 23) still correctly states the 0.8 hr/point figure is SM's own estimate, not sourced from `architecture.md` or any document, and explicitly disclaims the earlier mis-attribution.
- Risks table (line 73) repeats this with a mitigation (track actual hours, recalibrate at retro).

No regression introduced by the round-2 edit.

---

## Criterion 2 — Capacity matrix + utilization threshold enforcement

**Verdict: PASS** (was FAIL in round 1 — fix verified present and correct)

**Round-1 finding being re-checked:** the plan calculated and flagged 128% utilization for the full 16-point backlog, but never explicitly calculated/flagged the committed-subset utilization (11/12.5 = 88%) against the same >80% WARNING threshold.

**Verification of the fix — read directly from the revised file, not taken on claim:**

- Line 43: `**Total Committed:** 11 points (well under the 12.5-point ceiling, leaving realistic slack for a solo contributor).`
- Line 45 (new line, immediately following): `**Committed utilization: 11/12.5 = 88%. WARNING: >80% threshold reached.** Accepted: still well under the 100% blocking threshold, and the 1.5-point gap to ceiling is real buffer for a below-average week. Flagged here explicitly, not just described qualitatively, per gate rules.`

**Checks performed on the added line itself:**
1. **Arithmetic correct:** 11 / 12.5 = 0.88 = 88%. Confirmed correct.
2. **Threshold correctly applied:** 88% > 80% → WARNING tier (not >100% blocking tier) — correctly classified and correctly labeled "WARNING," matching the gate's two-tier rule (>80% warn, >100% block).
3. **Explicit, not qualitative-only:** the line states the percentage and the word "WARNING" outright, resolving the round-1 objection that the committed figure was only described in prose ("well under the ceiling") without ever being run through the threshold check.
4. **Acknowledgment present:** the line states why the WARNING is accepted (still under the blocking threshold, 1.5-point real buffer for a below-average week) rather than silently passing through — satisfies the gate's "WARNING + acknowledgment" requirement, not just a bare number.
5. **Placement correct:** sits directly under the Committed Stories table, in the same section the round-1 finding pointed to (originally "after line 43"), so it isn't buried elsewhere in the document.
6. **No other change needed:** this was the only defect identified in round 1 for this criterion; the full-backlog 128% flag (line 27) is untouched and still correct, and the Risks table (line 75) still separately notes "Committed 11 of 12.5 points, not all 12.5" consistent with the new explicit line.

No discrepancies found between the claimed fix and the actual file content. Fix is real, correctly computed, and correctly classified.

---

## Criterion 3 — Coverage matrix reflecting Story 5+6+8 merge

**Verdict: PASS** (unchanged from round 1 — not in scope for this round, re-confirmed on read)

- Coverage Matrix (lines 85–99) still maps every FR-ID/NFR-ID, with FR-04/FR-06/FR-07/FR-08 all correctly pointing to the single merged Story 5 (sub-scopes 5a/5b/5c).
- Deferred Stories table (line 51) and Commitment Rationale (line 65) consistently reflect the merged story, matching the coverage matrix framing.

No regression introduced by the round-2 edit.

---

## Summary

| Criterion | Round 1 | Round 2 |
|---|---|---|
| 1. Process sound / capacity honesty (false-citation fix) | PASS | PASS |
| 2. Capacity matrix + utilization threshold enforcement | FAIL | **PASS** — committed-subset utilization (11/12.5 = 88%) now explicitly calculated, correctly classified as WARNING (>80%, not blocking >100%), and acknowledged, at line 45 |
| 3. Coverage matrix reflecting Story 5+6+8 merge | PASS | PASS |

**Overall gate status: PASS.** All three criteria pass. The round-1 fix was verified against the actual file content (not taken at face value): the arithmetic is correct, the threshold classification is correct, and the WARNING is explicitly stated and acknowledged per gate rules. No further rounds needed.
