# Product Owner DoD Review: Sprint Plan & Stories (Post-Merge)

Role: Product Owner | Task: DoD Validation | References: user-stories.md, backlog-management.md (PO guardrails)

Reviewed artifacts:
- `.delivery/artifacts/05-plan/po/stories.md` (post-merge, 6 stories, 16 points)
- `.delivery/artifacts/05-plan/sm/sprint-plan.md` (final)

---

## Gate Criterion 1: Scope correct after Story 5+6+8 merge — merged story retains clear, testable ACs (not diluted)

**Verdict: PASS**

Merged User Story 5 ("Add Walmart Cart Button, Per-Item Search Links, and README Documentation") preserves each original story's acceptance criteria intact and separately, rather than collapsing them into a single blended AC block:

- Sub-scope 5a (originally Story 5, cart button + coverage count, FR-04/FR-08): 6 Given/When/Then ACs, unchanged in substance, plus TC-GLV-001–008.
- Sub-scope 5b (originally Story 6, per-item search link, FR-06): 3 ACs, plus TC-SL-001–005.
- Sub-scope 5c (originally Story 8, README, FR-07): 3 ACs, plus TC-README-001–003.

Each sub-scope keeps its own traceable test-case ID namespace (GLV/SL/README) with no ID collisions or renumbering that would obscure origin. A combined "Definition of Done (story-level)" explicitly requires all three sub-scopes' test suites green before the story is Done, and states the merge intent plainly: one story, one Done state, cannot be partially shipped. This is exactly the structural fix the merge was intended to deliver — no dilution is present; testability is, if anything, strengthened (a QA engineer can still write a test directly from any single AC).

One minor observation, not a fail: the "Test Cases (5a, 5b — unchanged from original Stories 5 and 6)" section (lines 389–405) duplicates the same TC-GLV/TC-SL rows already given under sub-scopes 5a and 5b (lines 305–316, 344–352). This is redundant content, not diluted content — it does not weaken testability, but it is worth trimming in a later pass to avoid the two tables drifting out of sync if either is edited independently in future revisions.

---

## Gate Criterion 2: Stories remain valuable/INVEST-compliant post-merge

**Verdict: PASS**

Stories 1–4 and 6 are untouched by the merge and each carry their own `[INVEST check]` line under Notes/Constraints, all still valid (Independent, Small 1–3 pts, Testable via direct assertions or test cases).

Merged Story 5 (5 points) is the one story where INVEST is genuinely stressed, and the artifact does not hide this — it states the trade-off explicitly in its own Definition of Done: *"Larger than a typical single card (5 pts) by design — the merge trades away Independent/Small in exchange for removing the partial-ship risk the challenger identified; still fits within Sprint 2 capacity and is a single coherent, testable, valuable unit (delivers the whole user-facing capability, not a fragment of it)."*

Assessed against remaining INVEST letters:
- **Valuable**: Yes — delivers the complete user-facing capability (cart button + search fallback + honest documentation) as one shippable increment; a partial delivery (e.g., button live without README's affiliate caveat) is explicitly the risk being designed out, so full-story delivery is the correct valuable unit here, not a defect.
- **Negotiable**: Yes — sub-scope boundaries are legible and can still be discussed/adjusted.
- **Estimable**: Yes — 5 points, consolidation-discounted from 3+2+1=6 with stated rationale (removes one card's worth of review/DoR/DoD overhead).
- **Testable**: Yes — all original test cases preserved per sub-scope.
- **Independent / Small**: Explicitly and knowingly traded away, with a stated business reason (risk removal by construction on a solo project with no CI gate/second reviewer) rather than an oversight. 5 points is still within a single sprint's capacity (Sprint 2 commits only this one story against ~12.5-point capacity), so "Small" is relaxed but not broken in a way that threatens deliverability.

This is a defensible, disclosed INVEST trade-off rather than a silent violation — acceptable for DoD purposes.

---

## Gate Criterion 3: Sprint 1 goal accurately reflects what actually ships

**Verdict: PASS**

Sprint Goal (sprint-plan.md, lines 3): *"Build and fully unit-test the Walmart cart-link and search-link engine ... on top of verified item data — an internal foundation milestone (data model + calculation layer) with zero remaining core-logic risk, ready to wire into the grocery list UI in Sprint 2. No user-facing button, search link, or coverage count ships this sprint; that user-facing capability is Sprint 2's goal."*

Cross-checked against Committed Stories (Sprint 1): Stories 1, 2, 3, 4, 6 (11 of 16 backlog points; Story 5/merged deferred to Sprint 2). This matches the goal's claims:
- "engine ... on top of verified item data" → Stories 1 (curated data + guard), 2 (`buildCartUrl`), 3 (`buildSearchUrl`), 4 (unit tests) — all committed.
- "no user-facing button, search link, or coverage count ships this sprint" → correct; Story 5 (the only story that adds user-facing markup) is deferred to Sprint 2, confirmed in the Coverage Matrix (FR-04/06/07/08 all mapped to Sprint 2).
- Story 6 (CSS) is committed in Sprint 1 but is explicitly called out as scaffolding only, not user-facing until Sprint 2 markup lands ("Story 6's CSS is inspection-only and cannot be visually confirmed until Sprint 2's markup lands" — DoD line, and a named risk with mitigation). The goal statement's "no user-facing ... ships this sprint" is consistent with this: CSS rules with no consuming markup are not user-facing in isolation, and the plan is explicit and non-misleading about this rather than glossing over it.

The goal is a single sentence expressing the milestone's value (de-risking the UI wiring), not a list of story IDs, satisfying the PO guardrail for sprint goals. No overclaim was found — the goal's scope boundary matches the committed-stories table exactly.

---

## Overall Gate Result: PASS (3/3 criteria)

No blocking findings. One non-blocking cleanup suggestion: remove or clearly cross-reference the duplicated TC-GLV/TC-SL table under "Test Cases (5a, 5b — unchanged...)" in `stories.md` (lines 389–405) to prevent future drift between the two copies of the same test cases.
