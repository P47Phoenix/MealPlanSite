## UX Design: Walmart Cart Integration for the Grocery List
## Role: UX Designer
## Task: user-flow

### User Context

Target user: meal planner shopping online (PRD Section 4, primary persona). They've selected meals, reviewed the computed grocery list in `GroceryListView.tsx`, and want to buy the resulting ingredients at Walmart without retyping each one. Goal: get from "my grocery list" to "items sitting in a real Walmart cart" (or, failing that, a working manual search) in as few clicks as possible, with zero silent dead ends (FR-06, FR-08, NFR-07).

Four scenarios cover the full state space of the grocery-list panel:

1. **Primary flow** — list has M≥1 items, N≥1 are curated (`walmartItemId` present). Button renders.
2. **Fallback flow** — a specific item is uncurated or its curated ID is stale/delisted. Per-item Search link is the recovery path.
3. **Zero-coverage flow** — M≥1 items, 0 curated. Button absent; Search links still present on every line.
4. **Empty-list flow** — M=0. Nothing renders (no button, no coverage text, no lines to carry Search links).

Plus the popup-blocked edge case, which cuts across the primary flow (NFR-07).

---

### Flow / Structure

#### Flow 1 — Primary: "Add all to Walmart cart" (curated items present)

Entry point: user is already on the grocery list panel (`GroceryListView.tsx`) after selecting meals for the week — this is a mid-app state, not a fresh page load; no external entry points apply (no email link, no deep link, no search-engine landing — this is an authenticated in-app panel with no shareable URL to this exact state per PRD Section 8 out-of-scope).

```
(start) User has reviewed grocery list, ≥1 item is curated
  1. Panel header renders "Add all to Walmart cart" button
     next to existing "Copy link"/"Copy list" buttons (FR-04)
     -- button carries muted coverage text "N of M items"
  2. User reads "N of M items" -- decision: trust partial coverage?
     2a. [Trusts it] -> continue to step 3
     2b. [Wants full list instead] -> uses per-item Search links
         for the M-N uncurated lines (rejoins at Flow 2)
  3. User clicks "Add all to Walmart cart"
  4. Browser opens buildCartUrl(items) in a new tab
     (target="_blank" rel="noopener noreferrer")
     -- decision: did the popup open?
     4a. [Popup opened] -> 5. New tab lands on affil.walmart.com
         cart page with N curated items pre-added at computed
         quantities (verified via spike, 2026-08-29)
     4b. [Popup blocked] -> see "Popup-Blocked Edge Case" below
  5. (end, success) User is on Walmart's cart page in a new tab,
     original MealPlanSite tab/state untouched and still usable
```

Coverage-count definition (single source of truth, per `component-specs.md` section 2): **N** = count of grocery-list line items that qualify for `buildCartUrl` -- a defined `walmartItemId` AND a resolved quantity that passes FR-02's validity gate (not 0/negative/NaN/null/undefined); an item with a `walmartItemId` but an invalid quantity is not counted, because `buildCartUrl` itself skips it. **M** = total count of grocery-list line items rendered in the list, curated or not. `curatedCount` (N) must be derived from the same qualification logic `buildCartUrl` uses, never a separate/independent check.

The cart button's accessible name/description bundle reads "Add all to Walmart cart (opens in new tab), N of M items" via `aria-label` ("... (opens in new tab)") plus `aria-describedby` pointing at the coverage `<span>`'s `id` -- so the count is announced together with the action regardless of navigation mode (linear or rotor/table).

Notes:
- Step 1's coverage text is not decorative — it's the single mechanism by which the user learns the click will *not* add everything (Goal table, "Honest partial coverage"). It must render before the click, not as a post-click surprise.
- Step 4→5 hands off entirely to Walmart; MealPlanSite has no visibility past the new-tab open (PRD Out of Scope: no checkout, no price display in-app).
- Exit/state preservation: opening a new tab does not navigate away from MealPlanSite — the grocery list panel remains exactly as it was, so the user can immediately continue to Flow 2 for the uncurated remainder without losing place.

#### Popup-Blocked Edge Case (NFR-07 — cuts across Flow 1, step 4)

This is the one edge case the PRD calls out by number, so it gets its own path rather than being folded into "error flows" generically.

```
4b. Popup blocked (browser or extension suppresses the auto-opened
    new tab for this <a target="_blank"> navigation)
  E1. Click event fires -- this is a direct user gesture on a real
      `<a href={cartUrl}>`, not a script-initiated window.open()
  E2. At most, the browser suppresses auto-opening the new tab.
      The `<a>` element itself never disappears and never depended
      on JS detecting success/failure -- it was visible and
      clickable before the click and remains so after
  E3. User clicks the same link again (normal left-click, or right-
      click "open in new tab", or keyboard Enter while focused) ->
      same outcome as Flow 1 step 5 (lands on Walmart cart page)
  (end, recovered) User reaches the cart; a popup blocker causes at
      most one extra click on the same element, never a dead end
      and never a second element to find
```

Implementation contract (definitive, per `component-specs.md` section 1 and section 4): the "Add all to Walmart cart" control IS a real `<a href={cartUrl} target="_blank" rel="noopener noreferrer">`, styled as a button, always present whenever `buildCartUrl(...)` returns a defined string. There is no `<button onClick={() => window.open(...)}>` implementation path and no separate fallback element (`.walmart-cart-fallback-link` or similar) built alongside it. NFR-07 is satisfied by construction with this single element: a native anchor's activation is a direct user gesture, which browsers do not block the way they can block a script-initiated `window.open()` call. "Popup blocked" for this control degrades at most to "no new tab auto-opened" — the link remains visible, focusable, and independently clickable/right-clickable/keyboard-activatable at all times, satisfying the "not a silent no-op" requirement without a second DOM shape.

#### Flow 2 — Fallback: per-item "Search" link (uncurated or stale item)

Entry points (two distinct triggers, same downstream path):
- **Uncurated trigger:** user looks at a specific grocery-list line that has no `walmartItemId` (item not in the curated 8+ staples).
- **Stale trigger:** user already tried Flow 1, landed on Walmart's cart page, and found one curated item missing or wrong (ID delisted/stale at Walmart's end — PRD FR-06 AC, "walmartItemId that is stale or delisted").

```
(start) User is looking at one grocery-list line, curated or not
  1. Line renders a small muted "Search" link (FR-06) --
     present unconditionally, regardless of curation state
  2. User clicks "Search" on that line
  3. Browser opens buildSearchUrl(item.name) in a new tab
     -- https://www.walmart.com/search?q=<encoded name>
  4. New tab shows Walmart search results for that item name
  5. (end) User manually selects the correct product and adds
     it to cart themselves, on Walmart's site
```

Notes:
- Each Search link's accessible name is `aria-label={\`Search for ${item.name} (opens in new tab)\`}` — unique per item and announces the new-tab behavior, while the visible text stays the compact literal "Search" (component-specs.md section 3).
- This flow has no decision points and no failure branch of its own — it's the failure branch *for* Flow 1. `buildSearchUrl` requires no curated data and cannot itself return undefined (FR-03 AC), so it cannot dead-end.
- Because this link exists on every line regardless of curation, it also serves as a quiet consistency cue: the user learns early that every item, not just curated ones, has *some* one-click path to Walmart.

#### Flow 3 — Zero-coverage: list has items, none curated

```
(start) Grocery list has M≥1 items, 0 have walmartItemId
  1. buildCartUrl(items) returns undefined (FR-02 AC: zero
     curated items -> undefined)
  2. Panel header renders WITHOUT "Add all to Walmart cart"
     button and WITHOUT any "N of M items" text -- not a
     disabled/greyed button, not shown at all (FR-04 AC)
  3. Each of the M lines still renders its per-item "Search"
     link (FR-06 is unconditional -- rejoins Flow 2 per line)
  (end) User completes the entire list via M individual Search
     clicks; slower than Flow 1 but never blocked
```

Notes:
- The absence of the button *is* the honest signal here — no coverage text is shown because there is nothing accurate to report beyond "0 of M," and the PRD explicitly rejects showing a disabled button or a 0-count line (FR-04 AC distinguishes "not rendered at all" from "shown disabled").
- This is the state most likely for a brand-new user before `PURCHASE_UNITS` curation catches up to their meal choices — Search links carry the entire experience here, so their affordance (discoverability, tap target size) matters as much in this flow as the primary button does in Flow 1.

#### Flow 4 — Empty-list: M=0

```
(start) Grocery list panel renders with zero computed items
  1. buildCartUrl([]) receives an empty array -> undefined
     (same code path as Flow 3, not a special case)
  2. No "Add all to Walmart cart" button
  3. No "N of M items" text (not even "0 of 0 items")
  4. No grocery-list lines exist, so no per-item Search links
     have anything to attach to
  (end) Panel shows whatever the app's pre-existing empty-list
     state is (out of scope for this PRD -- unchanged by this
     feature); Walmart integration is entirely invisible
```

Notes:
- FR-04's AC is explicit that this collapses to the *same visual treatment* as Flow 3 (button absent), not a distinct "0 of 0" message — so from a pure UI-state perspective, Flow 4 is a subset of Flow 3 where the per-item-lines layer additionally has nothing to render. Documented separately here only because the PRD calls it out as a distinct AC case and because "no lines exist" vs. "lines exist but none curated" are reached by different upstream app states (no meals selected yet, vs. meals selected but nothing in `PURCHASE_UNITS`).

---

### Wireframes

Text-based layout of the grocery-list panel header across the four states (existing "Copy link"/"Copy list" buttons shown for placement context only — out of scope to redesign):

```
State: Primary (curated items present)
+--------------------------------------------------------------+
| Grocery List                          [Copy link] [Copy list]|
|                              [Add all to Walmart cart] 8 of 14|
|                                          items                |
+--------------------------------------------------------------+
| [ ] Chicken breast, 2 lb ................ Search             |
| [ ] Fresh basil, 1 bunch ................ Search             |
| ...                                                            |
+--------------------------------------------------------------+

State: Popup-blocked (same DOM as Primary state -- no separate
       markup renders; the "Add all to Walmart cart" <a> IS the
       fallback, always present, whether or not a popup blocker
       suppressed the auto-opened tab)
+--------------------------------------------------------------+
|                              [Add all to Walmart cart] 8 of 14|
|                                          items                |
+--------------------------------------------------------------+

State: Zero-coverage (items exist, none curated)
+--------------------------------------------------------------+
| Grocery List                          [Copy link] [Copy list]|
+--------------------------------------------------------------+
| [ ] Star fruit, 3 ea ..................... Search             |
| [ ] Dragonfruit, 1 ea ..................... Search             |
+--------------------------------------------------------------+

State: Empty list (M=0)
+--------------------------------------------------------------+
| Grocery List                          [Copy link] [Copy list]|
+--------------------------------------------------------------+
|                     (existing empty-state message, unchanged) |
+--------------------------------------------------------------+
```

---

### Error and Edge Cases

| Case | Trigger | Handling |
|---|---|---|
| Popup blocked | Browser/extension suppresses the auto-opened new tab for the `<a target="_blank">` click | NFR-07 resolved by construction: the control is a real `<a href={cartUrl}>`, always present, not a `<button onClick={window.open}>`. A blocked popup at most suppresses auto-open; the same link remains visible and clickable for a repeat click, right-click, or keyboard Enter. No separate fallback element exists or is needed. |
| Curated ID stale/delisted at Walmart | User lands on cart page, item missing or wrong | Per-item Search link (Flow 2) on the same grocery-list line is the unaffected recovery path — user never has to leave MealPlanSite to find it, it was already on the line. |
| Zero curated items, list non-empty | 0 of M items in `PURCHASE_UNITS` | Button and coverage text fully absent (not disabled). Search links carry the full flow. |
| Empty list, M=0 | No meals selected / nothing computed yet | Same absent-button treatment as zero-coverage; no lines exist to carry Search links either. Pre-existing empty-list UI (out of scope) is what the user actually sees. |
| Mixed list, quantity resolves invalid (0/negative/NaN/null) for a curated item | Upstream computation bug or genuinely zero-quantity line | Per FR-02, that item is silently skipped from `buildCartUrl` output — same as never having a `walmartItemId`. From this UX's perspective it's indistinguishable from an uncurated item: its Search link is still present and is the user's path for that line. Resolved: coverage count "N of M" is defined so N never counts this item (see coverage-count definition below), so the count cannot read as curated when it isn't actually included in the cart URL. |
| User double-clicks "Add all to Walmart cart" | Fast repeat click | Not a distinct app state to design for — `target="_blank"`/`<a>` behavior opens a second tab per click; acceptable, no special handling needed (out of scope to prevent). |
| Cart link opens but Walmart rejects the traffic (affiliate approval pending, FR-08/OQ-1/OQ-5) | Site not yet Impact Radius-approved | Indistinguishable from any other Walmart-side failure to this flow — the always-present per-item Search link (FR-06) is the designated fallback per FR-08's AC. No MealPlanSite-side detection is possible; UX does not attempt to intercept or warn pre-click, since no reliable signal exists. |

---

### Design Rationale

| Decision | Rationale | Alternatives Considered |
|---|---|---|
| Button absent (not disabled) at zero coverage | FR-04 AC explicitly rules out a disabled/greyed button; an absent button reads as "this feature doesn't apply here" rather than "something is broken," which is more honest given the count genuinely would be misleading (0 of M) | Disabled button with tooltip explaining "no curated items" — rejected per PRD AC and because it invites a click-then-explain interaction cost for zero payoff |
| Coverage text shown only alongside the button, never standalone | Ties the honesty claim ("N of M") directly to the action it qualifies; a standalone "0 of M curated" message with no button would need its own design language for a state the PRD treats as equivalent to "nothing to see here" | Always-visible coverage text even at 0-of-M, as a transparency/status signal — rejected: PRD FR-04 AC says no coverage text at all when the button doesn't render, keeping the two AC states genuinely identical rather than introducing an unspecified third look |
| Per-item Search link present unconditionally, including on curated lines | FR-06 requires it on every line so staleness (not just non-curation) has a fallback; putting it only on uncurated lines would strand a user whose curated ID silently died | Search link only where no `walmartItemId` exists — rejected, fails FR-06's stale-ID AC directly |
Cart action IS `<a href>` (definitive, not a recommendation) — no `<button onClick={window.open}>` path and no separate fallback element exist | Satisfies NFR-07 by construction — a real anchor is a browser-native visible, clickable element that IS the fallback, no separate blocked-popup detection/UI needed | `<button onClick={window.open}>` plus a conditionally-rendered fallback link — rejected: return-value detection for popup blocking is unreliable across browsers/extensions, and would add a second DOM element and an unresolved implementation branch for no benefit |

---

### Assumptions

- The grocery-list panel is a single always-visible section within one page (no separate route/URL for "list" vs. "empty" states) — flows are documented as UI states within one screen, not as page-to-page navigation.
- "New tab" behavior is desktop/standard-browser behavior; mobile browsers that reuse the same tab for `target="_blank"` are treated as equivalent from a UX standpoint (MealPlanSite state is preserved either way via normal back-navigation, not addressed further since PRD names no mobile-specific constraint).
- The existing "Copy link"/"Copy list" buttons and their visual styling are unchanged reference points, not redesigned as part of this flow (NFR-04: reuse `.copy-link-button` conventions).
- No loading/pending state is needed between click and new-tab-open — `buildCartUrl` is a synchronous pure function (NFR-03), so there is no network round-trip on the MealPlanSite side to show a spinner for.

### Research Recommendations

- Manual/exploratory popup-blocker check (per QA review, since no automated way reliably simulates a browser/extension popup blocker): install a known popup-blocking extension, click the cart link, and confirm it remains reachable and clickable — verifying NFR-07 is satisfied by the single always-present `<a>`, not testing for a separate fallback element.
- Quick comprehension check on "N of M items" phrasing with a real user unfamiliar with the feature — confirm they correctly read it as "these N will one-click add, the rest need manual search," not as an error or a limit.
- Screen-reader spot check confirming the cart button announces "Add all to Walmart cart (opens in new tab), N of M items" via the `aria-label` + `aria-describedby` bundle, and each Search link announces "Search for [item name] (opens in new tab)".

### Follow-Up

- Resolved, no longer open: the cart action is `<a href target="_blank">`, always present, per `component-specs.md` section 1 and section 4 — no `<button onClick={window.open}>` path and no separate NFR-07 fallback element exist.
- Confirm with Product Owner (per PRD open question OQ-1/OQ-5) whether any pre-click messaging about affiliate-approval status is wanted, or whether the current PRD position (no detection possible, ship regardless) is final — this flow set assumes no pre-click warning is shown, consistent with FR-08.
- Hand this flow set to UI Designer for token-level styling of the new "Add all to Walmart cart" button and per-item Search link, reusing `.copy-link-button` and existing muted-text tokens per NFR-04.
- Usability test the zero-coverage state with a new user whose meal selections happen to miss all 8+ curated staples, to confirm the all-Search-links experience doesn't read as broken.
