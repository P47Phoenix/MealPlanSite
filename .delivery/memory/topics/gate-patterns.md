# Topic: Gate / DoD / Review Patterns

Lessons about what DoD and adversarial-review gates actually caught, to keep applying and to sharpen. Source run: `run-2026-08-29-wmrt` (Walmart Cart Integration, first pipeline run).

## Pattern 1: Independent verification beats trusting self-reports

QA DoD on Story 5 caught a story shipped with zero real component-test coverage despite 16 specified test cases in `stories.md` — caught because QA read the actual test file rather than trusting the developer's "tests pass" claim. Round 2 then caught a test that existed under the right name (TC-SL-N01) but tested the wrong thing — caught only because QA read the assertion content against the spec, not just checked a test with that ID existed.

**Rule:** a DoD validator's job is not "does an artifact/test/citation with this name exist" — it is "does its actual content satisfy the requirement." Always re-run tests independently and read real content, never trust a self-report of "done" or "passing."

## Pattern 2: Cross-artifact consistency after a revision needs an explicit sync step

Design stage: a component-spec revision (anchor-only cart control, no separate button/fallback element) did not propagate to `user-flows.md`/`wireframes.md` on first pass. UX's own DoD self-check caught it — round 1 FAIL, round 2 PASS after explicit re-read and grep sweep for stale phrasing (`window.open`, `fallback-link`, `open question`, etc.).

**Rule:** after any spec revision, do not assume "the revision covered it." Require an explicit sync pass across every artifact that references the revised concept — grep for the old language, not just spot-check the new one.

## Pattern 3: External, unowned facts need live verification, not plausibility

Two separate incidents in one pipeline:
- Sprint Plan: PO cited a 0.8 hr/point capacity figure as sourced from `architecture.md`; the document contains no such figure. Caught by the challenger actually opening the source.
- Dev: 7 of 8 "high-confidence" Walmart product IDs (curated from "model knowledge," not live-verified) were fabricated — wrong or dead products. Caught only because a human-directed manual verification step existed in the UAT plan and was actually executed with real browser tooling.

**Rule:** "high confidence" from a generative agent about a specific external, unowned fact (a citation, an ID, a URL, an API detail) is not evidence. Any requirement, estimate, or dataset built on such a fact needs a live-verification step (open the actual document/browser/tool) before it is trusted downstream, and that step must be executed, not left as a note that could be skipped under schedule pressure.

## Pattern 4: A caught gap should be resolved for real, not gracefully degraded away

When the 7 fabricated Walmart IDs were found, the team's first fix was to drop them (graceful degradation to 1-of-8 curated coverage). The team then went back and genuinely re-curated all 7 via live browser search, restoring full FR-01 compliance. Prefer this over settling for a silently reduced feature — track "acceptable interim state" vs "final state" explicitly if degradation is used as a stopgap.

## Watch item for next run

Sprint-plan challenger flagged that two "resolved" process fixes (Sprint 2 merge-grouping constraint, recurring manual-verification checklist) were enforcement-free prose on a solo project with no second reviewer. Prose-only fixes to process risks did not get closed within this pipeline run — check whether a future run converts these into actual gates (CI check, PR template checkbox) rather than notes-to-self.
