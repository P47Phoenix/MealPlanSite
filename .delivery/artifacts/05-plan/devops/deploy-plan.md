## Operations: Walmart Cart Integration for the Grocery List
## Role: DevOps
## Task: deployment-strategy

### Current State

MealPlanSite is a static React/Vite site with no backend, no server, no database, no runtime infra. GitHub Pages hosting only, confirmed by `vite.config.ts` (`base: '/MealPlanSite/'`, matches the GitHub Pages project-site path convention). One CI/CD workflow exists: `.github/workflows/deploy.yml`.

That workflow: on push to `main` (or manual `workflow_dispatch`), checks out, installs Node 20 via `npm ci`, runs `npm run build`, uploads `dist/` as a Pages artifact, then deploys via `actions/deploy-pages@v4`. Single job path, no test gate inside the workflow itself, no staging environment, no feature-flag system, no canary/blue-green capability — there is exactly one environment (production) and exactly one deploy mechanism (push to `main`).

Walmart Cart Integration (per `architecture.md` and `prd.md`) adds: an optional field on `purchaseUnits.ts`, a new pure module `walmartLinks.ts`, and additive changes to `GroceryListView.tsx` + `styles.css`. No new deploy surface, no new environment variable, no new build step, no new external service call at build or runtime beyond a client-side link the browser navigates to on click.

### Proposed Solution

**Deployment strategy: Recreate (the only strategy this topology supports), delivered as a normal merge-to-main.**

Reference `deployment-strategies.md`'s strategy catalog was checked against this system and every strategy except Recreate is inapplicable:

- Blue-green needs two live environments and a router/load balancer — none exist; GitHub Pages serves one static bucket.
- Canary needs percentage-based traffic routing and live metrics to gate promotion — no traffic router, no telemetry backend (PRD explicitly: no analytics, no backend).
- Rolling deployment needs a fleet of instances updated in batches — there is one static artifact, not instances.
- A/B (feature-flag-driven) needs a flag service — none exists; PRD OQ-2 explicitly considered and did not add one for this release.

Recreate fits exactly: GitHub Pages already replaces the entire deployed artifact atomically on every publish (old `dist/` fully replaced by new `dist/`) — this is Recreate by construction, not a choice DevOps is making new. "Deploying this feature" concretely means: PR merges to `main` → `deploy.yml` triggers → build → publish → the whole site (this feature included) is live within the same workflow run. There is no partial rollout, no percentage of users seeing the old vs. new grocery panel, no gradual exposure. Every visitor gets the new version the moment the Pages CDN propagates (typically under a few minutes).

There is no concept of "deploying" separate from "releasing" for this feature — no feature flag exists to decouple ship-to-repo from expose-to-user, and none is being introduced for this release (confirmed against PRD OQ-2, left unresolved/non-blocking by Product Owner). Merge to `main` **is** the release. This is intentional and appropriate at this project's scale (single maintainer, static site, no user-visible harm from an all-at-once flip) — flagged in Trade-Off Analysis below in case scale changes.

### Architecture Diagram

```
Dev branch --PR--> main
                     |
                     v (push trigger)
            .github/workflows/deploy.yml
                     |
        +------------+------------+
        |  build job                |
        |  npm ci -> npm run build  |
        |  upload dist/ as artifact |
        +------------+------------+
                     |
        +------------+------------+
        |  deploy job                |
        |  actions/deploy-pages@v4   |
        +------------+------------+
                     |
                     v
        GitHub Pages CDN (single environment)
                     |
                     v
        End user browser (grocery list page)
                     |
                     v (click "Add all to Walmart cart")
        External: affil.walmart.com/cart/addToCart
        (outside this deploy boundary entirely)
```

The Walmart endpoint itself is not part of this deploy pipeline — it is an external, third-party runtime dependency the client browser calls directly. Nothing in this feature's deploy path talks to Walmart at build or deploy time; only the end user's browser does, at click time.

### Configuration

No changes required to `.github/workflows/deploy.yml` for this feature. Confirmed:
- No new env vars, secrets, or build flags needed (NFR-01, NFR-02: zero server dependencies, zero secrets — `walmartItemId` values are plain literal data in `purchaseUnits.ts`, not config).
- No new build step: `walmartLinks.ts` compiles through the existing `npm run build` (Vite/TSC) same as every other `src/lib/*.ts` module.
- `base: '/MealPlanSite/'` in `vite.config.ts` is unaffected — this feature adds no new routes, no new static assets, no asset paths that interact with the Pages base path.

Recommended pre-merge addition (not a hard blocker, but cheap and aligned with the guardrail "Pipelines must be reproducible" / "no service goes live without tests gating it"): add a `npm test` (or `npm run test`) step to the `build` job in `deploy.yml` before `npm run build`, so NFR-05's unit tests (walmartLinks.ts branches, purchaseUnits.ts key-collision guard) run automatically on every push to `main`, not just locally. Today's workflow builds and publishes even if tests fail locally and were never run — this is the one deployment-relevant gap this feature's NFR-05 exposes that isn't specific to Walmart Cart Integration, but is worth closing now since this feature is the first one this pipeline pass has NFR-mandated tests for. Suggested diff:

```yaml
      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm test -- --run

      - name: Build
        run: npm run build
```

If the maintainer prefers to keep the workflow untouched this release, treat "run `npm test` locally before merging" as a manual pre-merge gate instead (see Follow-Up).

### Rollback Approach

No server-side toggle, no feature flag, no traffic-shifting mechanism exists — rollback is **git revert, forward-deployed**, same mechanism as any other change to this site:

1. Identify the merge commit that introduced the regression (`git log main`).
2. `git revert <commit>` (or revert the merge commit with `-m 1` if it was a merge commit) on a new branch, PR it, merge to `main` as normal.
3. `deploy.yml` triggers automatically on that merge, same build → publish path as any deploy — the revert **is** the rollback, delivered through the identical pipeline used to ship the feature. No special rollback pipeline, no manual `actions/deploy-pages` re-run against an old artifact is needed (though `workflow_dispatch` exists as a manual re-trigger if the automatic push trigger ever needs a manual nudge).
4. Time-to-rollback = time-to-deploy: one workflow run (build + publish), typically a few minutes, identical to forward deployment — there is no faster path available (no cached "previous version" standing by, unlike blue-green's instant traffic-switch rollback).

Because this feature is purely additive (new optional field, new module, new UI elements — no existing function signature changed per `architecture.md` §1: "no existing module's public contract changes shape"), a revert is a clean, low-risk operation: no data migration to reverse, no schema to roll back, no other feature was touched in the same commits it depends on.

**Kill-switch alternative (not implemented, noted for completeness):** because there's no flag system, the only faster-than-revert mitigation is manual — the maintainer could hand-comment-out the cart button's render call and push a one-line revert commit, which is functionally identical to a git revert of the `GroceryListView.tsx` change alone (partial revert) if the coverage-count logic or search links need to stay live while only the cart button is pulled. This is a manual judgment call at rollback time, not a pre-built mechanism.

### Trade-Off Analysis

| Option | Pros | Cons | Decision |
|--------|------|------|----------|
| Recreate (current, forced by GitHub Pages) | Zero infra cost, zero added complexity, matches existing pipeline exactly, sufficient for current scale | No staged exposure, no ability to limit blast radius of a bad release, all users get the change simultaneously | **Accepted** — only option the hosting model supports without new infrastructure |
| Add feature flag for cart button specifically | Would allow disabling the button without a code revert; addresses PRD OQ-2 | New infra (flag service, or a hand-rolled static boolean config) for a single-maintainer hobby-scale static site; PRD OQ-2 explicitly left this as non-blocking/optional | **Rejected for this release** — matches PRD's own resolution; revisit only if OQ-2 is later answered "yes" |
| Add `npm test` gate to deploy.yml | Prevents shipping a build with failing NFR-05 tests; low cost, ~3 lines | Adds a few seconds to every deploy; requires `npm test` script to exit non-zero on failure (verify before adding) | **Recommended** — see Configuration section above |
| Manual staging environment (second GitHub Pages branch/site) | Would let README/UI be previewed before going live to real users | New infra to stand up and maintain for a single-maintainer project with no team to review a staging URL | **Rejected** — disproportionate to project scale; `npm run dev` local preview (already used per PRD's Manual Verification milestone) serves the same purpose today |

### Release-Readiness Checks (feature-specific)

Beyond the standard "build succeeds, tests pass" gate, this feature has one release-readiness risk unique to its shape: **documentation and code shipping out of sync.**

FR-07 requires the README's Impact Radius affiliate-program disclosure to exist before/with the cart button going live — not as a follow-up PR. Because deploy = release here (no flag to hide the button while docs catch up), a merge that ships the button without the README update means the button is live in production with no documented prerequisite, for however long the docs PR lags behind. Concretely check, before merging to `main`:

1. **README FR-07 text and the cart button code land in the same PR / same merge to `main`.** Do not split "ship the button" and "document the affiliate requirement" across two merges — there is no flag to keep the button dark while docs catch up, so a gap between them is a real production gap, not a cosmetic one.
2. **NFR-05 tests are green** (`walmartLinks.ts` branch coverage, `purchaseUnits.ts` key-collision/format guard) — run locally (`npm test`) before merge if the CI test-gate above isn't added yet.
3. **NFR-02 secret check**: `git grep` for credential-shaped strings in the diff, and a spot-check of `dist/` after a local `npm run build` — confirms zero secrets reach the published bundle. Cheap, and this is the one class of leak GitHub Pages (fully public static hosting) cannot contain after the fact.
4. **FR-04's zero-coverage/empty-list render paths manually verified** on `npm run dev` before merge (per PRD's Timeline "Manual verification pass") — since there's no staged rollout to catch a broken empty-state after the fact, this is the only check standing between a broken render and every visitor seeing it simultaneously.
5. **OQ-1/OQ-5 (affiliate approval / ToS timing) status noted at merge time**, even if unresolved — per PRD, these don't block shipping (FR-08 makes the button function regardless), but the Release Manager / Product Owner should have a documented answer, or explicit deferral, before this merge, since post-merge there is no way to quietly pull the button back to "pending" state without a revert.

None of these are new infrastructure asks — they're a manual pre-merge checklist appropriate to a one-pipeline, one-environment, one-shot-release system.

### Risks & Mitigations

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| README (FR-07) merges separately from / after the cart button code | Button live in production with no documented affiliate-approval prerequisite | Medium (easy to split across PRs without a flag forcing atomicity) | Enforce as a single-PR checklist item (see Release-Readiness Checks #1); reviewer confirms both present before merge |
| No test gate in `deploy.yml` today | A build with failing NFR-05 tests can still publish if tests weren't run locally | Medium | Add `npm test` step to `deploy.yml` (Configuration section) or, if declined, treat as a manual pre-merge gate |
| Recreate strategy means a bad release is instantly 100% exposed | Any regression (broken button, wrong URL, JS error) reaches all users at once, not a subset | Low-Medium (mitigated by feature being additive/isolated per architecture.md) | Fast git-revert rollback path (minutes); pre-merge manual verification pass per PRD Timeline |
| Walmart endpoint (`affil.walmart.com/cart/addToCart`) changes/breaks with no notice | Cart button stops working; outside this deploy pipeline's control | Low-Medium, external | Search fallback (FR-06) is endpoint-independent and unaffected; no deploy-side mitigation possible for a static site calling a third-party URL |
| `git revert` targets the wrong commit in a fast-follow-heavy merge history | Rollback could reintroduce or miss unrelated changes | Low | Feature is additive and isolated to 4 files (per architecture.md §1) — revert scope should stay clean; confirm via `git show <commit> --stat` before reverting |

### Assumptions

- `deploy.yml` remains the sole deploy mechanism; no parallel or manual deploy path is used for this feature.
- `main` stays protected such that `deploy.yml`'s push trigger is the only route to production (not verified here — branch protection settings are outside this artifact's file scope, flagged as an open item).
- No plan exists, this release, to introduce a feature-flag system, staging environment, or canary capability for this or future features (consistent with PRD OQ-2's resolution and the project's single-maintainer, hobby scale).
- `npm test` exists and exits non-zero on failure — needs confirming before wiring it into `deploy.yml` (see Follow-Up).

### Follow-Up

- Confirm `npm test` script exists and fails the process (non-zero exit) on a failing test, then add the test step to `deploy.yml` — or explicitly decide to keep it out and rely on manual pre-merge `npm test` runs.
- Confirm README FR-07 text is drafted and merges in the same PR as the cart-button code (Product Owner / Dev coordination item, not a DevOps action, but flagged here since it's the top release-readiness risk for this specific feature).
- Confirm `main` branch protection prevents direct pushes bypassing PR review (outside this artifact's verified scope — recommend a quick check before this feature's merge).
- No further DevOps action needed pre-merge beyond the checklist above — this feature introduces no new deployment surface.
