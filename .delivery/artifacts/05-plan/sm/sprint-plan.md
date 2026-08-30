# Sprint 1 Plan: Walmart Cart Integration for the Grocery List

**Sprint Goal:** Build and fully unit-test the Walmart cart-link and search-link engine (`buildCartUrl`, `buildSearchUrl`, qualification and key-normalization helpers) on top of verified item data — an internal foundation milestone (data model + calculation layer) with zero remaining core-logic risk, ready to wire into the grocery list UI in Sprint 2. No user-facing button, search link, or coverage count ships this sprint; that user-facing capability is Sprint 2's goal.

**Sprint Dates:** 2026-08-31 -> 2026-09-13 (2 calendar weeks, solo hobby cadence)

**Team Capacity:** 12.5 points (see Capacity Matrix)

---

## Capacity Matrix

Solo hobby project. Team size: 1 (per `.delivery/config.yml` `team.size: 1`). No PTO, no support rotation, no second contributor to redistribute load to if the week gets busy — capacity assumptions are conservative by design.

| Input | Value |
|---|---|
| Team member | 1 (frontend) |
| Realistic hobby hours/week | 6 hrs (evenings/weekend slices around a day job) |
| Sprint length | 2 weeks |
| Raw hours available | 12 hrs |
| Ceremony overhead (solo: planning 0.5h + review 0.5h + retro 0.5h + async refinement 0.5h) | 2 hrs |
| Available coding hours | 10 hrs |
| Historical velocity (hrs/point) | No prior sprint data exists -- this is the project's first pipeline run. The ~0.8 hr/point figure below is SM's own working/mental estimate, not sourced from `architecture.md` or any other document (architecture.md contains no hr/point ratio or time estimate anywhere -- an earlier draft of this plan incorrectly attributed the figure to it; that attribution is removed here). Treat it as a guess to be recalibrated from real data after Sprint 1, not a measured baseline. |
| Effective capacity (hrs / 0.8 hr-per-point, SM's mental estimate) | ~12.5 points |
| 80% buffer applied? | Not applied on top -- the 6 hr/week figure and 0.8 hr/point ratio are already conservative given no historical baseline; treat 12.5 as the ceiling, not the target |

**Utilization check:** Backlog total = 16 points (17 before the Sprint 2 merge described below; Stories 5, 6, and 8 -- 3+2+1=6 points -- merged into one 5-point Story 5, net -1 point). Committing all 16 against 12.5 points capacity = **128% utilization.**

**FLAG: >80% utilization threshold exceeded.** 16 points does not fit in one sprint at this capacity. This plan commits a subset (see below) and carries the remainder to Sprint 2, rather than overcommitting a solo hobby cadence with no slack for interruption.

---

## Committed Stories (Sprint 1)

| # | Story | Points | Assignee | Dependencies |
|---|---|---|---|---|
| 1 | Curate Walmart Item IDs and Guard Data Integrity | 3 | Solo dev | None |
| 2 | Build the Cart-URL Function with a Shared Qualification Helper | 3 | Solo dev | Story 1 (type shape only, not curated data) |
| 3 | Build the Search-URL Function and Export a Shared Key Normalizer | 2 | Solo dev | None (parallel-safe with Story 2) |
| 4 | Unit Test Coverage for walmartLinks.ts | 2 | Solo dev | Stories 2, 3 |
| 6 | Style the Cart Button, Coverage Text, and Search Link (CSS scaffolding only, verified against Sprint 2 markup; formerly numbered Story 7) | 1 | Solo dev | Story 5 (see risk note) |

**Total Committed:** 11 points (well under the 12.5-point ceiling, leaving realistic slack for a solo contributor).

**Committed utilization: 11/12.5 = 88%. WARNING: >80% threshold reached.** Accepted: still well under the 100% blocking threshold, and the 1.5-point gap to ceiling is real buffer for a below-average week. Flagged here explicitly, not just described qualitatively, per gate rules.

### Deferred to Sprint 2

| # | Story | Points | Reason |
|---|---|---|---|
| 5 | Cart button + coverage count + per-item search link + README documentation, merged into a single release-unit story (sub-scopes 5a/5b/5c; formerly separate Stories 5, 6, 8 at 3+2+1=6 points, consolidation-discounted to 5) | 5 | Depends on Story 2's and Story 3's exports landing first; UI wiring and its documentation are sequenced after the core module is stable |

Sprint 2 committed load: 5 points, well within capacity -- leaves room to also close out Story 6 if it slips.

**Structural fix for the Sprint 2 merge-grouping risk (was a prose-only rule, now a single story):** the original plan tracked the cart button, per-item search link, and README as three separate story cards (5, 6, 8) and relied on a prose rule -- "SM/PO enforce this at Sprint 2 planning; do not mark Story 5 Done while Story 8 is open" -- to stop the button shipping live without its documented Impact Radius affiliate prerequisite. On a solo project with no CI gate, no branch protection, and no second reviewer, that rule had no teeth: it was a note-to-self, most likely to be skipped under exactly the schedule pressure this plan already flags as a live risk (6 hrs/week is optimistic). `stories.md` has been revised to merge Stories 5, 6, and 8 into one story with one Done state (sub-scopes 5a cart button, 5b search links, 5c README, all required for the story to be Done). A single story cannot be partially shipped -- the risk is removed by construction, not by a promise to remember. Sprint 2's committed load is now this one 5-point story instead of three separate cards summing to 6 points.

---

## Commitment Rationale

Architecture's own build order is: (1) data model + guard test, (2) `walmartLinks.ts` core, (3) `GroceryListView.tsx` wiring, (4) CSS, (5) README. Sprint 1 takes phases 1-2 in full (Stories 1-4, 10 points) plus starts phase 4 (Story 7, CSS scaffolding) since it is small, additive, and low-risk to draft ahead even though its full verification depends on Sprint 2's markup landing.

This ordering serves the sprint goal directly: by the end of Sprint 1, `buildCartUrl`, `buildSearchUrl`, `getQualifyingItems`, and `normalizeIngredientKey` all exist, are fully unit-tested, and are ready to wire into the UI with zero remaining core-logic risk. Sprint 2 becomes a low-risk UI-wiring sprint with fully-proven building blocks underneath it -- it does not carry any open questions about cart-URL correctness into the UI work.

Story 5 (merged) is deferred because it is hard-dependent on Sprint 1's outputs (sub-scope 5a needs Story 2's exports; sub-scope 5b needs Story 3's `buildSearchUrl`; sub-scope 5c documents a button that doesn't exist yet) and because 16 points does not fit in a realistic 12.5-point solo capacity window regardless of ordering.

---

## Risks to Sprint Goal

| Risk | Mitigation |
|---|---|
| The 0.8 hr/point ratio is SM's own mental/working estimate, not measured from any historical velocity data (there is none -- first pipeline run) and not sourced from architecture.md or any other document | Track actual hours per story this sprint; recalibrate Sprint 2 capacity from real data at retro. This is an accepted characteristic of a first-sprint plan, not a defect to fix before Sprint 1 starts -- there is no real data to replace it with yet. |
| Story 6 (CSS, formerly Story 7) is scoped this sprint but its consumer markup (Story 5's sub-scopes 5a/5b) doesn't exist until Sprint 2 -- risk of styling against assumed class names that drift | Write Story 6's CSS rules against the exact class names specified in Story 5/6 Notes/Constraints (`.walmart-cart-button`, `.walmart-coverage-count`, `.grocery-item__search-link`); re-verify visually once Sprint 2 markup lands, before Story 6 is marked Done |
| 6 hrs/week is optimistic for a hobby project with variable real-life availability | Committed 11 of 12.5 points, not all 12.5 -- absorbs a below-average week without missing the sprint goal |
| Guard test (Story 1) blocks Story 2's full integration if curated data has key collisions | Architecture already sequences guard test before hand-curation within Story 1 itself; no cross-story exposure |
| Live Walmart cart behavior is manual-verification-only and could silently erode between releases once the feature feels stable (no automated signal on `walmartItemId` staleness or endpoint breakage) | **Acknowledged, unenforced process discipline -- a manual habit, not a gate.** No checklist file, CI check, or branch-protection rule exists today, and none is being added by this plan: per the solo-hobby-project preference for light-touch process with no CI/tooling overhead, this is intentionally left as a habit the solo dev commits to (re-open the grocery list and click through the cart/search links at every release that touches this feature) rather than a promise of future tooling. If it lapses, nothing in this plan catches it -- that is a known, accepted gap, stated plainly rather than dressed up as a resolved risk. |

---

## Coverage Matrix (PRD FR-ID -> Story/Task)

Every FR-ID from `prd.md` mapped to at least one story. No unmapped FR found -- **no BLOCKING finding.**

| FR-ID | Requirement | Mapped Story | Sprint |
|---|---|---|---|
| FR-01 | Curated Walmart item IDs on `PurchaseUnitEntry` | Story 1 | Sprint 1 |
| FR-02 | `buildCartUrl` cart-deep-link builder | Story 2 | Sprint 1 |
| FR-03 | `buildSearchUrl` search-link builder | Story 3 | Sprint 1 |
| FR-04 | "Add all to Walmart cart" button + coverage count | Story 5, sub-scope 5a | Sprint 2 |
| FR-05 | Do-not-use-Marketplace/Affiliate-API constraint | Enforced by omission across Stories 2-4 (per stories.md Story Summary) | Sprint 1 |
| FR-06 | Per-item Search link on every grocery-list line | Story 5, sub-scope 5b | Sprint 2 |
| FR-07 | README documents affiliate prerequisite | Story 5, sub-scope 5c | Sprint 2 |
| FR-08 | Pre-approval UX (button renders regardless of affiliate status) | Story 5, sub-scope 5a (folded in per stories.md Notes) | Sprint 2 |
| NFR-01 | No server/backend component | Cross-cutting, verified within Stories 2-4 (pure client module) | Sprint 1 |
| NFR-02 | No secrets/credentials committed | Cross-cutting, verified within Story 5 sub-scope 5c (TC-README-003) and code review | Sprint 1 & 2 |
| NFR-03 | `walmartLinks.ts` pure, framework-free | Stories 2, 3 | Sprint 1 |
| NFR-04 | Reuse existing design tokens, no new visual language | Story 6 (formerly Story 7) | Sprint 1 (drafted) / verified Sprint 2 |
| NFR-05 | Unit test coverage for `walmartLinks.ts` branches | Story 4 | Sprint 1 |

**Note:** FR-04, FR-06, FR-07, FR-08 are mapped but scheduled for Sprint 2, not this sprint -- they are covered in the backlog, not unmapped. All four now map to the same single merged Story 5 (sub-scopes 5a/5b/5c) rather than three separate cards. This sprint's goal is scoped to the data/logic layer (FR-01, FR-02, FR-03, FR-05, NFR-01/02/03/04/05); the user-facing button/link/docs land in Sprint 2 as one release unit. This is a scope-vs-capacity decision, not a coverage gap.

---

## Definition of Done (Sprint Level)

- [ ] All acceptance criteria pass for Stories 1, 2, 3, 4, 6
- [ ] Code reviewed (self-review checklist for solo dev: diff read twice, guard/unit tests run locally)
- [ ] Tests written and passing (`npm test` green, including Story 1's guard test and Story 4's full branch suite)
- [ ] Deployed via the existing pipeline / built successfully via `npm run dev` -- note: Stories 1-4 have no UI surface this sprint, so there is nothing to manually verify in a browser yet; Story 6's CSS is inspection-only and cannot be visually confirmed until Sprint 2's markup lands (see Risks)
- [ ] PO sign-off on acceptance criteria (self as PO, per solo-project structure)
- [ ] Sprint 2 backlog (Story 5, merged, sub-scopes 5a/5b/5c) confirmed Ready, with dependencies on this sprint's outputs verified closed. The former three-card merge-grouping concern is now structural (Story 5 is one story with one Done state -- see Committed Stories section) rather than a process rule to carry forward. The recurring manual-verification habit (see Risks) is carried forward explicitly into Sprint 2 as acknowledged, unenforced process discipline -- not as a resolved gate.
