## Product Owner — Final UAT DoD Validation (Round 2)

**Product / Feature:** Walmart Cart Integration for the Grocery List
**Reviewer:** Product Owner
**Date:** 2026-08-29
**Verdict: PASS**

---

### Summary

Round 1 failed because only 1 of the 8 named priority staples (eggs) carried a genuinely verified `walmartItemId`; the other 7 were model-fabricated and had been removed. A live browser verification pass has since re-curated all 7 remaining staples against real Walmart product pages, and 2 downstream package-size assumptions were corrected to match the real products found. This round re-checks FR-01's explicit minimum bar against the current state of `src/data/purchaseUnits.ts`.

### FR-01 Re-Check

PRD text: *"Minimum bar for launch: all 8 named priority staples above must be curated with a verified `walmartItemId` ... A build with fewer than 8 curated staples does not satisfy FR-01."*

Current state of `src/data/purchaseUnits.ts` — all 8 named priority staples now carry non-empty, all-digit `walmartItemId` values:

| Staple | `walmartItemId` | Package size note |
|---|---|---|
| garlic | `44391100` | unchanged (head / 10 clove) |
| onion | `51259212` | unchanged (each / 1 each) |
| chicken breast | `10414680` | corrected: 3 lb bag (1361 g), was wrongly assumed 1 lb |
| canned tuna | `11965048` | unchanged (can / 142 g, 5 oz ≈ 142 g was already accurate) |
| eggs | `145051970` | unchanged — verified at Refine-stage spike, carried forward |
| olive oil | `10315103` | corrected: 17 fl oz → 34 tbsp, was wrongly assumed ~48 fl oz |
| brown rice | `10898755` | corrected: 32 oz by weight ≈ 4.5 cups, was wrongly assumed 32 cups by volume |
| greek yogurt | `26559565` | unchanged (container / 907 g, 32 oz ≈ 907 g was already accurate) |

8 of 8 named priority staples are curated with a genuine `walmartItemId`. This meets the explicit minimum bar — not "fewer than 8." All 3 package-size corrections (chicken breast, olive oil, brown rice) are documented in `purchaseUnits.ts` code comments and in the developer's story notes, and are consistent with the actual products the IDs resolve to (per the CORRECTION section of `story-1.md`).

Supporting checks:
- `PurchaseUnitEntry.walmartItemId` remains optional; uncurated entries (lemon, celery, cucumber, etc.) are unaffected and still produce valid purchase quantities — consistent with FR-01's first AC.
- Developer notes report the test suite (`purchaseUnits.test.ts` TC-PU-002b, `groceryList.test.ts`) was updated to match the corrected data, and the full suite (149/149) passes.
- No fabricated or unverified IDs remain among the 8 named staples.

**FR-01: PASS.**

### FR-by-FR Cross-Check

| FR | Status | Notes |
|----|--------|-------|
| FR-01 | **PASS** | 8/8 named priority staples now carry live-verified `walmartItemId` values; 2 package-size corrections applied and documented. |
| FR-02 | PASS | Unchanged from round 1 — `buildCartUrl` implemented and spike-verified, degrades gracefully. |
| FR-03 | PASS | Unchanged — `buildSearchUrl` unconditional, no curated-data dependency. |
| FR-04 | PASS | Unchanged — button + honest "N of M" coverage count, correct hide behavior. |
| FR-05 | PASS | Unchanged — no credentialed API surfaces used. |
| FR-06 | PASS | Unchanged — per-item Search link present on every line regardless of curation state. |
| FR-07 | PASS | Unchanged — README documents Impact Radius affiliate prerequisite. |
| FR-08 | PASS | Unchanged — pre-approval UX matches spec. |

8 of 8 FRs pass.

### Non-Blocking Observations (recorded, not gating)

- The correction path taken (live re-verification rather than a PRD-bar rollback) is the preferred Path A from the round-1 review — no PRD amendment was needed, which is the cleaner outcome.
- OQ-1 and OQ-5 (Impact Radius affiliate approval, ToS-compliance-before-approval) remain open per the PRD and are separately gated for Stage 7 sign-off; they are outside FR-01's scope and do not block this DoD pass.
- Recommend the maintainer periodically re-verify these 8 IDs against staleness (OQ-4 remains explicitly ungoverned per the PRD) — not a blocker, just a forward note.

---

### Status Signal

**PASS / FAIL: PASS**

All 8 named priority staples in FR-01 now carry genuine, live-verified `walmartItemId` values, satisfying the PRD's explicit minimum bar. All 8 FRs pass. UAT DoD is satisfied; no blocking gaps remain.
