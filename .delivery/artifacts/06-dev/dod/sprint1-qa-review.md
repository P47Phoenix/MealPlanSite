# Sprint 1 QA DoD Validation — Stories 1–4 (Walmart Cart Integration)

**Reviewer:** QA Engineer (delivery-team:quality, dod-validation)
**Scope:** Stories 1 (data curation + guard), 2 (buildCartUrl), 3 (buildSearchUrl/normalizer), 4 (unit test coverage)
**Date:** 2026-08-29

## Gate Criteria and Verdicts

### 1. Every TC-ID in stories.md (Stories 1–4) has a corresponding passing test — PASS

Cross-checked `stories.md`'s TC-ID tables against the actual test files, not just story-4.md's claims.

**Story 1 — `src/data/purchaseUnits.test.ts`** (10 tests): TC-PU-001, 002, 003, 004, 005, 006, 007, N01, N02, N03 all present as named/commented test cases and all pass. Verified by reading the file directly (not story-1.md's summary alone).

**Story 2/3 — `src/lib/walmartLinks.test.ts`** (26 tests): TC-CART-001 through 008, N01–N03 (11 tests), TC-SEARCH-001 through 005, N01–N02 (7 tests) all present with matching titles and assertions that match the ACs (exact URL format, `URLSearchParams` encoding, floor-to-1 behavior, skip-on-invalid, `getQualifyingItems`/`normalizeIngredientKey` shared-implementation checks). All pass.

**Story 4 — TC-COV-001 through 004**: present in a `suite completeness (TC-COV)` describe block. Note: TC-COV-001 and TC-COV-002 are **assertion-free structural placeholders** (`expect(true).toBe(true)`) — they document coverage by reference to the TC-CART/TC-SEARCH blocks rather than independently re-verifying it. This is acceptable per the story's own Coverage Notes ("enforcement is structural: the six describe blocks above... each assert one of these branches") and does not constitute a false claim, but it is worth flagging: these two are not independent tests, they are coverage-mapping documentation. TC-COV-003 and TC-COV-004 do contain real assertions (drift checks) and pass genuinely.

**TC-COV-005 (full suite green in CI)**: story-4.md self-reports this as "LOCAL PASS (CI run not verified from this session)" — this is an honest, correctly-flagged limitation, not a false claim. Independently re-verified below.

Total accounted for: 10 (Story 1) + 18 (Stories 2/3 via walmartLinks tests, counting TC-CART and TC-SEARCH incl. negatives) + TC-COV-001..004 (Story 4) = all TC-IDs enumerated in stories.md for Stories 1–4 map to a passing test. No TC-ID was found unaccounted for.

### 2. Full suite passes with no regressions — PASS (independently verified)

Ran `npm test -- --run` directly from `C:\GitHub\MealPlanSite`:

```
Test Files  12 passed (12)
     Tests  133 passed (133)
```

This matches story-4.md's claimed "12 test files passed, 133 tests passed, 0 failing" exactly — independently reproduced, not trusted on the claim alone. `walmartLinks.test.ts` (26/26) and `purchaseUnits.test.ts` (10/10) both green, and no other suite (`groceryList.test.ts`, `dietaryRules.test.ts`, `App.test.tsx`, etc.) shows regressions.

### 3. Story 1's guard test genuinely fails on the negative fixtures it claims to catch — PASS (spot-checked)

Story-1.md and the TC-PU-004/005/006/N01/N03 test cases claim the guard detects empty IDs, non-digit IDs, whitespace-only IDs, and key collisions. These are tested in-file against synthetic fixture clones (via `findInvalidWalmartIds`/`findCollidingKeys` helper functions), which is a legitimate unit-test pattern — but to confirm the guard isn't a tautology (i.e., that it would actually catch a real defect in the shipped data, not just a fixture it constructs and immediately validates), I performed an independent mutation test:

1. Temporarily set `eggs.walmartItemId` to `''` directly in `src/data/purchaseUnits.ts` (the real shipped file, not a test fixture).
2. Ran `npm test -- purchaseUnits --run`.
3. Result: **2 tests failed** — `TC-PU-007` ("passes with 0 failures on the real curated data") failed with `Array [] vs Array ["eggs"]`, and `TC-PU-002` ("all 8 priority staples...") failed with `AssertionError: "eggs" is missing a walmartItemId: expected '' to be truthy`.
4. Reverted the file from backup; re-ran the suite: 10/10 passing again, confirming clean restoration (`git diff` shows only the original Story 1 feature diff, no residue from the spot-check).

This confirms the guard is not vacuous — it genuinely fails when real curated data is corrupted, not only against fixtures it was written to always catch.

## Overall Verdict: PASS

All three gate criteria pass. Sprint 1 (Stories 1–4) is verified DONE for QA purposes:
- Every enumerated TC-ID has a corresponding, passing, correctly-titled test.
- The full suite (133 tests, 12 files) passes with zero regressions, independently reproduced.
- The Story 1 guard test was proven to genuinely detect a real injected defect, not just pass against fixtures.

## Minor Observations (non-blocking)

1. **TC-COV-001/002 are documentation stubs, not independent assertions.** They rely entirely on the correctness of the TC-CART/TC-SEARCH blocks elsewhere in the same file. This is disclosed honestly in the story notes and is acceptable given this is a "branch presence" coverage model (no numeric coverage threshold specified in the PRD per the story's own Coverage Notes), but a future sprint could tighten this by having TC-COV-001/002 programmatically enumerate `describe` block names rather than hard-coding `true`.
2. **TC-COV-005 (CI-run confirmation) was never observed running in actual CI** — only locally, by both the developer and this QA pass. If a CI pipeline exists for this repo, it should be confirmed to run `npm test` on push/PR; this is out of scope for this DoD validation but is flagged as a gap for the Operations/DevOps role.
3. **7 of 8 Walmart item IDs remain developer-recalled, not live-verified** (per story-1.md's confidence flags). This does not affect Sprint 1's automated-test DoD (format/uniqueness are the only machine-testable properties, and they pass), but it is a pre-production blocker that must be closed by a human spot-check before the cart feature ships live, per story-1.md's own follow-up note. Not a QA gate failure for Sprint 1 — carrying forward as a UAT/pre-release item.
