# Consensus Round 1 — DevOps Position

**Topic:** Is the release/rollback approach adequate for this sprint's committed scope? Any deployment-readiness risk?

**Reviewer:** DevOps
**Inputs reviewed:** `po/stories.md`, `devops/deploy-plan.md` (own prior artifact), `sm/sprint-plan.md`

---

## Position: CONDITIONAL YES

The release/rollback approach (Recreate, via `git revert` forward-deployed through the existing `deploy.yml`) is adequate and correctly scoped for this sprint's actual committed content — but the sprint plan's story split creates a **new instance of the exact risk my own deploy-plan already flagged**, and the sprint plan does not explicitly close it. This needs an explicit guardrail before Sprint 2 execution, not a re-litigation of the deploy strategy itself.

## What's adequate

- Sprint 1 commits Stories 1, 2, 3, 4, 7 (11 pts) — all pure logic (`purchaseUnits.ts`, `walmartLinks.ts`, its tests) plus CSS scaffolding with no live consumer yet. **None of this is user-facing.** Under Recreate/GitHub Pages, every merge ships to 100% of users instantly — but since Sprint 1's changes are additive and dormant (no button, no search link rendered until Sprint 2's markup lands), there is no user-visible blast radius this sprint even though deploy = release. This is the right way to sequence work under a no-flag, no-staging topology.
- `git revert` rollback remains valid for every Sprint 1 story: no schema change, no other feature touched, clean single-purpose diffs per architecture.md §1.
- Rollback time-to-recovery (one workflow run, a few minutes) is unchanged and acceptable at this scale for Sprint 1's payload.

## The risk: README/button atomicity, restated at sprint granularity

My deploy-plan's top release-readiness risk was: **"README (FR-07) merges separately from / after the cart button code → button live in production with no documented affiliate-approval prerequisite, for however long the docs PR lags."** My mitigation was "same PR / same merge to `main`."

The sprint plan defers Stories 5 (button), 6 (search link), 8 (README) all to Sprint 2 — good, they're in the same sprint. But `stories.md` explicitly lists them as **three independently deliverable stories**, and Story 8's own notes say it "can be done any time after Story 5 confirms the button exists" — i.e., as a separate follow-up merge, not necessarily the same PR. Being in the same *sprint* does not guarantee being in the same *merge*. Under Recreate, if a solo dev merges Story 5 to `main` on day 1 of Sprint 2 and Story 8 lands three days later, the cart button is live in production with no README disclosure for those three days — precisely the gap my deploy-plan called out and asked to be prevented at merge time, not sprint-planning time.

This is not a defect in the sprint plan's capacity math or ordering — it's a gap in translating "same sprint" into "same deploy." The sprint-plan's Definition of Done and story table don't state a merge-grouping constraint.

## Recommendation (non-blocking for Sprint 1, blocking for Sprint 2 merge)

1. When Sprint 2 stories are pulled, treat Story 5 + Story 8 (and ideally Story 6, since it's in the same file) as **one PR / one merge to `main`**, not three independent merges — carry this forward as an explicit Sprint 2 planning note, not just a DevOps checklist item buried in the deploy-plan.
2. Reconfirm before Sprint 1 closes whether the `npm test` gate is being added to `deploy.yml` (still open in my Follow-Up) — Sprint 1 is the first sprint with NFR-05-mandated tests actually landing, so this is the right sprint to decide it, not defer further.
3. No change needed to the Recreate/revert strategy itself — it fits this topology and this sprint's payload.

## Risks (severity)

| Risk | Severity | Owner |
|---|---|---|
| Story 5 merges without Story 8 in Sprint 2 (docs/feature split across merges) | Medium — production gap in disclosure, not a functional break | SM/PO to enforce merge grouping at Sprint 2 planning |
| `npm test` gate decision still open | Low-Medium — doesn't block Sprint 1's logic-only stories, but Sprint 2's UI stories ship user-facing code without a CI test gate if undecided | DevOps/solo dev, before Sprint 2 |

## Open questions for other roles

- PO: can Sprint 2's story-level plan explicitly require Stories 5 and 8 (and ideally 6) to merge together, or is a documented "button ships, README follows within N hours" acceptable risk?
- SM: should the Sprint 2 backlog note carry a merge-grouping constraint alongside the dependency list already in `sprint-plan.md`?
