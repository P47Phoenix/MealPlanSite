## Architecture Review: Walmart Cart Integration for the Grocery List
## Role: Solution Architect

### Summary
Architecture is implementation-ready at Light depth: module boundaries and data flow are unambiguous, the flagged key-derivation gap has a concrete (not merely named) resolution, and the design traces cleanly to the PRD and upstream component specs with no contradictions found.

### DoD Criteria (Light depth — blocking only)

| # | Criterion | Result |
|---|---|---|
| 1 | Module boundaries and data flow are unambiguous enough to implement without further architectural decisions | PASS |
| 2 | The key-derivation duplication risk between `groceryList.ts` and `walmartLinks.ts` has a concrete resolution stated | PASS |
| 3 | No contradiction with the PRD or component specs | PASS |

### Findings

#### Critical
None.

#### Warning
None.

#### Suggestion
- **§3.1 resolution is Dev-optional in wording, not requirement wording.** The text frames exporting `normalizeIngredientKey` as a "recommendation... flag as a one-line follow-up, not a blocker," while PRD Dependencies & Risks (row 4) states the mitigation is that the technical plan "requires reusing/exporting the existing key-derivation function rather than reimplementing it" — a `requires`, not a `recommends`. This is not a contradiction (architecture.md correctly identifies the export doesn't exist yet and gives Dev an unambiguous 2-line implementation), but the modal softening ("recommendation," "not a blocker") sits slightly below the PRD's mitigation language. No fix required for DoD purposes since the resolution itself is concrete and actionable — Dev has everything needed to implement it — but Plan/Dev stage should treat §3.1 as a required task, not an optional one, when decomposing stories.

### Detail on Criterion 1 — Module Boundaries and Data Flow

Three touch points are named with exact file paths, exact signatures (`buildCartUrl(items: GroceryItem[]): string | undefined`, `buildSearchUrl(itemName: string): string`, internal-export `getQualifyingItems`), and exact ownership rules (`walmartLinks.ts` owns all Walmart URL logic; `purchaseUnits.ts` carries only inert data; `groceryList.ts` is untouched). The data-flow diagram in §2 traces the full path from `selectedCards` through `buildGroceryList()` to the two URL builders to the rendered anchor elements, including the exact key-derivation line numbers (`groceryList.ts` line 102-103) and the quantity-validity gate logic. §3 gives Dev concrete, numbered sequencing guidance (build order in §7) rather than leaving open architectural decisions. No further architectural decision is required before implementation — this satisfies the Light-depth bar.

### Detail on Criterion 2 — Key-Derivation Duplication Resolution

§3 item 1 states a concrete resolution, not just a named risk: export `normalizeIngredientKey(name: string): string` from `groceryList.ts` (or a shared tiny util), with both `groceryList.ts`'s aggregation and `walmartLinks.ts`'s lookup calling it. This is an actionable, ~2-line, unambiguous instruction — a named function, its source module, its call sites, and its signature — not merely "there's a duplication risk, watch out." §5's risk table cross-references the same resolution as the mitigation for the corresponding risk row. This meets the bar of "concrete resolution stated."

### Detail on Criterion 3 — No Contradiction with PRD/Component Specs

Cross-checked all FR-01 through FR-08 and NFR-01 through NFR-07 against architecture.md's Prior Art Analysis table and body:
- NFR-01 (no backend) — architecture.md opens by restating this as load-bearing; consistent.
- FR-01 (8 priority staples minimum) — architecture.md §1 names the same 8 staples; consistent.
- FR-02/FR-03 (function signatures, URL formats, quantity gate) — architecture.md §1 and §2 reproduce the same signatures and the same quantity-validity gate (skip on ≤0/NaN/null/undefined, floor fractional-positive to 1); consistent.
- NFR-07 (popup-blocked fallback) — architecture.md §2a formalizes the single-anchor-element resolution that component-specs.md and user-flows.md already locked; no relitigation, no contradiction.
- NFR-05 (test coverage incl. key-collision test) — architecture.md §3 item 7 explicitly sequences the `purchaseUnits.ts` guard test before `walmartLinks.ts` build; consistent with and reinforces the PRD requirement.
- FR-08 / OQ-1 / OQ-5 (pre-approval UX, affiliate ToS timing) — architecture.md §6 carries these forward as non-architectural open questions with correct ownership (Product Owner/Legal), taking no architectural action inconsistent with FR-08's "ships regardless" rule.

No FR, NFR, or upstream UI/UX decision is reopened, weakened, or contradicted anywhere in architecture.md.

### Quality Attribute Assessment
| Attribute | Current State | Risk Level | Recommendation |
|-----------|--------------|------------|----------------|
| Modifiability | Clean single-owner boundaries (`walmartLinks.ts` sole owner of Walmart logic); key-derivation duplication has a stated fix | Low | Implement §3.1's `normalizeIngredientKey` export during this pass per build order in §7 |
| Testability | NFR-03/NFR-05 satisfied by design — pure, framework-free module, explicit test sequencing in §3.7 | Low | None |
| Consistency (derived-state correctness) | §3.2/§3.3 flag the two places drift could silently occur (qualification-logic duplication, `useMemo` dependency desync) and give structural fixes (shared exported helper, single `[groceryList]`-keyed memo) | Low | None — already addressed |

### Recommended Actions
1. None blocking. Architecture is ready for Plan/Dev stage.
2. Carry §3.1 (`normalizeIngredientKey` export) and §3.2 (shared `getQualifyingItems` export) into story acceptance criteria as required implementation steps, not optional follow-ups, given the PRD's "requires" framing.
