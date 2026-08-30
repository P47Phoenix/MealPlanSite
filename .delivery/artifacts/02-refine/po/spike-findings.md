# Spike: Walmart Add-to-Cart Deep Link Verification

**Date**: 2026-08-29
**Method**: Live browser test against `https://affil.walmart.com/cart/addToCart`, real Walmart product (item ID `145051970`, Great Value Large White Eggs 12ct), unauthenticated session.

## Findings

1. **Single item add works.** `?items=145051970` redirected to `walmart.com/shoppingcart` with the item present, correct price ($1.67), no login required.
2. **Quantity syntax `ID|QTY` works.** `?items=145051970|2` added 2 more units on top of the existing 1 (1→3), confirming cumulative quantity addition, not a fixed set.
3. **Multi-item comma-separated format works.** `?items=ID1|QTY1,ID2|QTY2` added both items in a single request.
4. **All-invalid request fails cleanly.** A request with only a bogus ID (`999999999999`) returned an explicit "Invalid item or quantity. You will be redirected to Walmart shortly." page — no crash, no silent hang.
5. **Mixed valid+invalid request degrades gracefully — the critical case.** `?items=145051970|1,999999999999|1` added only the valid item (eggs 3→4) and silently dropped the invalid one, landing directly on the cart page (not the error page). This is exactly the per-item graceful-degradation behavior FR-06/NFR assumed for stale IDs in a real curated list.

## Unresolved

- **No publisher/affiliate identifier appeared in any working request**, despite Walmart's docs stating the endpoint is "restricted to Impact Radius affiliate publishers." The mechanism functions today, unauthenticated, for anyone — this test confirms **cart-building capability**, not **affiliate commission attribution or ToS-compliant usage without enrollment**. Those remain governed by Walmart's stated policy, not a technical gate this test could observe.
- **Deprecation status unconfirmed.** Walmart's docs reference a "Consolidated Add to Cart" replacement API but no fetchable page gave its endpoint, timeline, or whether the legacy endpoint tested here has a sunset date. Today's mechanism works; its longevity is unknown.

## Resolution of Challenger Point 1

The foundational blocker — "no source proves this endpoint exists, is live in 2026, or accepts this exact parameter shape" — is now **resolved by direct observation**: confirmed live, confirmed working, confirmed for the exact URL format and edge cases (mixed valid/invalid) the PRD depends on. FR-02 through FR-04 and FR-08 can proceed on a verified technical contract rather than an assumed one.

Challenger points 2 (ToS/legal risk framing) and 4 (staleness cadence/ownership) are **not** resolved by this spike and remain open per the PRD's existing Open Questions.
