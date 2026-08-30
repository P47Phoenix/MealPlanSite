## Operations: Walmart Cart Integration for the Grocery List
## Role: DevOps
## Task: release-plan

### Current State (verified against repo, not assumed)

`git status` on `C:\GitHub\MealPlanSite` right now:

- Branch: `feature/walmart-cart-integration` (not `main`).
- **Uncommitted** working-tree changes: `README.md`, `src/components/GroceryListView.tsx`, `src/data/purchaseUnits.ts`, `src/lib/groceryList.ts`, `src/styles.css` modified; `src/components/GroceryListView.test.tsx`, `src/data/purchaseUnits.test.ts`, `src/lib/walmartLinks.test.ts`, `src/lib/walmartLinks.ts` untracked.
- No commits yet on this branch beyond what's on `main` — everything for all 6 stories is sitting as an uncommitted diff. `main`'s tip is still `5b5e43b`.
- `.github/workflows/deploy.yml` unchanged from the Plan-stage `deploy-plan.md` description: push-to-`main` or `workflow_dispatch` triggers `npm ci` → `npm run build` → upload `dist/` → `actions/deploy-pages@v4`. Still **no `npm test` step** in the pipeline — the Plan-stage recommendation was not implemented.

This changes the pre-merge checklist below: the task brief describes commits/PR merge, but nothing is committed yet. Checklist below covers commit → PR → merge as one flow, called out where each stage is.

### What "Release" Means Here (unchanged from architecture/deploy-plan)

No backend, no server, no flag system. **Merge to `main` is the release** — GitHub Pages does a full Recreate on every push: `deploy.yml` builds `dist/` and republishes the whole site atomically. No staged rollout, no partial exposure, no separate "deploy" step distinct from "release." Confirmed still true — `deploy.yml` untouched since Plan stage.

### Pre-Merge Checklist

**A. Commit and push (not yet done)**

- [ ] Stage and commit all 5 modified + 4 new files as one or more commits on `feature/walmart-cart-integration` (or squash-merge later — either is fine, just don't split README from UI across commits/PRs, see FR-07 check below).
- [ ] Push branch, open PR into `main`.

**B. Quality gates**

- [ ] Full test suite green: task states 148/148 passing, BUG-01 fixed. Re-run `npm test -- --run` on the actual committed state before merge — do not rely on a pre-commit number alone.
- [ ] `npx tsc --noEmit` clean (Story 5 dev notes confirm this ran clean already; re-verify post-commit).
- [ ] `npm run build` succeeds locally, `dist/` inspected for zero secrets/credential-shaped strings in the diff (NFR-02) — no server, no env vars in this feature, so this is a quick spot-check, not a deep audit.
- [ ] Manual verification pass in `npm run dev`: cart button renders/hides correctly for zero-total and zero-curated-item cases (FR-04 empty/zero-coverage paths) — no staged rollout to catch this after the fact, this is the last check before every visitor sees it at once.

**C. FR-07 doc/code atomicity — verified true**

- [ ] Confirm README's Walmart section and the cart-button/search-link code land in the **same PR** (same merge to `main`). **Verified in this pass**: `git status` shows `README.md` and `GroceryListView.tsx` (plus supporting files) as one uncommitted diff on the same branch — nothing has drifted apart. Story 5's dev log (`story-5.md`) also states the README section was written in the same pass as the component changes. As long as the commit(s)/PR made from this working tree keep them together (checklist item A), the Plan-stage structural fix holds. Do not split them across two PRs at commit time.
- [ ] README wording doesn't assert current Impact Radius affiliate enrollment as fact (per story-5.md, phrased as prerequisite/open question) — spot-check before merge.

**D. Branch/process**

- [ ] Confirm `main` branch protection blocks direct pushes / requires PR (flagged as unverified in Plan-stage deploy-plan.md — check before merge).
- [ ] Confirm OQ-1/OQ-5 (affiliate approval, ToS timing) have a documented status or explicit deferral at merge time (non-blocking per FR-08, but should be noted, not silently skipped).
- [ ] `deploy.yml` still has no test gate — either add the 3-line `npm test -- --run` step before `npm run build` now, or accept manual pre-merge testing as the gate for this release (Plan-stage's open recommendation, still open).

### Release Execution

1. Merge PR to `main` (squash or merge commit — either works, just keep README + UI in the same merge).
2. `deploy.yml` triggers automatically on the `main` push: `npm ci` → `npm run build` → upload `dist/` → `actions/deploy-pages@v4`. No manual steps, no separate deploy trigger.
3. Confirm workflow run succeeds in Actions tab.
4. Smoke check the live Pages URL: grocery list renders, cart button appears with correct href, search links present, README/GitHub landing page (if applicable) shows updated docs.
5. Time to live: one workflow run, typically a few minutes after merge — no propagation delay beyond normal CDN caching.

No release announcement process exists for this project (single-maintainer, no external stakeholders) — optional: note in commit/PR description as the record of what shipped.

### Rollback Procedure

No feature flag, no server-side toggle, no traffic-shifting mechanism. Rollback = **git revert, forward-deployed through the same pipeline**:

1. Identify the merge commit on `main` that introduced the regression: `git log main`.
2. `git revert <commit>` (add `-m 1` if reverting a merge commit) on a new branch.
3. PR and merge the revert to `main` as a normal change — no separate rollback pipeline exists.
4. `deploy.yml` triggers automatically on that merge; same build → publish path as any deploy. `workflow_dispatch` is available as a manual re-trigger if the push trigger doesn't fire.
5. Time-to-rollback = time-to-deploy: one workflow run (a few minutes) — identical to forward deployment. No faster path exists (no standing "previous version" to instant-switch to, unlike blue-green).

**Why revert is low-risk here**: architecture.md confirms this feature is purely additive — new optional field (`walmartItemId`), new module (`walmartLinks.ts`), additive UI/CSS. No existing function's public contract changed shape. A revert has no data migration, no schema, and (assuming commits stay scoped to this feature per the checklist above) no other unrelated feature riding along in the same revert.

**Partial rollback option**: if only the cart button needs pulling but search links/coverage count should stay (or vice versa), a manual scoped revert of just the relevant `GroceryListView.tsx` hunk is possible instead of a full feature revert — judgment call at rollback time, not a pre-built mechanism.

**Rollback triggers** (adapted from standard error-rate/latency criteria, which don't apply to a static site with no telemetry — this project has no analytics per PRD):

- Cart button broken (wrong URL, JS error, doesn't render) — confirmed by manual check or user report.
- Search link broken.
- Console errors on the grocery list page traceable to this feature.
- Affiliate program/ToS issue surfaces post-merge (OQ-1/OQ-5) requiring the button pulled pending resolution.

No automated detection exists (no monitoring, no error tracking) — rollback is triggered manually, from user reports or maintainer spot-checks, not alerting.

### Risks & Mitigations

| Risk | Impact | Likelihood | Mitigation |
|---|---|---|---|
| README and UI split across separate commits/PRs at commit time | Button live with no documented affiliate prerequisite | Low now (currently one diff) but real until committed — commit/PR discipline is the only guard | Checklist item C: commit and merge together, verified same-diff state above |
| No test gate in `deploy.yml` | Build with failing tests could still publish if not run locally first | Medium (still open from Plan stage) | Manual pre-merge `npm test -- --run` per checklist item B, or add the pipeline step now |
| Everything still uncommitted | Nothing is actually shippable yet — task's "implemented and DoD-verified" state exists only in the working tree | High until committed | Checklist item A must happen before any of the rest applies |
| Recreate deploy = instant 100% exposure | Any regression reaches all users at once | Low-Medium (feature is additive/isolated) | git-revert rollback in minutes; pre-merge manual verification pass |
| No monitoring/alerting on this static site | Rollback trigger depends on manual detection, could be slow | Low-Medium | Accepted at this project's scale; no action recommended (adding monitoring is disproportionate per Plan-stage trade-off analysis) |

### Assumptions

- 148/148 tests passing and BUG-01 fixed as stated in the task brief — not independently re-run in this pass beyond confirming the test files exist untracked/uncommitted; re-verify per checklist item B before merge.
- `deploy.yml` and hosting topology are unchanged from Plan stage — confirmed by reading the file directly in this pass.
- No feature-flag system, staging environment, or canary capability will be introduced for this release (per Plan-stage deploy-plan.md, still consistent).

### Open Questions

- Is `main` branch protection actually enabled (blocks direct push, requires PR review)? Not verified in this or prior passes — recommend checking GitHub repo settings before merge.
- OQ-1/OQ-5 (Impact Radius affiliate approval, ToS timing) status — unresolved per PRD, non-blocking per FR-08, but should have a documented decision or explicit deferral noted in the merge PR description.
- Will the `npm test` pipeline gate be added to `deploy.yml` before this merge, or deferred again? Still an open recommendation from Plan stage.

### Downstream Notes

- Nothing is committed yet — the actual release cannot happen until the working tree in checklist item A is committed and PR'd. This artifact assumes that happens next.
- Rollback mechanism (git revert) requires no new tooling and works identically regardless of squash vs. merge commit, as long as the revert target commit is correctly identified.
