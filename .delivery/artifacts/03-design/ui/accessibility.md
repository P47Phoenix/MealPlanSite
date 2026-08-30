## Design Review: Walmart Cart Integration -- Wireframes & Component Specs
## Role: UI Designer

### Summary
Design mostly meets WCAG 2.1 AA -- keyboard/focus/contrast inherited correctly from reused tokens -- but two gaps need fixing before build: cart button label doesn't announce "opens new tab," and coverage-count text isn't programmatically tied to the button (relies on DOM adjacency only).

### Findings

#### Critical
- None. No blocker prevents keyboard or screen-reader task completion.

#### Warning
- **Cart button label doesn't convey "opens in new tab"**: `<a>Add all to Walmart cart</a>` with `target="_blank"` gives no advance warning to screen reader or low-vision users before they activate it. Spec (component-specs.md ~132) flags this as "existing pattern gap, not newly introduced" and cites 3.2.5 -- wrong criterion (3.2.5 is Change on Request, opt-in preference; the applicable one is **3.1.5/2.4.4 in spirit, practically WCAG's guidance under 4.1.2 and common practice: warn of new-tab behavior**). Recommendation: add visually-hidden text or `aria-label` -- e.g. `aria-label="Add all to Walmart cart (opens in new tab)"` -- on the cart button, the fallback link, and the per-item Search link. Reusing an existing sibling's gap does not excuse propagating it to three new interactive elements in one feature.
- **Coverage count not programmatically associated with the button**: `<span class="target-note">8 of 14 items</span>` sits after the button in DOM order only. Screen reader users tabbing element-by-element (not reading linearly) hit the button first with no indication that a count follows it. Recommendation: `aria-describedby` on the button pointing to the span's `id`, so the accessible name/description bundle reads "Add all to Walmart cart, 8 of 14 items" regardless of navigation mode. Low cost, closes a real gap the current spec (component-specs.md line 127) only partially covers by asserting "adjacent DOM order is enough" -- adjacency helps linear reading, not table/rotor-style navigation.
- **Fallback link (State B) accessible name doesn't distinguish it from the primary button**: both "Add all to Walmart cart" and "Open Walmart cart" are plausible-sounding but a screen reader user encountering two links with the same destination and near-identical labels back-to-back may not understand why both exist, especially since the fallback is conditional on an implementation choice not yet finalized. If the fallback path is built, add supporting text (e.g. visually-hidden "if the button above didn't open a new tab") so purpose is discoverable non-visually, not just via visual proximity ("positioned directly beneath/adjacent to the cart button" per component-specs.md line 100 -- a sighted-only cue).

#### Suggestion
- **Per-item "Search" link repeated many times per page**: with 10+ items, a screen reader rotor/link list will show many identical "Search" entries with no differentiator until the user reads surrounding context. Component-specs.md correctly notes the `<li>` provides context in linear reading (line 128), but rotor/link-list navigation (common NVDA/VoiceOver workflow) loses that context. Consider `aria-label={\`Search for ${item.name}\`}` on each link -- keeps visible text compact ("Search") per the wireframe's stated design intent while giving assistive tech a unique accessible name per instance.
- **Tab order not explicitly specified**: neither artifact states the intended tab order through the four new interactive elements relative to existing ones (Copy link, Copy list, checkbox, close button). Recommend documenting explicitly: cart button -> coverage text (non-focusable, skipped) -> fallback link (if present) -> display dropdown -> show-source-recipes checkbox -> item list (Search links in visual/DOM order) -> close button. This is inferable from "insert into existing DOM order" language but should be stated, not implied, since it's exactly the surface this review was asked to check.
- **Focus management on new-tab open is unaddressed**: neither document says what happens to focus in the original tab after `target="_blank"` fires. This is correct by default (focus should stay on the triggering link in the original tab; the new tab is not something to auto-focus into or trap) -- but stating it explicitly avoids an implementer adding an unnecessary `.focus()` call or, worse, moving focus into the closed popup-blocked scenario. Recommend one line in the spec confirming: focus remains on the activating link/button in the original tab in all cases (success, popup-blocked, or fallback-link click).

### Assessment
| Criterion | Current State | Severity | Recommendation |
|-----------|--------------|----------|----------------|
| Keyboard navigation (2.1.1, 2.4.3) | Native `<a>` elements, natural DOM tab order, no tabindex overrides | Pass | None -- correctly specified |
| Focus visible (2.4.7) | Inherits `.copy-link-button:focus-visible` / new `:focus-visible` rule on Search link, both 3px `--focus-ring` + 2px offset | Pass | None |
| New-tab warning (Name, Role, Value / 4.1.2 in practice) | Not conveyed on button, fallback link, or Search link | Warning | Add "(opens in new tab)" via visually-hidden text or `aria-label` on all three |
| Coverage count announcement (1.3.1) | DOM-adjacent only, no `aria-describedby` | Warning | Wire `aria-describedby` from button to coverage `<span>` id |
| Fallback link discoverability (NFR-07, 1.3.3) | Positioned "directly beneath/adjacent," a visual-only cue per spec language | Warning | Add non-visual context to fallback link's accessible name if that path is built |
| Search link accessible name uniqueness (2.4.4, 4.1.2) | Literal "Search" repeated per item, context via `<li>` DOM order only | Suggestion | Add `aria-label` with item name for rotor/link-list navigation |
| Color contrast (1.4.3) | Reuses already-verified `--text-muted`/`--text` on `--surface`/`--bg` pairs, no new colors | Pass | None -- correctly reasoned in component-specs.md |
| Focus management on tab open | Unstated | Suggestion | Document explicitly: focus stays in original tab in all cases |
| Popup-blocked fallback discoverability (NFR-07) | Always-rendered link (not conditional on detected failure) -- correct approach | Pass | None -- correctly avoids relying on JS-side failure detection |
| Target size (2.5.5) | Inherited from `.copy-link-button` (unchanged) and inline text link (Search) -- Search link is a small inline text target | Suggestion | Not a regression from existing pattern, but verify Search link's clickable area plus `margin-left: var(--space-2)` gives adequate spacing from adjacent text at dense list sizes (ties to wireframes.md's own "verify crowding" research recommendation) |

### Recommended Actions
1. Add "(opens in new tab)" context (visually-hidden text or `aria-label`) to the cart button, fallback link, and per-item Search link -- three elements, same fix pattern, before implementation.
2. Add `id` to the coverage-count `<span>` and `aria-describedby` on the cart button referencing it, so the count is announced as part of the button regardless of navigation mode.
3. If engineering selects the non-anchor `<button onClick={window.open}>` path (making the fallback link a required rendered element, not satisfied-by-construction), add a non-visual differentiator to the fallback link's accessible name so it isn't indistinguishable from the primary button to screen reader users.
4. Add `aria-label={\`Search for ${item.name}\`}` to each per-item Search link for rotor/link-list navigation.
5. Document tab order and post-click focus behavior explicitly in the component spec rather than leaving both implied by DOM order.
6. At implementation, run the manual pass already flagged in component-specs.md Follow-Up (keyboard-only + screen reader spot check) and specifically verify the new-tab announcement and `aria-describedby` wiring land correctly in VoiceOver/NVDA output.
