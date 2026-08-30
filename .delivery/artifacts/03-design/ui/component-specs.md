## UI Design: Walmart Cart Integration -- Component Specs
## Role: UI Designer
## Task: component-spec

Specs trace `.delivery/artifacts/03-design/ux/wireframes.md` (States A-D) and PRD FR-04, FR-06, NFR-04, NFR-07. Reuses `src/styles.css` tokens and the existing `.copy-link-button` / `.copy-confirmation` / `.grocery-panel__header` classes verbatim -- no new visual language introduced (NFR-04).

---

### Design Specification

#### 1. "Add all to Walmart cart" button

**Implementation contract (resolves QA Gap 2 and Architect Warning 2 -- definitive, not conditional):** the "Add all to Walmart cart" trigger IS a real `<a href={cartUrl} target="_blank" rel="noopener noreferrer">` element, styled as a button via `.copy-link-button`. It is always present in the DOM whenever `buildCartUrl(...)` returns a defined string -- never conditionally rendered based on JS-side popup-block detection, since such detection is not reliably possible. There is no separate `<button onClick={() => window.open(...)}>` implementation path and no separate fallback-link element to build alongside it: the anchor itself, always visible and always a normal clickable/keyboard-activatable link, IS the fallback. A blocked popup degrades to "the browser didn't auto-open a new tab for this click" -- the link remains functional and visible either way, satisfying NFR-07 by construction with a single DOM element, not two mutually exclusive shapes.

```html
<a
  class="copy-link-button walmart-cart-button"
  href={cartUrl}
  target="_blank"
  rel="noopener noreferrer"
  aria-label="Add all to Walmart cart (opens in new tab)"
  aria-describedby="walmart-coverage-count"
>
  Add all to Walmart cart
</a>
```

- Reuses `.copy-link-button` verbatim (border, radius, padding, font-size, cursor -- matches "Copy link"/"Copy list as text" siblings in `.grocery-panel__header`).
- `.walmart-cart-button` is an additive modifier class, empty by default. Reserved only for a cart-specific icon or spacing tweak if design review later asks for one; do not add visual properties to it speculatively.
- Rendered only when `buildCartUrl(...)` returns a defined string (FR-04). Not rendered at all for zero-coverage (State C) or empty-list (State D) -- absence is the signal, never a disabled/greyed variant.
- `aria-label` includes the visible text plus "(opens in new tab)" (resolves a11y Warning "new-tab announcement"); this replaces the plain visible text as the accessible name, so no separate visually-hidden span is needed.
- `aria-describedby="walmart-coverage-count"` points at the coverage `<span>`'s `id` (see section 2), so the accessible name/description bundle reads "Add all to Walmart cart (opens in new tab), 8 of 14 items" regardless of navigation mode (resolves a11y Warning "coverage count not associated with the button").

#### 2. Coverage-count text

**Single source of truth for "N of M" (resolves QA Gap 1 and Architect Warning 1):**

- **N (numerator)** = count of grocery-list line items whose `PURCHASE_UNITS` entry has a defined `walmartItemId` **and** would actually be included in `buildCartUrl`'s output -- i.e., N counts only items that pass the exact same qualification check `buildCartUrl` applies internally (defined `walmartItemId` AND a resolved quantity that survives FR-02's validity gate: not 0/negative/NaN/null/undefined). An item with a `walmartItemId` but an invalid quantity is **not** counted in N, because `buildCartUrl` itself skips it.
- **M (denominator)** = total count of grocery-list line items rendered in the list, regardless of curation status (every `<li>` in every section, curated or not).
- **Implementation contract:** `curatedCount` (N) MUST be derived from the same qualification logic `buildCartUrl` uses -- either by having the component call a shared/exported helper (e.g. `getQualifyingItems(items)`) that both `buildCartUrl` and the coverage-count computation call, or by counting the items array `buildCartUrl` actually consumed to build its URL. The component must never reimplement a parallel/independent check (e.g. "has `walmartItemId`" alone) that could drift out of sync with `buildCartUrl`'s real behavior. This is the definition test cases and implementation both derive from -- there is no second, competing reading.

```html
<span id="walmart-coverage-count" class="target-note walmart-coverage-count">
  {curatedCount} of {totalCount} items
</span>
```

- Reuses `.target-note` verbatim (muted color, 0.8rem) -- matches the existing convention for secondary text elsewhere in `GroceryListView.tsx`.
- `.walmart-coverage-count` is an additive hook for test-selector/targeting purposes only; carries no styling of its own.
- Carries a stable `id` (`walmart-coverage-count`) so the cart button/link can reference it via `aria-describedby` (see Accessibility section -- resolves a11y Warning "coverage count not associated with the button").
- Positioned immediately after the cart button inside `.grocery-panel__header`, not inside the button's own label (per wireframes.md Design Rationale -- keeps button label static/predictable). Programmatic association with the button is via `aria-describedby`, not DOM adjacency alone.
- Renders only alongside the button (same conditional -- FR-04). Never renders "0 of M" or "0 of 0."

#### 3. Per-item "Search" link

```html
<a
  class="grocery-item__search-link"
  href={buildSearchUrl(item.name)}
  target="_blank"
  rel="noopener noreferrer"
  aria-label={`Search for ${item.name} (opens in new tab)`}
>
  Search
</a>
```

- `aria-label` gives each link a unique accessible name (item name included) plus the new-tab announcement, while the visible text stays the compact literal "Search" (resolves a11y Warnings "new-tab announcement" and Suggestion "Search link accessible name uniqueness" for rotor/link-list navigation).

- New class, since no existing per-line-item link class exists to reuse. Declared adjacent to `.target-note` in `src/styles.css` and built from the same tokens (NFR-04: reuse tokens, not classes, when no matching class exists).
- Suggested declaration:
```css
.grocery-item__search-link {
  color: var(--text-muted);
  font-size: 0.8rem;
  text-decoration: underline;
  margin-left: var(--space-2);
}

.grocery-item__search-link:hover,
.grocery-item__search-link:focus-visible {
  color: var(--text);
}

.grocery-item__search-link:focus-visible {
  outline: 3px solid var(--focus-ring);
  outline-offset: 2px;
}
```
- Sizing matches `.target-note` (0.8rem, `--text-muted`) per wireframes.md annotation; underline distinguishes it as interactive text since it sits inline in a plain-text `<li>` run, not a button-styled control.
- Appended at the end of each `<li>` text run, unconditionally, on every grocery-list line in every section -- curated or not (FR-06). Stays on the parent `<li>` when `showSourceRecipes` sub-list is expanded underneath; never duplicated per source recipe.

#### 4. Popup-blocked fallback (NFR-07) -- resolved by construction, no separate element

This is no longer an open "button vs anchor" question and no longer a separately-rendered element. Per section 1's implementation contract, the "Add all to Walmart cart" control IS the real `<a href={cartUrl} target="_blank" rel="noopener noreferrer">`. There is no `<button onClick={() => window.open(...)}>` implementation path in this spec, so there is no scenario in which a second DOM element (`.walmart-cart-fallback-link`) needs to be built, and no engineering decision left to confirm.

- **Why this resolves NFR-07 by construction:** a real anchor's navigation is a direct user gesture (left-click / Enter on a focused link), which browsers do not block the way they can block a script-initiated `window.open()` call. "Popup blocked" for this control degrades at most to "no new tab auto-opened"; the link itself is always present, always visible, and always independently clickable/keyboard-activatable -- it never depends on a JS success/failure signal that isn't reliably detectable in the first place.
- **Why this resolves the accessibility "fallback link discoverability" warning:** the prior open question (an always-visible-but-only-if-Path-B fallback link, positioned "adjacent" as a sighted-only cue) is moot. There is exactly one control, always in the DOM, always visible, never conditionally rendered based on detected failure -- so discoverability is guaranteed by construction rather than by visual proximity to a second element. No separate accessible-name-distinction concern arises either, since there is only one link, not two near-identically-labeled ones.
- No `.walmart-cart-fallback-link` class, no `.copy-confirmation`-based fallback markup, and no conditional "if engineering builds X" branching remain in this spec. Section 1 is the complete and only implementation for both the primary action and the popup-blocked-fallback requirement.

---

### States and Variants

| State/Variant | Description | Visual Treatment |
|---|---|---|
| Cart button -- hidden (zero-coverage) | `buildCartUrl` returns `undefined` (0 curated items, M>0, or M=0) | Not rendered; no reserved whitespace/layout gap |
| Cart button -- visible with count | `buildCartUrl` returns a URL, `curatedCount` >= 1 | `.copy-link-button.walmart-cart-button` rendered, coverage `<span class="target-note">` immediately after it |
| Cart button -- clicked | User activates the link | Browser navigates `cartUrl` in a new tab per normal anchor click; no in-app loading/pending visual state (no async call to await -- static deep link) |
| Coverage-count text -- shown | Paired 1:1 with button visibility | `.target-note` muted text, exact "N of M items" string |
| Coverage-count text -- hidden | Zero-coverage or empty-list states | Not rendered (not "0 of M" or "0 of 0") |
| Search link -- default | Line item rendered | `.grocery-item__search-link`, muted, underlined, inline after item text |
| Search link -- hover/focus | Pointer hover or keyboard focus | Color shifts `--text-muted` -> `--text`; `:focus-visible` adds `--focus-ring` outline (3px, 2px offset) matching `.copy-link-button:focus-visible` convention |
| Search link -- clicked | User activates the link | Browser navigates `buildSearchUrl(item.name)` in a new tab; item line and panel state unaffected |
| Fallback (NFR-07) | No separate element -- resolved by construction | The cart button itself is the fallback: a real, always-present, always-visible `<a href>`. No `.walmart-cart-fallback-link` element exists anywhere in this spec. |

---

### Accessibility

| Requirement | Implementation | WCAG Criterion |
|---|---|---|
| Cart button reachable and operable by keyboard | Native `<a href>` is natively focusable/activatable via Tab + Enter; no `tabindex` override needed | 2.1.1 Keyboard |
| Visible focus indicator on cart button | Inherits `.copy-link-button:focus-visible` (3px `--focus-ring` outline, 2px offset) already defined in `src/styles.css` | 2.4.7 Focus Visible |
| Coverage count programmatically associated with button (resolves a11y Warning) | `aria-describedby="walmart-coverage-count"` on the cart `<a>` references the coverage `<span>`'s `id`; accessible name+description bundle reads "Add all to Walmart cart (opens in new tab), N of M items" regardless of linear vs. rotor/table navigation -- not DOM adjacency alone | 1.3.1 Info and Relationships |
| Search link text meaningful and unique out of context (resolves a11y Suggestion) | `aria-label={\`Search for ${item.name} (opens in new tab)\`}` gives each per-item link a unique accessible name for rotor/link-list navigation, while visible text stays the compact literal "Search" | 2.4.4 Link Purpose (In Context) |
| Focus indicator on Search link | New `:focus-visible` rule added (3px `--focus-ring`, 2px offset) matching site-wide convention | 2.4.7 Focus Visible |
| Color contrast, default and hover/focus states | `--text-muted` on `--surface`/`--bg` and `--text` on `--surface`/`--bg` are both already-established token pairs used elsewhere in this stylesheet (`.target-note`, `.result-count`) -- no new color introduced, so contrast is inherited from already-verified pairs | 1.4.3 Contrast (Minimum) |
| New tab announced on cart button and Search link (resolves a11y Warning) | Cart button's `aria-label` ends "(opens in new tab)"; each Search link's `aria-label` ends "(opens in new tab)" -- explicit advance warning before activation, not left to the pre-existing sibling-pattern gap | 4.1.2 Name, Role, Value (practical new-tab-warning convention) |
| Fallback-link discoverability -- resolved by construction, not a separate finding | Since the cart control is always a real, always-present, always-visible `<a href>` (never conditionally rendered on detected popup-block failure), there is no second element whose discoverability could be in question; the "fallback link discoverability" a11y Warning is resolved by construction, not by an added markup fix | 1.3.3, NFR-07 |
| No motion/animation introduced | None of the elements add transitions beyond the existing `:hover`/`:focus-visible` color-swap already gated by other rules in this file (no new `@media (prefers-reduced-motion)` entry needed since no new transition is declared) | 2.3.3 Animation from Interactions (N/A -- no motion added) |

---

### Interaction Behavior

- **Cart button**: default state shows accent-free `.copy-link-button` chrome (border, no fill) with static label "Add all to Walmart cart." No hover-state color change is specified beyond what `.copy-link-button` already inherits (none currently declared in `src/styles.css` beyond `:focus-visible`) -- do not add a new hover rule; NFR-04 prohibits introducing style not already present on the class. Click navigates immediately; no loading spinner (deep link, no network round-trip owned by this app).
- **Coverage-count text**: static, non-interactive, re-renders only when `selectedCards`/curated data changes upstream. No interaction states.
- **Search link**: default = muted + underlined. Hover and focus-visible both shift text color to `--text` for visible affordance; focus-visible additionally adds the outline ring. Click opens new tab; does not alter panel state, does not scroll, does not collapse/expand the `showSourceRecipes` sub-list on the same item.
- **Fallback (NFR-07)**: no separate element or interaction states -- the cart button (above) is the entire implementation. Nothing additional to specify.

---

### Responsive Behavior

| Breakpoint | Layout Changes |
|---|---|
| Desktop / default (`.grocery-panel` fixed width `min(420px, 100%)`) | Cart button and coverage text wrap within `.grocery-panel__header`'s existing `flex-wrap: wrap` behavior -- no new breakpoint rule needed, inherits current header wrapping |
| Narrow viewport (panel width collapses toward 100%) | Search link stays inline at end of `<li>` text run; no icon-only collapse variant specified (per wireframes.md Research Recommendation to verify crowding against long item names -- flagged as open verification, not a spec change) |
| No distinct mobile layout | Wireframes.md states `target="_blank"` behavior is UX-equivalent on mobile and PRD names no mobile-specific constraint; no separate mobile spec produced |

---

### Design Rationale

| Decision | Rationale | Alternatives Considered |
|---|---|---|
| Cart button reuses `.copy-link-button` with an empty `.walmart-cart-button` modifier hook, not a new button class | NFR-04 -- zero new ad hoc style patterns; modifier class reserved for future targeted need without pre-emptively adding unused CSS | Fully new `.walmart-cart-button` class with its own declarations -- rejected, duplicates `.copy-link-button` for no visual difference |
| Coverage text reuses `.target-note` exactly, with an additive empty `.walmart-coverage-count` hook | Matches existing muted-secondary-text convention (`.target-note` used at lines 163/167/171/190 of `GroceryListView.tsx` per wireframes.md); hook class exists only for test/JS targeting, not styling | Custom `.coverage-count` class with independent font-size -- rejected, introduces a second "muted small text" pattern where one already exists |
| Search link gets one new class (`.grocery-item__search-link`) built from existing tokens (`--text-muted`, `--text`, `--focus-ring`, `--space-2`) | No existing inline-link-in-list-item class exists to reuse; NFR-04's requirement is "reuse tokens," which this satisfies even though the class itself is new | Reusing `.copy-link-button` per item -- rejected, that class is a bordered pill button, visually wrong for a dense per-line inline link and would look like 10+ buttons per section |
| Cart button IS the popup-blocked fallback -- no separate `.walmart-cart-fallback-link`/`.copy-confirmation` element | Resolves QA Gap 2 and Architect Warning 2 definitively: a native anchor's click is a direct user gesture, not a script-initiated `window.open()`, so it cannot be silently blocked; one always-present element satisfies NFR-07 rather than two mutually exclusive DOM shapes contingent on an unmade engineering decision | `<button onClick={window.open}>` plus a conditional `.copy-confirmation` fallback link -- rejected as strictly worse: adds a second DOM element, an unresolved implementation branch, and a JS-side popup-block detection dependency that isn't reliably possible |

---

### Token References

All three elements (cart button, coverage text, Search link) draw exclusively from tokens already declared in `src/styles.css`'s `:root` block: `--text-muted`, `--text`, `--border`, `--surface`, `--focus-ring`, `--space-2`, plus the existing classes `.copy-link-button`, `.target-note`, and `.grocery-panel__header`. `.copy-confirmation` is no longer used by this feature (no fallback-link element exists). No new color, radius, spacing, or duration token is introduced. Dark mode is inherited automatically -- all reused classes and tokens already have dark-mode overrides in the `@media (prefers-color-scheme: dark)` and `:root[data-theme='dark']` blocks (lines 918-972), so none of the new/extended elements need their own dark-mode rule.

---

### Follow-Up

- **Resolved, no longer open:** the cart button vs. fallback-link engineering decision is locked by this revision -- the button IS `<a href target="_blank">`, always present; no `<button onClick={window.open}>` path and no `.walmart-cart-fallback-link` element exist in this spec.
- **Resolved, no longer open:** coverage-count "N of M" numerator/denominator definition is now the single source of truth stated in section 2 -- N = items qualifying for `buildCartUrl` (defined `walmartItemId` AND valid quantity per FR-02), M = total rendered line items. `curatedCount` must be computed via the same qualification logic `buildCartUrl` uses (shared helper or equivalent single source of truth), never a parallel check.
- Add the `.grocery-item__search-link` and `.walmart-cart-button` / `.walmart-coverage-count` rules to `src/styles.css` at implementation time, placed near the existing `.target-note` / `.copy-link-button` declarations (around line 315-359) for discoverability.
- Manual verification per wireframes.md Research Recommendations: confirm "Search" link legibility/crowding on dense multi-item lists (10+ items) and narrow viewports; confirm coverage count is announced correctly via `aria-describedby` in practice.
- Accessibility testing needed: keyboard-only pass through all three elements (Tab order, focus-visible ring rendering, Enter activation) and a screen-reader spot check (VoiceOver or NVDA) confirming: cart button announces "Add all to Walmart cart (opens in new tab), N of M items"; each Search link announces "Search for [item name] (opens in new tab)".
- NFR-07 verification is manual/exploratory only (per QA review): no automated/scriptable way to reliably simulate a browser/extension popup blocker; manual check is to install a known popup-blocking extension, click the cart link, and confirm it remains reachable and clickable.
