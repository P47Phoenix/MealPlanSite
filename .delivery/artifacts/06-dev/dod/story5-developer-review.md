## Developer DoD Review — Story 5 (Walmart Cart Button, Search Links)

Language: TypeScript / React | Task: dod-validation | Reference: references/languages/typescript.md

### Criterion 1 — New JSX matches component-specs.md's exact contract verbatim

**PASS**

Compared `src/components/GroceryListView.tsx` line-by-line against `.delivery/artifacts/03-design/ui/component-specs.md`:

- Cart button (GroceryListView.tsx:135-144) matches spec section 1 verbatim: `class="copy-link-button walmart-cart-button"`, `href={cartUrl}`, `target="_blank"`, `rel="noopener noreferrer"`, `aria-label="Add all to Walmart cart (opens in new tab)"`, `aria-describedby="walmart-coverage-count"`, single `<a>` element, no separate button/fallback path.
- Coverage span (GroceryListView.tsx:145-147) matches spec section 2 verbatim: `id="walmart-coverage-count"`, `class="target-note walmart-coverage-count"`, `{curatedCount} of {totalCount} items`.
- Search link (GroceryListView.tsx:226-233) matches spec section 3 verbatim: `class="grocery-item__search-link"`, `href={buildSearchUrl(item.name)}`, `target="_blank"`, `rel="noopener noreferrer"`, `aria-label={`Search for ${item.name} (opens in new tab)`}`, visible text "Search".
- Conditional gating matches spec: cart button/coverage span render only when `cartUrl` is truthy (spec States table: hidden on zero-coverage, no reserved whitespace) — confirmed via `{cartUrl && (...)}` wrapper.
- `curatedCount`/`totalCount` sourced from `getQualifyingItems(allItems).length` / `allItems.length`, matching spec section 2's single-source-of-truth requirement (shared qualification logic with `buildCartUrl`, not a parallel check).

### Criterion 2 — CSS class cross-check (Story 5 markup vs. Story 6 styles.css)

**PASS**

Grep of `src/styles.css` confirms all three classes GroceryListView.tsx references are defined, with no typos or naming drift:

- `.walmart-cart-button` — styles.css:329
- `.walmart-coverage-count` — styles.css:364
- `.grocery-item__search-link` — styles.css:367 (plus `:hover`, `:focus`, `:focus-visible` variants at 373-378)

Class name strings in GroceryListView.tsx (`walmart-cart-button`, `walmart-coverage-count`, `grocery-item__search-link`) are character-for-character identical to the selectors declared in styles.css. No mismatch between the two independently-written stories.

### Criterion 3 — No leftover TODOs, no dead code, imports clean

**PASS**

- No `TODO`/`FIXME`/`XXX` comments in `GroceryListView.tsx`.
- All imports are used: `useMemo`, `useState` (React), `MealCard` (type), `buildGroceryList`/`GroceryItem`, `buildCartUrl`/`buildSearchUrl`/`getQualifyingItems` (all three called), and the preferences functions (`getGroceryDisplayMode`, `setGroceryDisplayMode`, `getShowSourceRecipes`, `setShowSourceRecipes`, `GroceryDisplayMode` type) are all referenced in component state/handlers.
- No commented-out code blocks or unreachable branches introduced by this story.
- `cartUrl`/`curatedCount`/`totalCount` derivation is a single `useMemo` keyed on `[groceryList]`, consistent with story-5.md's stated design and avoiding duplicate logic.

### Overall: PASS (3/3 criteria)

No fixes required.
