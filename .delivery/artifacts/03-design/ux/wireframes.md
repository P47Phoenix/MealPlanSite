## UX Design: Walmart Cart Integration -- GroceryListView.tsx Panel
## Role: UX Designer
## Task: wireframe

### User Context

Target user: meal planner reviewing the computed grocery list in `GroceryListView.tsx` after selecting meal cards, wanting a one-click path to a real Walmart cart, with an honest fallback when items are not curated (FR-04, FR-06, NFR-04, NFR-07 per `.delivery/artifacts/02-refine/po/prd.md`; scenarios per `.delivery/artifacts/03-design/ux/user-flows.md`).

These wireframes trace the actual DOM structure of `src/components/GroceryListView.tsx` (`.grocery-panel` > `.grocery-panel__header` > `.grocery-panel__controls` > totals `<section>` > items `<section>` with per-section `<ul><li>` lines) -- not an invented layout. New elements are marked `[NEW]`; everything else reflects current code (lines 108-217 of that file).

---

### Wireframes

#### State A -- Primary: panel header, coverage present (N < M curated)

```
+----------------------------------------------------------------------+
| .grocery-panel  role="dialog" aria-labelledby="grocery-heading"      |
|                                                                        |
|  .grocery-panel__header                                               |
|  +------------------------------------------------------------------+ |
|  | Grocery list                                                     | |
|  | (h2#grocery-heading)                                             | |
|  |                                                                   | |
|  | [Copy link]  Link copied!(aria-live)                              | |
|  | [Copy list as text]  List copied!(aria-live)                      | |
|  | [NEW] <a class="copy-link-button walmart-cart-button"             | |
|  |        href={cartUrl} target="_blank" rel="noopener noreferrer"   | |
|  |        aria-label="Add all to Walmart cart (opens in new tab)"    | |
|  |        aria-describedby="walmart-coverage-count">                 | |
|  |        Add all to Walmart cart</a>                                | |
|  | [NEW] <span id="walmart-coverage-count"                           | |
|  |        class="target-note">8 of 14 items</span>                   | |
|  |                                                    [X] (close)    | |
|  +------------------------------------------------------------------+ |
|                                                                        |
|  .grocery-panel__controls                                             |
|  +------------------------------------------------------------------+ |
|  | Display: [Purchase quantities v]   [x] Show source recipes       | |
|  +------------------------------------------------------------------+ |
|                                                                        |
|  <section aria-labelledby="totals-heading">                          |
|  +------------------------------------------------------------------+ |
|  | Running totals for 5 selected card(s)                            | |
|  | ~ Calories: 2340 kcal                                             | |
|  | ~ Protein: 118.4 g (target reference: 123 g)                      | |
|  | ~ Sodium: 1820 mg (target reference: under 2000 mg)                | |
|  | ~ Saturated fat: 11.2 g (target reference: 13 g)                  | |
|  +------------------------------------------------------------------+ |
|                                                                        |
|  <section aria-labelledby="items-heading">                            |
|  +------------------------------------------------------------------+ |
|  | Items by section                                                 | |
|  |                                                                   | |
|  | Produce                                                          | |
|  |  * 2 lb Chicken breast .................. [NEW] Search           | |
|  |  * 1 bunch Fresh basil .................. [NEW] Search           | |
|  |    (recipe total: 2.5 lb) -- shown when displayMode=purchase+raw | |
|  |    - Source recipe A -- shown when showSourceRecipes checked     | |
|  |    - Source recipe B                                             | |
|  |  * 3 ea Roma tomatoes .................... [NEW] Search           | |
|  |                                                                   | |
|  | Protein                                                          | |
|  |  * 1 dozen Eggs ........................... [NEW] Search           | |
|  |  ...                                                             | |
|  +------------------------------------------------------------------+ |
+----------------------------------------------------------------------+
```

Key: `~` text content, `*` list item bullet, `[X]` button/link, `v` dropdown, `[x]` checked checkbox, `[NEW]` new element added by this feature (everything unmarked is existing code, shown for placement context per NFR-04 -- reuse, do not redesign).

Coverage-count definition (single source of truth, per `component-specs.md` section 2): **N** = count of grocery-list line items qualifying for `buildCartUrl` (defined `walmartItemId` AND a resolved quantity passing FR-02's validity gate -- not 0/negative/NaN/null/undefined); an item with a `walmartItemId` but an invalid quantity is not counted, since `buildCartUrl` itself skips it. **M** = total count of grocery-list line items rendered, curated or not. `curatedCount` (N) must be derived from the same qualification logic `buildCartUrl` uses, never a parallel/independent check.

---

#### State B -- Popup-blocked (NFR-07) -- same DOM as State A, no separate element

**Superseded / rejected alternative removed.** An earlier draft of this wireframe specified a second, conditionally-adjacent fallback line (`Trouble opening the cart? Open Walmart cart`). Per `component-specs.md` sections 1 and 4 (definitive, not conditional), the "Add all to Walmart cart" control IS the real `<a href={cartUrl} target="_blank" rel="noopener noreferrer">` from State A -- there is no `<button onClick={window.open}>` implementation path and no `.walmart-cart-fallback-link` element anywhere in this spec. A popup-blocked click renders **identically** to State A: the same single anchor, unchanged.

```
+----------------------------------------------------------------------+
|  .grocery-panel__header                                               |
|  +------------------------------------------------------------------+ |
|  | Grocery list                                                     | |
|  | [Copy link]  [Copy list as text]                                  | |
|  | [NEW] <a class="copy-link-button walmart-cart-button"             | |
|  |        href={cartUrl} target="_blank" rel="noopener noreferrer"   | |
|  |        aria-label="Add all to Walmart cart (opens in new tab)"    | |
|  |        aria-describedby="walmart-coverage-count">                 | |
|  |        Add all to Walmart cart</a>                                | |
|  | [NEW] <span id="walmart-coverage-count"                           | |
|  |        class="target-note">8 of 14 items</span>                   | |
|  |                                                    [X] (close)    | |
|  +------------------------------------------------------------------+ |
+----------------------------------------------------------------------+
```

Annotation:
1. **What it is**: no new markup -- this is State A's anchor, re-rendered identically. A blocked popup does not change the DOM.
2. **Behavior on interaction**: the anchor's activation is a direct user gesture (left-click / Enter on a focused link), which browsers do not block the way they can block a script-initiated `window.open()`. At most, the auto-opened tab is suppressed; the link stays visible, focusable, and clickable (including right-click "open in new tab") for a repeat attempt.
3. **Why no separate fallback line is needed**: the anchor itself, always present whenever `buildCartUrl(...)` returns a defined string, satisfies "not a silent no-op" by construction -- there is no JS-side success/failure signal to detect and no second element whose discoverability could be in question.
4. **Conditional visibility**: identical to State A -- present only when `buildCartUrl` returns a defined string; absent in State C/D along with the button, since there is no `cartUrl` to render.

---

#### State C -- Zero-coverage (items exist, 0 curated)

```
+----------------------------------------------------------------------+
|  .grocery-panel__header                                               |
|  +------------------------------------------------------------------+ |
|  | Grocery list                                                     | |
|  | [Copy link]  [Copy list as text]                                  | |
|  |   (no "Add all to Walmart cart" button -- not rendered)           | |
|  |   (no "N of M items" text -- not rendered, not "0 of M")          | |
|  |                                                    [X] (close)    | |
|  +------------------------------------------------------------------+ |
|                                                                        |
|  <section aria-labelledby="items-heading">                            |
|  +------------------------------------------------------------------+ |
|  | Items by section                                                 | |
|  | Produce                                                          | |
|  |  * 3 ea Star fruit ........................ [NEW] Search           | |
|  |  * 1 ea Dragonfruit ....................... [NEW] Search           | |
|  |  ...every line retains its Search link, unconditionally...        | |
|  +------------------------------------------------------------------+ |
+----------------------------------------------------------------------+
```

Annotation: absence of the button is the honest signal (FR-04 AC) -- not a disabled/greyed button, not a "0 of M" line. Every grocery-list `<li>` still carries its per-item `[NEW] Search` link (FR-06 is unconditional, independent of `walmartItemId` presence), so the Search-links layer is unchanged from State A/B; only the header-level button+coverage-text pair disappears.

---

#### State D -- Empty list (M=0, existing pre-feature empty state, unchanged)

```
+----------------------------------------------------------------------+
|  .grocery-panel__header                                               |
|  +------------------------------------------------------------------+ |
|  | Grocery list                                                     | |
|  | [Copy link]  [Copy list as text]                                  | |
|  |   (no cart button, no coverage text -- same as State C)           | |
|  |                                                    [X] (close)    | |
|  +------------------------------------------------------------------+ |
|                                                                        |
|  ~ No cards selected yet. Select meal cards from the browse view      |
|    to build a grocery list.  (existing text, line 152, unchanged)     |
+----------------------------------------------------------------------+
```

Annotation: no `.grocery-panel__controls`, no totals section, no items section render at all when `selectedCards.length === 0` (existing conditional, line 151) -- so no grocery-list lines exist to carry Search links either. Out of scope to redesign per user-flows.md.

---

### Per-Item Search Link -- Detail Annotation (applies to every line, every state)

```
  * 2 lb Chicken breast breast, recipe total 2.5 lb ......... Search
    ^ existing item text (unchanged, lines 184-198)            ^
                                                     [NEW] muted, small,
                                                     underlined link,
                                                     reuses .target-note
                                                     sizing per NFR-04
```

1. **What it is**: small muted "Search" link appended to each `<li>` in the items list, one per grocery item, in every section.
2. **Behavior on interaction**: opens `buildSearchUrl(item.name)` (`https://www.walmart.com/search?q=<encoded name>`) in a new tab (`target="_blank" rel="noopener noreferrer"`); does not affect the panel's own state.
3. **Content requirement**: label is literally "Search" (not "Search on Walmart" or icon-only) to stay compact on a dense multi-item list; visible link text per accessibility convention (wireframing reference: label icons/links with real text, not icon-only). Accessible name is `aria-label={\`Search for ${item.name} (opens in new tab)\`}` -- unique per item and announces new-tab behavior, per component-specs.md section 3.
4. **Conditional visibility**: none -- renders on every line unconditionally, curated or not (FR-06), including lines with `showSourceRecipes` sub-lists expanded underneath (link stays on the parent `<li>`, not duplicated per source recipe).
5. **Error state**: `buildSearchUrl` cannot return undefined for a non-empty item name (FR-03 AC), so this link has no failure/disabled variant to design.

---

### Error and Edge Cases

| Case | Wireframe state affected | Handling |
|---|---|---|
| Popup blocked on cart click | State B | No separate element: the State A anchor is always present and remains clickable regardless of whether the auto-opened tab was suppressed (NFR-07 resolved by construction) |
| Zero curated items, list non-empty | State C | Button + coverage text fully absent; Search links unaffected |
| Empty list | State D | Same absent-button treatment as State C; no lines exist at all |
| Curated ID stale/delisted at Walmart | Any line, any state | Same per-item Search link already on that line is the recovery path -- no separate wireframe state, it's the existing State A/C line-level element |
| `showSourceRecipes` expanded + Search link together | State A | Search link stays on the parent item `<li>`, positioned before the nested source-recipe `<ul>` so it remains a single per-item tap target regardless of expansion state |

---

### Design Rationale

| Decision | Rationale | Alternatives Considered |
|----------|-----------|--------------------------|
| Cart button placed inside existing `.grocery-panel__header`, alongside "Copy link"/"Copy list", reusing `.copy-link-button` class | NFR-04: no new visual language; header is already the button row in the current DOM | New dedicated toolbar row above/below header -- rejected, adds layout surface not required by any FR |
| Coverage text ("N of M items") rendered as a `<span class="target-note">` next to the button, not inside the button label | Matches existing `.target-note` convention used elsewhere in this file (lines 163, 167, 171, 190) for muted secondary text; keeps button label itself static/predictable | Baking the count into the button's own text ("Add 8 of 14 items to cart") -- rejected, makes the clickable label length vary per render and duplicates the "honest partial coverage" signal awkwardly inside an actionable control |
| Search link rendered inline at end of each `<li>`, not as a separate icon column | Existing item lines are plain text runs (lines 184-198), no table/grid structure to hang a column on; inline keeps the change minimal | Fixed-width icon-only search button per line -- rejected, fails "label icons" wireframing convention and adds a new visual pattern NFR-04 discourages |
| Cart button IS the popup-blocked fallback (State B) -- no separate `.walmart-cart-fallback-link` element | Resolves NFR-07 definitively: a native anchor's click is a direct user gesture, not a script-initiated `window.open()`, so it cannot be silently blocked; one always-present element satisfies the requirement rather than two mutually exclusive DOM shapes contingent on an unmade engineering decision | `<button onClick={window.open}>` plus a conditionally-rendered fallback link/toast/banner -- rejected as strictly worse: adds a second DOM element, an unresolved implementation branch, and a JS-side popup-block detection dependency that isn't reliably possible |

### Assumptions

- Panel width is unconstrained/desktop-first in this wireframe; no distinct mobile layout is specified since `user-flows.md` treats mobile `target="_blank"` behavior as UX-equivalent and the PRD names no mobile-specific constraint.
- `.copy-link-button` and `.target-note` CSS classes continue to exist and are reused verbatim for the new button and coverage text (NFR-04) -- no new class introduced beyond an optional modifier (e.g., `walmart-cart-button`) for any cart-specific spacing/icon needs.
- The cart control is definitively `<a href target="_blank">` in every state, including State B (popup-blocked) -- this is no longer an open engineering choice; component-specs.md sections 1 and 4 resolve it, and no `<button onClick={window.open}>` path or separate fallback element exists in this spec.

### Research Recommendations

- Confirm the "Search" link label reads clearly at the compact size implied by dense multi-item lists (10+ items in one section) -- verify it doesn't crowd against long item names/quantities on narrow viewports.
- Usability check that the coverage text ("N of M items") next to the button, rather than inside it, is still read by users as belonging to the button before they click -- confirm `aria-describedby` association reads correctly under screen readers, not skipped as unrelated muted text.

### Follow-Up

- Hand this wireframe set to UI Designer for token-level styling confirmation (exact spacing/typography reuse from `.copy-link-button` and `.target-note` in `src/styles.css`), per NFR-04.
- Resolved, no longer open: the cart action is `<a href target="_blank">` in every state, per component-specs.md sections 1 and 4 -- State B is not a separate rendered fallback element, it is State A's anchor unchanged.
- Validate State C/D visual identity (button fully absent) against an actual build once `buildCartUrl` returns `undefined` for a zero-coverage list, confirming no residual whitespace/layout gap is left where the button would have been.
- Accessibility testing needed: keyboard-only pass (Tab order, focus-visible ring, Enter activation) and a screen-reader spot check confirming the cart button announces "Add all to Walmart cart (opens in new tab), N of M items" and each Search link announces "Search for [item name] (opens in new tab)".
