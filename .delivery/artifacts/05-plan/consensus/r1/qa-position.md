# QA Position — Round 1 Consensus: Walmart Cart Integration Sprint Plan

**Role:** QA Engineer
**Task Type:** consensus-estimate
**Inputs reviewed:** `po/stories.md`, `qa/test-strategy.md` (own prior artifact), `sm/sprint-plan.md`

---

## Position Summary

**Test coverage for the committed Sprint 1 scope (Stories 1, 2, 3, 4, 7) is adequate.** The automated coverage is strong and well-sequenced for the logic/data layer being built this sprint. However, I flag a **real, non-trivial risk** in the manual-verification-only areas — specifically live Walmart cart behavior — that the current plan does not adequately guard against **between releases**, as opposed to at a single release gate. This is a process gap, not a Sprint 1 scope gap, but it needs to be resolved before Sprint 2 ships user-facing behavior that depends on it.

---

## 1. Is coverage adequate for the committed sprint scope?

**Yes, for Sprint 1 as committed.**

- Story 1 (data curation + guard test): guard test is written and CI-gated *before* hand-curation per architecture §3.7 — correct shift-left sequencing. TC-PU-001–007 plus 3 negative cases cover empty/non-digit/collision classes exhaustively for a pure-data concern.
- Story 2 (`buildCartUrl`): all 6 NFR-05 branches (all-curated, mixed, zero-curated, fractional-floor, invalid-skip, all-invalid) have distinct test cases with expected results (TC-CART-001–008). Boundary values (exactly 1, 0.99, 0) are explicit. This is the highest-impact defect class in the feature (silent bad cart contents) and it is fully unit-tested — appropriately, since it's a pure function.
- Story 3 (`buildSearchUrl` + normalizer): encoding edge cases (spaces, special chars, Unicode, empty string) are covered, and the normalizer-consistency check (TC-SEARCH-004) directly defends against the architecture's flagged key-derivation-drift risk.
- Story 4 (test-suite enforcement): closes the loop by requiring all of the above actually exist as passing CI assertions, not just documented intent (TC-COV-001–005).
- Story 7 (CSS, drafted early): correctly scoped as inspection-only this sprint; the sprint-plan risk table already flags the "styling against markup that doesn't exist yet" risk and mitigates it by pinning exact class names in Notes/Constraints, with re-verification gated before Story 7 is marked Done. I accept that mitigation.

Every acceptance criterion in Stories 1–4 has a corresponding test case with a stated expected result (guardrail #1 satisfied). Negative/invalid-input cases exist for every function (guardrail #6). No gaps in Sprint 1's own scope.

**One process observation, not a blocker:** the sprint-level Definition of Done (sprint-plan.md line ~104-109) references "Deployed to staging / verified via `npm run dev`" for Stories 1–4, 7 — but Stories 1–4 are pure logic/data with no UI surface yet (Story 5/6 UI wiring is Sprint 2). There's nothing to manually verify in a browser for Sprint 1's committed stories beyond Story 7's CSS drafting, which itself can't be fully verified without Sprint 2's markup. I'd tighten this DoD line to avoid a false sense that a manual pass happened when it structurally can't yet for most of this sprint's content.

## 2. Risk that manual-verification-only areas could hide regressions between releases

**This is my primary concern, and I rate it Medium-High, not Low.**

The test strategy (my own prior artifact) correctly identifies that live Walmart cart-URL acceptance, popup-blocked-fallback clickability, and dark-mode rendering are not machine-testable and are deferred to a "manual (live behavior)" pass, with exit criteria requiring a "5-step manual verification pass" before each release (not just once at spike time).

The risk table itself rates "Live cart URL rejected/broken by Walmart" as Medium likelihood / Medium impact, with mitigation "manual pre-release verification." I agree with that rating in isolation, but I want to be explicit about a gap the strategy names but doesn't fully close:

- **No repeatable, checklist-enforced manual regression procedure exists yet.** The exit criteria describe *what* the 5-step pass must cover, but there is no artifact (e.g., a UAT/manual-regression checklist file) that gets executed and signed off *every release*, not just at initial ship. A solo hobby cadence with irregular release timing is exactly the profile where an "obviously we'll just check it" manual step silently stops happening after 2-3 releases once the feature feels stable. That's how manual-only coverage areas historically go stale and hide regressions — not through malice, but through erosion of discipline once nothing failed the last few times.
- **`walmartItemId` staleness is an accepted risk with a standing mitigation (search link), not a detection mechanism.** That's a reasonable trade-off given no automated way to poll Walmart's catalog, but it means a delisted/relisted product ID could silently produce a broken cart-add for weeks between releases with zero automated signal — the search-link fallback protects the *user's ability to still buy the item*, but does not protect against the *cart button quietly degrading* unnoticed by the maintainer.
- **The spike (`spike-findings.md`) is correctly *not* treated as a substitute for ongoing manual checks** per my own strategy's Approach section — good — but nothing in the sprint plan or stories operationalizes "this manual check must recur every release" as a concrete, trackable gate (e.g., a release checklist item, or a lightweight automated smoke check hitting the endpoint even if only informationally). Right now it's a documented intention in a test-strategy doc, which is necessary but not sufficient.

**This risk does not block Sprint 1** — Sprint 1 ships no UI, so there is nothing live to verify yet. But it directly affects Sprint 2, where the cart button goes live, and it affects every release after that. I want it resolved before Sprint 2's exit criteria are finalized, not discovered at UAT.

## Recommendation

1. Sprint 1 scope and its test coverage: **accept as planned**, no changes needed.
2. Before Sprint 2 close, add a lightweight, named manual-regression checklist artifact (not just prose in test-strategy.md) that must be executed and dated at every release touching the Walmart cart feature — this converts "manual verification exists" into "manual verification is enforced and traceable."
3. Consider whether a minimal automated smoke check (e.g., a scheduled or pre-release script that issues a HEAD/GET against the constructed cart URL to confirm the endpoint is still reachable and returns a non-error status, without needing to complete checkout) is feasible as a cheap tripwire between manual passes. If not feasible within scope/budget, that's an acceptable trade-off, but it should be a documented, deliberate decision rather than an implicit gap.

## Assumptions
- "Between releases" in the task prompt is interpreted as: after Sprint 2 ships the live cart button, subsequent releases/changes could regress live behavior without anyone re-running the manual pass.
- No CI/CD or release-cadence artifact was provided in the input set; my recommendation about a recurring checklist is based on the sprint-plan's own solo/hobby-cadence framing (irregular release timing raises, not lowers, the risk of a skipped manual step).

## Risks/Gaps Identified
- Sprint-level DoD referencing "staging verification" for stories that have no UI to verify (minor, cosmetic).
- No persisted, dated manual-regression checklist artifact — recurring-check risk (primary finding).
- `walmartItemId` staleness has no automated detection, standing mitigation is user-facing fallback only, not maintainer-facing signal (accepted risk, flagged for visibility).
