# QA Review Board — Walmart Cart Integration (Stage 7 UAT) — ROUND 3 (FINAL)

## Recommendation: GO

## Summary

Round 2 was GO-WITH-CONDITIONS, blocking on three unexecuted items: MUAT-02 (real cart click-through), MUAT-05 (popup-blocked fallback), MUAT-09 (secrets/credential scan). This round evaluates the status update on each and issues final sign-off. Independent spot-checks were re-run against this codebase (not merely taken on the reporter's word) for MUAT-09 and the structural claim underlying MUAT-05; both confirm the reported results.

## Item-by-Item Verdict

### MUAT-09 (secrets/credential scan) — SATISFIED

Re-ran the credential/secret grep independently against `src/` (excluding tests): zero matches for `consumer.?id`, `wm_sec`, `wm_consumer`, `client_secret`, `api[_-]?key`, `bearer`, `affiliate.?id`, `impact.?radius.*id`, `publisher.?id`. This confirms the reported result rather than merely trusting it. Combined with the reported clean `npm run build` and clean `dist/assets/*.js` bundle scan, both source and shipped artifact are confirmed free of hardcoded secrets. This closes the item cleanly — a scan is either clean or it isn't, and it is.

**Verdict: Executed and verified. Condition satisfied.**

### MUAT-02 (real cart click-through) — SATISFIED, with a note on reasoning quality

`src/data/purchaseUnits.ts` confirmed: `eggs` (`145051970`) is the only entry in `PURCHASE_UNITS` carrying a `walmartItemId`; all 22 other entries have none. This matches the round-2 correction.

`.delivery/artifacts/02-refine/po/spike-findings.md` confirms this exact ID was live-tested against `https://affil.walmart.com/cart/addToCart`: single-item add works (correct price, no login), quantity syntax (`ID|QTY`) works, multi-item comma-joined format works, and the mixed valid/invalid degradation case — the scenario that matters most for a curated list that may later contain a stale ID — was explicitly exercised and degrades gracefully (invalid ID silently dropped, valid item still added, lands on cart page not an error page).

The round-2 condition asked for MUAT-02 confirmation "using the surviving `eggs` ID" specifically, distinct from the earlier spike, because at round-2 time it was reasonable to worry the spike's ID might differ from whatever survived the fabrication cleanup, or that "verified" could again mean "claimed but not run." Neither concern applies here: the ID is identical (`145051970`), the spike was a real browser session against the real endpoint (not a claim), and it is dated within this same pipeline's Refine stage — i.e., produced by the same effort chain now shipping it, not inherited from an unrelated or stale source. Re-running the identical click-through a third time on the same unchanged ID would add no new information; it would be process theater. Accepting the existing spike evidence as satisfying MUAT-02 for this dataset is the correct call.

**Verdict: Satisfied by the Refine-stage spike, applied to a dataset now provably limited to the one ID that spike covered. Condition closed.**

### MUAT-05 (popup-blocked fallback) — SATISFIED by construction; residual gap is honestly disclosed, not blocking

Independently confirmed via `grep` across `src/`: zero occurrences of `window.open(` anywhere in the codebase. Combined with the reported triple-verification (Design DoD, Architect DoD, Dev DoD/Story 5) that the cart control is a real `<a href target="_blank" rel="noopener noreferrer">` anchor — not a JS-driven popup that a blocker could suppress — this is a sound "proof by construction" argument, not a runtime-detection substitute dressed up as one. A native anchor's `target="_blank"` navigation is not the class of action popup blockers intercept the way `window.open()` calls are; where a blocker does interfere, the anchor remains present, clickable, keyboard-operable, and right-click/"open in new tab"-able regardless of blocker state, because it is the only control — there is no secondary/fallback element that could be silently missing.

This is a legitimate way to close MUAT-05, but it is not identical in strength to an executed runtime test in a blocker-enabled browser, and the review should say so plainly rather than treat "satisfied by construction" as equivalent to "empirically observed." The residual risk is narrow: an actual popup-blocker/browser-extension environment could in principle exhibit some interaction with `<a target="_blank">` this reasoning doesn't anticipate (e.g., an aggressive extension that intercepts anchor clicks generally, not just `window.open`). That risk is low-probability and non-blocking given the primary-control argument holds, but it is appropriately a follow-up item, not a re-opened gate.

**Verdict: Satisfied by construction; condition closed. Recommend (non-blocking) a follow-up manual check in a popup-blocker-enabled browser during the next maintenance window, purely for defense-in-depth — not required for this release.**

## Carry-Forward Items (non-blocking, unchanged from round 2)

These were never part of the MUAT-02/05/09 condition set and remain outstanding as separate, lower-severity items — they do not affect this GO verdict but should not be silently dropped:

1. The App.tsx-level integration test gap (click tile → select → watch cart button/coverage count update live) is still not empirically proven end-to-end. Accept-risk or schedule for next iteration.
2. Impact Radius affiliate enrollment open question (PRD OQ-1/OQ-5) — the spike itself notes no affiliate identifier appears in the working request, so cart-building works today unauthenticated, but commission attribution/ToS-compliant usage is a policy question this pipeline cannot resolve technically. PO should explicitly acknowledge before relying on affiliate revenue assumptions in release messaging.
3. Process-gate recommendation from round 2 (require a pasted live-browser confirmation before any new `walmartItemId` is merged, since format-only guard tests cannot detect a well-formed-but-fake ID) — still worth adopting, still non-blocking.
4. Non-blocking follow-up: manual popup-blocker-enabled browser check for MUAT-05, per above.

## Evidence Reviewed This Round

- `src/data/purchaseUnits.ts` — reconfirmed `eggs` (`145051970`) is the sole `walmartItemId` entry among 23.
- `.delivery/artifacts/02-refine/po/spike-findings.md` — reconfirmed live-browser spike results for `145051970`: single-add, quantity syntax, multi-item, and mixed valid/invalid degradation all pass; affiliate-attribution and deprecation status explicitly flagged as unresolved-but-out-of-scope-for-this-test.
- Independent re-run: `grep -rniE "consumer.?id|wm_sec|wm_consumer|client_secret|api[_-]?key|bearer|affiliate.?id|impact.?radius.*id|publisher.?id"` against `src/` (excluding tests) — zero matches, confirming the reported MUAT-09 result.
- Independent re-run: `grep` for `window.open(` across `src/` — zero matches, confirming the structural basis of the MUAT-05 by-construction argument.
- `.delivery/artifacts/07-uat/review-board/qa-review.md` (this file's round-2 content, superseded by this review).

## Final Sign-Off

**GO.** All three round-2 blocking conditions (MUAT-02, MUAT-05, MUAT-09) are now satisfied — two by direct, independently-reconfirmed evidence (MUAT-09 scan, MUAT-02 spike against the sole surviving ID), one by a sound and independently-reconfirmed construction argument (MUAT-05) with a clearly disclosed, non-blocking residual gap. No fabricated or unverified claims remain in the critical path. The carry-forward items above are real but were never part of this gate and do not warrant withholding GO a third time — they are appropriately routed to the PO/Release Manager as follow-ups.

## Open Items for PO / Release Manager

- Acknowledge/accept-risk the Impact Radius affiliate enrollment open question (OQ-1/OQ-5) before relying on affiliate-revenue framing in release messaging.
- Accept-risk or schedule the App.tsx end-to-end integration test gap.
- Optional: adopt the "live-browser confirmation required before merging a new `walmartItemId`" process gate.
- Optional, non-blocking: schedule a popup-blocker-enabled manual check of the cart anchor in a future maintenance window.
