# Implementation-Sequencing Note: Walmart Cart Integration Stories
## Role: Solution Architect (contributor, not gate-owner — PO retains Stage 5 sign-off)

Reviewed: `.delivery/artifacts/05-plan/po/stories.md` (8 stories, 17 pts) against `.delivery/artifacts/04-architect/solution/architecture.md` §7 Downstream Notes and §2a anchor-only decision.

---

## 1. Build Order — Confirmed Match

Architecture §7 build order: (1) data model + guard test, (2) `walmartLinks.ts` w/ shared helpers, (3) `GroceryListView.tsx` wiring, (4) CSS, (5) README.

Story Summary Table maps cleanly:

| Phase | Architecture §7 | Stories |
|---|---|---|
| 1 | Data model + curation + guard test | Story 1 |
| 2 | `walmartLinks.ts` core + shared helpers | Stories 2, 3, 4 |
| 3 | `GroceryListView.tsx` wiring | Stories 5, 6 |
| 4 | CSS | Story 7 |
| 5 | README | Story 8 |

Confirmed: order matches. Two refinements within Phase 1/2, both correctly captured by PO:

- Guard test written before curation within Story 1 (§3.7 sequencing note) — PO's AC for Story 1 explicitly requires the guard test suite exists and fails on bad data, and Notes cite §3.7 by name. Correct.
- `normalizeIngredientKey` export (§3.1, the "one real gap") landed in Story 3 alongside `buildSearchUrl`, not deferred. Architecture flagged this as recommended-but-not-blocking; PO promoted it to an AC (Story 3, third Given/When/Then) rather than leaving it optional. That's a legitimate tightening, not a deviation — closes the gap architecture called out instead of carrying it forward as residual risk.

No reordering needed. Sequencing is sound.

---

## 2. Hidden Dependencies Check

Walked every story's stated dependency against the actual code touchpoints in §1/§2 of the architecture doc.

- Story 2 → Story 1: correctly scoped as "type shape only," not "curated data complete." Matches architecture (`walmartItemId?: string` field is what Story 2 needs, not populated values).
- Story 3 → Story 1: correctly stated as none required (`buildSearchUrl` takes no curated-data dependency). Confirmed against architecture §2 data flow — search path never touches `PURCHASE_UNITS`.
- Story 4 → Stories 2 & 3: correct, functions must exist before testing them.
- Story 5 → Story 2 (`buildCartUrl`, `getQualifyingItems`): correct. One thing worth flagging — Story 5's Notes say it also "depends on Story 3 (buildSearchUrl not required here, but module must exist)." That's true but slightly imprecise: Story 5 doesn't need Story 3 at all, since `walmartLinks.ts` already exists as a module after Story 2 alone. Not a sequencing defect (Story 3 ships before Story 5 anyway per phase order), just a soft note — no action needed, flagging so Dev doesn't read it as a hard gate if stories ever get reordered mid-sprint.
- Story 6 → Story 3 (`buildSearchUrl`): correct and necessary.
- Story 7 → Stories 5 & 6 (markup/class names must exist): correct, CSS-after-markup is right.
- Story 8 → none (pure docs): correct, no hidden code dependency.

One real hidden-dependency item not spelled out anywhere: Story 3's export of `normalizeIngredientKey` from `groceryList.ts` touches the *existing* aggregation call site (replacing inline `.trim().toLowerCase()` with the new exported function). Story 1 doesn't touch `groceryList.ts`, and no story explicitly says "verify `groceryList.ts`'s existing output is unchanged after this refactor" as a regression check — Story 3's AC only asserts both callers use the same function, not that `groceryList.ts`'s pre-existing behavior is provably identical pre/post-refactor. Recommend Dev add a quick existing-test-suite-still-passes check (if `groceryList.ts` has tests) as part of Story 3's Definition of Done, since this is an extract-and-export of logic already in production, not net-new code. Minor — not blocking, not a resequencing issue.

No story has an undeclared dependency that would break if built in stories.md's stated order.

---

## 3. Locked-Decision Check

Verified no story asks Dev to decide something architecture already closed.

- **Anchor-only cart control (§2a):** Story 5's Notes cite §2a directly ("locks this as a single anchor element — no `<button onClick={window.open}>` path") and the AC specifies the exact `<a>` markup, not a choice of markup. Correct — Story 5 presents this as a build spec, not an open decision.
- **Qualification helper as single shared source (§3.2):** Story 2's AC requires `getQualifyingItems` be exported and be the one implementation both `buildCartUrl` and Story 5's coverage count use — matches architecture's "structurally impossible to drift" intent, not left as a Dev judgment call.
- **`useMemo` dependency on `[groceryList]` not `[selectedCards]` (§3.3):** Story 5's Notes state this explicitly ("do not key independently off `selectedCards`") — correctly carried forward as a constraint, not reopened.
- **Search link unconditional, no gating (§FR-06/FR-08 folding into Story 5):** Story 5's AC explicitly states the button is not gated behind affiliate-approval status, matching architecture's "not an open implementation choice" framing.

No story re-litigates a locked decision. All four architecturally-significant constraints (anchor-only control, shared qualification helper, `useMemo` keying, unconditional search link) appear as ACs or Notes, not as open questions for Dev.

---

## 4. Summary

Build order: confirmed match, no changes needed. Hidden dependencies: none blocking; one minor DoD suggestion for Story 3 (verify `groceryList.ts` regression-safe post-refactor). Locked decisions: all four carried through correctly as specification, none reopened as a Dev decision point.

Recommend PO proceed to Stage 5 sign-off as-is; the one Story 3 DoD suggestion above is optional hardening, not a blocker.
