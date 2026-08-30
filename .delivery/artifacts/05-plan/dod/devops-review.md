# DevOps DoD Validation: Walmart Cart Integration (Round 2)

**Role:** DevOps
**Task:** dod-validation (deployment approach viability)
**Inputs reviewed:** `po/stories.md` (post-merge), `devops/deploy-plan.md`, `sm/sprint-plan.md` (final)

---

## Gate Criterion 1: Round-1 finding (README/button doc-feature split risk) structurally resolved by Story 5+6+8 merge

**Verdict: PASS**

Round-1 concern: three separate story cards (cart button, per-item search links, README) relied on a prose rule ("SM/PO enforce this at Sprint 2 planning; do not mark Story 5 Done while Story 8 is open") to prevent the cart button shipping live without its README-documented Impact Radius affiliate prerequisite. On a solo project with no CI gate and no second reviewer, a prose rule is not an enforcement mechanism — it's a note that can be skipped under schedule pressure.

Evidence this is a real structural fix, not relabeling:

- `stories.md` Story 5 is now one story with three labeled sub-scopes (5a/5b/5c) and a single Definition of Done block requiring all three sub-scopes ("all three sub-scopes required") before the story can be marked Done. There is no path to a "Story 5 Done, Story 8 open" state anymore, because Story 8 no longer exists as an independent card — 5c is not completable or Done-able on its own.
- The explicit DoD line: *"Merged/landed to `main` as a single release unit — one PR, or multiple PRs merged back-to-back with no gap where the button is live without the README's documented prerequisite."* This converts the old prose rule into a story-level acceptance gate that blocks calling the story Done, rather than a separate reminder that could be forgotten independently of Done-marking.
- `deploy-plan.md`'s Release-Readiness Checks independently reinforce the same constraint at the deploy boundary: check #1 requires README FR-07 text and the cart-button code to land in "the same PR / same merge to main," explicitly citing the absence of a feature flag as the reason a gap between them is a real production gap. This is a second, independent enforcement point (deploy-time checklist) layered on top of the story-structure fix (Done-state), not a restatement of it.
- Sprint plan confirms the mechanism change explicitly: "The former three-card merge-grouping concern is now structural (Story 5 is one story with one Done state...) rather than a process rule to carry forward."

This is a genuine reduction in risk surface: previously, two independent human actions (mark Story 5 Done, keep Story 8 open) had to both be remembered correctly across two cards; now there is one card whose Done checkbox is definitionally unreachable until all three sub-scopes — including the README — pass. The risk isn't eliminated (a solo dev can still merge partial code without marking anything "Done" in a tracker, since there's no CI gate enforcing story state against `main`), but the specific failure mode identified in round 1 — a story-tracking illusion of separation enabling a real production gap — is closed by construction. Confirmed as a real fix.

---

## Gate Criterion 2: Deploy/rollback approach remains adequate given the merged story

**Verdict: PASS**

- **Deployment strategy unaffected by the merge.** Recreate-via-GitHub-Pages-Actions remains the only viable strategy for this topology (single static artifact, no router, no flag service) regardless of whether Story 5 is one card or three — the merge changes story bookkeeping, not deploy topology, build steps, or the workflow file. No new deploy surface is introduced by consolidating the cards.
- **Rollback mechanics remain adequate, and arguably improve.** The deploy plan's rollback approach (git revert, forward-deployed through the same `deploy.yml` pipeline) depends on the change being additive and isolated to a small, identifiable set of commits (architecture.md §1: no existing public contract changes shape). The merge doesn't touch the code being shipped — same files (`GroceryListView.tsx`, `styles.css`, `README.md`), same sub-scopes 5a/5b/5c — it only changes how those changes are batched into PRs/commits. If anything, a single-PR release unit (as the merged story's DoD now requires) gives a *cleaner* revert target than three independently-timed PRs would have: one merge commit (or a tight back-to-back cluster) to `git revert`, rather than needing to identify and revert three separate merge points that could have landed hours or days apart. This directly supports the existing Risks table entry: "`git revert` targets the wrong commit in a fast-follow-heavy merge history" — the merge reduces the number of commits in play, reducing that risk rather than compounding it.
- **No new rollback complexity introduced.** The "kill-switch alternative" (manually commenting out the cart button render call) noted in deploy-plan.md as a partial-revert option remains available regardless of story structure, since it operates on the shipped code, not the story tracker.
- **Capacity/sequencing check:** Sprint plan confirms Story 5 (5 pts, merged) is the sole Sprint 2 commitment against 12.5-point capacity — well within ceiling, so the merge's point increase-avoidance (16 pts net, down from 17) doesn't introduce a capacity risk that would pressure a rushed, ungated merge.

No FAIL findings against either gate criterion.

---

## Residual Observations (non-blocking, carried from deploy-plan.md's own Follow-Up — not new findings)

These were already flagged by DevOps in `deploy-plan.md` and are unaffected by the Story 5 merge; noting for completeness, not as gate failures:

- Confirm `npm test` exits non-zero on failure before wiring it into `deploy.yml` (or rely on the manual pre-merge `npm test` gate as documented).
- Confirm `main` branch protection actually prevents direct pushes bypassing PR review — deploy-plan.md flags this as unverified/outside its file scope. This matters slightly more now that the merged Story 5 DoD leans on "single PR" as the enforcement mechanism for Criterion 1 — if branch protection doesn't require PR review, the single-PR requirement is a convention, not an enforced gate. Recommend a one-time check before Sprint 2 merge, not a blocker to this plan.

---

## Overall DoD Gate Result

| Criterion | Result |
|---|---|
| Round-1 README/button split risk structurally resolved | PASS |
| Deploy/rollback approach adequate given merged story | PASS |

**Overall: PASS.** No FAIL findings. Deployment approach is viable.
