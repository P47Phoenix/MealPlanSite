## Documentation: User Guide — Buying Your Grocery List at Walmart
## Role: Technical Writer
## Task: user-guide

### Audience
MealPlanSite end users who have already selected meals and are viewing the generated grocery list. No developer or technical knowledge assumed; no account or login involved.

### Document

# Buying Your Grocery List at Walmart

Once you've selected your meals and MealPlanSite has built your grocery list, you have two ways to move items over to Walmart: one button that adds several items at once, and a search link on every item.

## Add all to Walmart cart

1. Open your grocery list panel (after selecting your meals, this is the list of ingredients with quantities).
2. Look near the top of the panel, next to the "Copy list" button, for **"Add all to Walmart cart."**
   - Next to the button you'll see a count like "8 of 14 items." That tells you how many of your list's items are covered by this button — not every ingredient is matched yet.
   - If none of your items are matched, the button won't appear at all — you'll only see the per-item Search links (below).
3. Click **"Add all to Walmart cart."** A new browser tab opens, taking you to Walmart with those matched items already placed in your cart at the correct quantities.
4. If your browser or an extension blocks the new tab from opening, look for a plain link on the page with the same destination — click that instead. The action never leaves you with nothing to click.
5. From there, you're on Walmart's site. Anything about checkout, pricing, delivery vs. pickup, or your Walmart account is handled entirely by Walmart — MealPlanSite hands off at this point.

**What's not included:** any ingredient not in the small, hand-verified list MealPlanSite currently supports won't be added by this button. Right now that list is 8 ingredients: garlic, onion, chicken breast, eggs, olive oil, canned tuna, brown rice, and greek yogurt. Those items are still on your grocery list, and each one has its own Search link — see below.

**Note:** an earlier version of this guide also said 8 ingredients were supported, then a UAT check found 7 of those 8 had never actually been verified against a real product page and pulled them. All 7 have since been re-checked for real — each product page opened and confirmed to match its ingredient — and are back in the supported list alongside eggs, which was verified earlier. All 8 are now genuinely confirmed.

## Search links (works for every item)

Every single line in your grocery list has a small **"Search"** link next to it, whether or not that item made it into the cart button above.

1. Find the ingredient in your grocery list.
2. Click its **Search** link.
3. A new tab opens showing Walmart's search results for that ingredient's name. Pick the product you want and add it to your cart yourself.

Use this for:
- Anything not covered by the "Add all" button.
- An item that was in the cart button, but its Walmart listing turned out to be discontinued or wrong — Search always gives you a manual way to find it instead.

## Good to know

- Coverage is limited today by design — MealPlanSite only puts an item behind the one-click button after hand-checking it against a real Walmart product page, meaning someone actually opened the page in a browser and confirmed it's the right product. More ingredients will be added over time, once verified this way, so the "N of M items" count will grow release over release.
- Both the cart button and every Search link open in a new tab, so you never lose your MealPlanSite grocery list — it stays open in your original tab.
- Nothing you do with these links requires signing in to MealPlanSite or sharing any account information — they're just links to Walmart's own site.

### Content Structure
1. Add all to Walmart cart — numbered steps
2. Search links — numbered steps
3. Good to know — general tips and boundaries

### Review Checklist
- [x] Accuracy verified (matches FR-04, FR-06, FR-07/FR-08 behavior and NFR-07 fallback-link requirement)
- [x] Completeness checked (both UI elements described end to end, including edge cases: no matches, popup blocked)
- [x] Style guide compliance
- [x] Code examples tested (n/a — no code, UI walkthrough only)
- [x] Links validated (n/a — no embedded hyperlinks)
- [x] Appropriate for target audience (plain, non-technical language; screenshots avoided per guardrail)

### Maintenance Notes
Owner: whoever maintains `GroceryListView.tsx` / the grocery list UI. Re-check this guide's steps whenever the button placement, label text, or coverage-count format changes in the UI; no fixed review cadence set otherwise.

Lesson worth keeping visible: the prior "7 of 8" pull happened because those `walmartItemId` values were AI-generated and recorded as if verified without ever loading the product page — caught by a live-browser spot-check, then properly re-verified the same way before being restored. Any AI-generated `walmartItemId` needs a real live-browser check before it ships, not just "high confidence" naming.

### Follow-Up
- Consider a short screenshot or GIF once the UI is stable, per the "screenshots are a last resort" guardrail — only add if text alone proves insufficient for real users.
- Revisit "Good to know" once affiliate approval status is confirmed, if that changes user-visible behavior.
- Update the "8 of 14 items" example as more `walmartItemId` values are hand-verified in a live browser and added to `PURCHASE_UNITS`.
