## Idea Brief

**Project Type**: FEATURE
**Date**: 2026-08-29

### Problem Statement
MealPlanSite's grocery list (a static, browser-only React/Vite app on GitHub Pages, no backend) already computes real purchasable quantities for a curated set of ingredients and offers a "Copy list as text" fallback. Users still have to manually re-enter that list into a grocery retailer's site to actually buy the items — there is no one-click path from "my grocery list" to "items in a cart."

### Target Users
- **Meal planner shopping online**: a MealPlanSite user who has selected meals for the week and wants to buy the resulting ingredients at Walmart without retyping them.

### Goals
1. Let a user add all curated-ingredient items in their grocery list to a Walmart cart with one click.
2. Ensure every item — curated or not — always has a working manual fallback (search link) so the feature degrades gracefully rather than silently dropping items.
3. Ship with zero backend and no exposed secrets, compatible with static GitHub Pages hosting.

### Constraints
- No backend/server component exists or can be added (GitHub Pages static hosting).
- Walmart's only credential-free capability that can modify a cart is the affiliate `affil.walmart.com/cart/addToCart` deep link (`items=ID|QTY,...`), which requires curated Walmart item IDs (not product names) and is documented as restricted to Impact Radius affiliate publishers.
- Walmart's Marketplace/Supplier (OAuth2 client-credentials) and I/O Affiliate (RSA-signed) APIs cannot build a shopper's cart at all, regardless of secret-handling — ruled out on capability grounds, not just security.
- Instacart's Developer Platform (`products_link` API, Walmart is a listed retailer) was evaluated and rejected: requires a developer-owned Bearer secret with no safe home on a static site, plus ~30-40 day production approval with no hobbyist path.
- Item-ID curation is manual and will go stale over time (relisted/discontinued products) — must never be a silent dead end.

### Initial Scope
- Extend the existing `PurchaseUnitEntry` data model (`src/data/purchaseUnits.ts`) with an optional `walmartItemId`.
- New pure `src/lib/walmartLinks.ts` module: build the cart deep link from curated items, and a per-item Walmart search URL as an always-available fallback.
- UI in `GroceryListView.tsx`: an "Add all to Walmart cart" button (shown only when at least one item is curated, with an honest "N of M items" coverage count) and a per-item "Search" link on every line regardless of curation state.
- Document the Impact Radius affiliate-program prerequisite for production use.

### Out of Scope (initial)
- Any Walmart product-search, pricing, or stock-availability integration (requires the RSA-signed API — impossible without a backend).
- Instacart or any other retailer integration.
- Automated item-ID discovery/validation/refresh — curation is manual; staleness is mitigated only by the always-present search fallback.
- Store selection, price display, or checkout within MealPlanSite itself — the deep link hands off to Walmart entirely.
