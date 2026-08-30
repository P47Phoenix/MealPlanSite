# Memory Index — MealPlanSite Delivery Pipeline

Routing index. Keep this file short — details live in topic/stage files below.

**Runs recorded:** 1 (`run-2026-08-29-wmrt` — Walmart Cart Integration, first pipeline run, merged `d62f2a6`)

## Stage Health (as of last run)

| Stage | Health | Note |
|---|---|---|
| Refine | Good | Challenger + live spike resolved foundational risk before decomposition. |
| Design | Good (self-corrected) | Round-1 DoD FAIL on cross-artifact sync, round-2 PASS. Working as intended. |
| Architect | Good | Coupling risks correctly identified; not fully priced into story points (see Plan). |
| Plan | Caution | Challenger caught a fabricated capacity-figure citation. Two process fixes remain enforcement-free prose. |
| Dev | Good (self-corrected) | QA DoD caught a zero-test story and a mislabeled test across 3 rounds before PASS. |
| UAT | Excellent | Manual live-browser verification caught 7/8 fabricated product IDs — most consequential finding of the run — and team fully re-curated rather than degrading. |

## Hot Lessons (top 5, apply to every future run)

1. **External, unowned facts are not evidence until live-verified.** An agent's "high confidence" about a citation, product ID, URL, or API detail is not a substitute for opening the real source/browser/tool. Happened twice this run (capacity citation, 7/8 product IDs); both caught only by review that actually checked. See `topics/gate-patterns.md` Pattern 3, `stages/development.md`.
2. **Verify external unowned mechanisms via live spike before locking requirements.** Don't let PRD requirements lock around an unverified third-party API/mechanism — spike it live first. See `stages/refine.md`.
3. **DoD/review gates must independently verify, not trust self-reports.** Re-run tests, read actual content, don't check "does X exist" — check "does X's content satisfy the requirement." See `topics/gate-patterns.md` Pattern 1.
4. **Cross-artifact sync after a revision is not automatic.** Explicitly re-check every artifact referencing a revised concept; "the revision covered it" is an assumption, not a fact, until checked. See `topics/gate-patterns.md` Pattern 2.
5. **When a caught gap can be fixed for real, do that — don't just degrade gracefully and stop.** Re-curate/re-verify fully rather than quietly shipping a reduced feature set as the final state. See `topics/gate-patterns.md` Pattern 4.

## Pointers

- `topics/gate-patterns.md` — DoD/adversarial-review patterns that caught real issues (independent verification, cross-artifact sync, live-verification for external data, resolve-for-real over degrade).
- `stages/refine.md` — verify external mechanisms via spike before locking requirements.
- `stages/development.md` — AI-generated "high confidence" external facts require live verification.
- `archive/run-2026-08-29-wmrt.md` — full retrospective for this run (what went well/poorly, action items).

## Open Action Items Carried Forward

See `archive/run-2026-08-29-wmrt.md` Action Items table (6 items, all open as of this run) — notably: unverified-by-default gate for AI-curated external identifiers (#2), and converting prose-only Sprint 2 process fixes into real checked gates (#4).
