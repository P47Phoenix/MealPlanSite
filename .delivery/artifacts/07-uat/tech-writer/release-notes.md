## Documentation: Release Notes — Walmart Cart Integration
## Role: Technical Writer
## Task: release-notes

### Audience
MealPlanSite end users (meal planners who build a grocery list and shop at Walmart). No technical background assumed.

### Document

# What's New: Walmart Cart Integration

Your grocery list can now send items straight to Walmart, instead of you retyping everything by hand.

## Add all to Walmart cart

The grocery list panel has a new **"Add all to Walmart cart"** button. Click it and a new tab opens with a Walmart cart already containing your matched items, at the right quantities.

This only works for ingredients MealPlanSite has curated with a verified Walmart product match. **Right now that's 8 ingredients: garlic, onion, chicken breast, eggs, olive oil, canned tuna, brown rice, and greek yogurt.** Everything else in your list is not yet matched.

Note: an earlier draft of this note also said 8 ingredients were curated, then a UAT spot-check found 7 of those 8 item IDs were AI-fabricated and never actually verified, so they were pulled. All 7 have since been re-curated through a real live-browser check — each product page was opened and confirmed to match its ingredient — and are back in the data alongside eggs, which was verified earlier. All 8 are now genuinely confirmed.

The button shows an honest count next to it — for example "8 of 14 items" — so you always know how much of your list made it into the cart versus what didn't. The button only appears when at least one item in your list is matched; if none are, it stays hidden rather than showing you an empty or broken action.

Coverage is small today by design — each match is hand-verified against a real Walmart product page before it ships. Coverage will grow release over release as more ingredients get verified this way.

## Search links, on every item

Every line in your grocery list — matched or not — now has a small **"Search"** link. Click it and Walmart's search results for that ingredient open in a new tab. This is your fallback for anything the cart button doesn't cover, and it also covers you if a matched item's Walmart listing ever goes stale or gets pulled.

## Honest framing: affiliate status not yet confirmed

The cart button uses a Walmart link (`affil.walmart.com/cart/addToCart`) that Walmart restricts to approved affiliate partners. We have not yet confirmed that this site holds that approval. The link works today in testing, but Walmart could reject or change it at any time without notice. See the project README for the current status of this.

Nothing about this changes how the feature behaves for you — the button and search links work the same either way — but we'd rather tell you plainly than pretend otherwise.

### Content Structure
1. What's New heading
2. Add all to Walmart cart (feature, current coverage, honest limitation)
3. Search links (universal fallback)
4. Honest framing / affiliate status note

### Review Checklist
- [x] Accuracy verified (curated count cross-checked against `src/data/purchaseUnits.ts`: 8 of 24 entries carry `walmartItemId`, all 8 live-verified after re-verification of the 7 previously-removed IDs)
- [x] Completeness checked (FR-04, FR-06, FR-07, FR-08 all covered)
- [x] Style guide compliance
- [x] Code examples tested (n/a — no code examples, user-facing notes only)
- [x] Links validated (n/a — no hyperlinks embedded; README referenced by name)
- [x] Appropriate for target audience (non-technical end user)

### Maintenance Notes
Owner: whoever maintains `purchaseUnits.ts` / the README's affiliate-status section. Re-verify the ingredient count and the affiliate-approval sentence on every release that touches `purchaseUnits.ts` or the README's Walmart section — both are point-in-time facts that will drift. Any new `walmartItemId` must be confirmed by actually opening the product page in a browser before it's recorded — not inferred from naming or "high confidence."

Lesson worth keeping visible: the 7 IDs pulled in the prior round were AI-generated and recorded as if verified without ever loading the product page. They were only caught by a live-browser spot-check during UAT, then properly re-verified the same way before being restored. AI-generated `walmartItemId` values must always go through a live-browser check before shipping — "high confidence" or plausible naming is not verification.

### Follow-Up
- Update the "8 ingredients" figure in a future release note once more `walmartItemId` values are hand-verified in a live browser and added to `PURCHASE_UNITS`.
- Once Impact Radius affiliate approval is confirmed (or explicitly denied), update this note's honest-framing section and the README together.
- No other docs need updating for this release.
