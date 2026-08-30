# Adversarial Challenge: Sprint Plan (Walmart Cart Integration)

Role: Challenger. Target: `sprint-plan.md` (revised, post-consensus), cross-checked against `stories.md` and `architecture.md` §3.

## 1. Story Sizing vs Flagged Architecture Risks

Architecture §3 flags three real risks: (1) key-derivation duplication, (2) qualifying-items must be one shared function not two, (3) `useMemo` dependency desync. None of these carry a point premium anywhere in `stories.md`.

- Story 3 (2 pts) is not just "build `buildSearchUrl`." It also refactors `groceryList.ts` — an existing, already-shipped module with an existing consumer (the aggregation path) — to export `normalizeIngredientKey` and swap its inline logic. That is a touch-existing-code change with regression surface, priced the same as a greenfield 2-pointer. No behavior-change risk buffer.
- Story 2 (3 pts) bakes in "make `getQualifyingItems` genuinely shared, not two filters that happen to agree today." That's architecture's #2 risk, and it is treated as ordinary scope, not as an extra point for the discipline of designing-to-prevent-drift.
- Risk #3 (`useMemo` dependency) lands in Story 5 (3 pts, Sprint 2) with zero acknowledgment in that story's points that "wire off `[groceryList]` not `[selectedCards]` independently" is exactly the kind of subtle bug that ships clean and breaks three weeks later when someone touches `selectedCards` state elsewhere.

Net: 17 points across 8 stories for a feature architecture explicitly says has 3 unclosed coupling risks, priced as if all 3 were free. Sizing reflects task decomposition, not risk. No spike, no risk-loaded points, no "if X takes longer than expected" story.

Story 7 is worse than it looks: it's committed to Sprint 1 as "1 point... CSS scaffolding only, verified against Sprint 2 markup" but its own risk row admits the real verification can't happen until Sprint 2 markup lands. Sprint 1's velocity will show Story 7 "Done" for writing CSS against class names that don't exist in a rendered DOM yet — that's optimistic completion, not done-done. If Sprint 2's actual markup drifts even slightly from the Notes/Constraints class names, Story 7 gets silently reopened and Sprint 1's reported 11/11 points becomes fiction.

## 2. Capacity Numbers — the 0.8 hr/point figure is unsourced

The plan states: *"Historical velocity (hrs/point) | No prior sprint data... using architecture's own estimate ratio of ~0.8 hr/point as a working baseline."*

Checked `architecture.md` in full — there is no hr/point ratio, no time estimate, no effort-hours figure anywhere in that document. Architecture is a Light-depth design pass; it contains zero time estimates. This is a fabricated attribution: a number invented by SM and credited to a source that doesn't contain it. That's not a rounding error — it's the single number the entire 12.5-point capacity ceiling rests on, and it traces to nothing. If challenged by a reviewer who actually checks the source (as I just did), the capacity math has no empirical foundation at all — it's a guess dressed as a citation.

Separately: 6 hrs/week for a hobby project around a day job, with a solo contributor and zero track record, is itself the single point of failure for the whole sprint — and the plan's own risk table admits it ("6 hrs/week is optimistic"). The mitigation is "committed 11 of 12.5, not all 12.5" — a 1.5-point buffer (12%) against a self-acknowledged-optimistic estimate with an unsourced conversion ratio underneath it. That is not a real margin.

## 3. Do the just-converged fixes have teeth?

**Sprint 1 goal reword** ("zero remaining core-logic risk," explicit no-UI-ships-this-sprint statement): this is real and checks out — Stories 1–4 do close architecture risks #1 and #2 (key normalizer, shared qualification helper) within Sprint 1, and risk #3 (`useMemo`) is correctly scoped to Sprint 2 where the UI actually gets built. Wording change, but the underlying story set actually supports the reworded goal. Confidence this one is real, not cosmetic.

**Sprint 2 merge-grouping constraint** (Stories 5+6+8 as one release unit): this is prose enforcement only — *"SM/PO enforce this at Sprint 2 planning and at PR review; do not mark Story 5 Done-and-merged while Story 8 is still open."* On a solo project, SM/PO/Dev are the same person, self-reviewing their own PRs, per the sprint plan's own DoD line ("self-review checklist for solo dev"). There is no CI gate, no branch-protection rule, no PR template checkbox, no automated check that Story 8 merged before/with Story 5. It's a note-to-self. Under real schedule pressure — the exact 6-hrs/week risk this plan already flags as live — a solo dev under time pressure is the person most likely to ship the button and defer the docs "just this once." The fix addresses the finding's wording, not its mechanism.

**Recurring manual-verification checklist**: also currently just a forward-looking promise — *"Before Sprint 2 closes, `qa/test-strategy.md` must carry... a lightweight, named, dated manual-regression checklist."* No such checklist exists yet; it references a file (`qa/test-strategy.md`) that this plan does not confirm exists or has been checked. The DoD line only requires the *reference* to exist by name in Sprint 2's DoD, not that the checklist itself is written, named, or has ever been run once. This is a deferred commitment to write a commitment. Zero verification this actually happens is possible until Sprint 2 is well underway — meaning if it doesn't happen, nothing in Sprint 1's plan catches it.

## Confidence: 2/5

**Escalate: YES.**

Reasons: (1) the capacity ceiling — the number every commitment decision in this plan hangs off — is attributed to a source document that does not contain it; that's a factual defect in the plan, not a stylistic one. (2) Both "just converged" process fixes (merge-grouping, recurring checklist) are enforcement-free prose on a solo project with no second reviewer and no automated gate — they read as resolved but carry the same failure mode (silent skip under pressure) as before the fix. (3) Story sizing shows no cost for the 3 architecture-flagged coupling risks, and Story 7's Sprint-1 "Done" is not actually verifiable until Sprint 2, inflating apparent Sprint 1 completion.

None of this blocks the plan outright — Stories 1–4's sequencing and the Sprint 1 goal rework are sound — but the capacity math and both "resolved" risk items need either a real source/gate or an explicit acknowledgment that they're unenforced assumptions before this plan is treated as consensus-closed.
