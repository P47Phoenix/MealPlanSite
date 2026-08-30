# Story 5 — Walmart Cart Button, Per-Item Search Links, README Documentation

## Language: TypeScript / React
## Task: write

### Code changes

**`src/components/GroceryListView.tsx`**
- Imported `buildCartUrl`, `buildSearchUrl`, `getQualifyingItems` from `../lib/walmartLinks`.
- Added a `useMemo` keyed on `[groceryList]` that computes `allItems` (flatMap over all section
  entries), `cartUrl = buildCartUrl(allItems)`, `curatedCount = getQualifyingItems(allItems).length`,
  and `totalCount = allItems.length`.
- In `.grocery-panel__header`, added the cart anchor and coverage span, rendered only when `cartUrl`
  is truthy (single code path handles both M=0 and N=0/M>0 cases — nothing renders):
  ```tsx
  {cartUrl && (
    <>
      <a className="copy-link-button walmart-cart-button" href={cartUrl} target="_blank"
         rel="noopener noreferrer" aria-label="Add all to Walmart cart (opens in new tab)"
         aria-describedby="walmart-coverage-count">
        Add all to Walmart cart
      </a>
      <span id="walmart-coverage-count" className="target-note walmart-coverage-count">
        {curatedCount} of {totalCount} items
      </span>
    </>
  )}
  ```
  This is a single `<a>` element — no button+`window.open` fallback path, per architecture §2a.
- In each grocery `<li>`, appended an unconditional `Search` anchor after the item's quantity/name
  text run and before the `showSourceRecipes` sub-list, so it renders once per item across all
  sections and is never duplicated when the source-recipes sub-list is expanded:
  ```tsx
  <a className="grocery-item__search-link" href={buildSearchUrl(item.name)} target="_blank"
     rel="noopener noreferrer" aria-label={`Search for ${item.name} (opens in new tab)`}>
    Search
  </a>
  ```

**`README.md`**
- Added a "Walmart cart and search links" section documenting both features, the
  `affil.walmart.com/cart/addToCart` endpoint, and that it **requires** Impact Radius affiliate
  program enrollment for production use (phrased as a prerequisite, not a claim of current
  enrollment — points to the PRD's open questions). No fabricated affiliate tracking ID anywhere.

### Key Decisions

- Coverage/cart computation is a single `useMemo` keyed on `[groceryList]` (not `selectedCards`),
  matching architecture §3.3 guidance and avoiding a second independent derivation of "all items."
- `allItems` is built via `Object.entries(groceryList).flatMap(...)` — no need to pre-filter empty
  sections since `flatMap` on an empty array contributes nothing.
- Render gate is `cartUrl` truthiness alone (which `buildCartUrl` already only returns for
  `curatedCount > 0`), giving one code path for both zero-total and zero-curated cases, per NFR-07/§2a.
- Search anchor placed with a `{' '}` separator right after the quantity/name fragment and before
  the conditional `showSourceRecipes` block, so it always attaches to the parent `<li>` exactly once.

### Test Suggestions

- Existing `src/lib/walmartLinks.test.ts` (26 tests) already covers `buildCartUrl`,
  `buildSearchUrl`, `getQualifyingItems` edge cases (M=0, N=0, invalid quantities, etc.) — reused
  as-is, no changes needed.
- `src/components/GroceryListView.test.tsx` — **added in this pass**, 13 tests covering all 16
  TC-GLV/TC-SL cases from stories.md (several TCs share one assertion block where the spec pairs
  them, e.g. TC-GLV-001/002 markup, TC-GLV-N01/N02 empty-list, TC-SL-001/002 curated+uncurated):
  - TC-GLV-001/002: button markup (class, href, target, rel, aria-label, aria-describedby).
  - TC-GLV-003: coverage text accuracy ("C of M items").
  - TC-GLV-004: button hidden when zero curated items, M>0.
  - TC-GLV-N01/N02: button and coverage text both absent when list is empty.
  - TC-GLV-005: href equals exact `buildCartUrl` output.
  - TC-GLV-006: coverage numerator derives from `getQualifyingItems(...).length`.
  - TC-GLV-007: no affiliate-approval gating on the button.
  - TC-GLV-008: recomputes on `groceryList`/`selectedCards` change via rerender.
  - TC-SL-001/002/003: search link on curated and uncurated lines, every section.
  - TC-SL-004/TC-SL-N01: search link href matches `buildSearchUrl` regardless of curated status.
  - TC-SL-005: `showSourceRecipes` expansion does not duplicate the search link.

### Verification Status

- **Verified by tests**: `npm test` — 146/146 tests passed (13 files), including the new
  `GroceryListView.test.tsx` (13 tests, all 16 TC-GLV/TC-SL cases) and all 26 `walmartLinks` tests.
- **Verified by inspection**: single-anchor-only cart button (no button/window.open fallback);
  render gate covers both M=0 and N=0 cases via one path; README phrasing avoids asserting current
  affiliate enrollment; no fabricated tracking ID. (TC-README-001-003 verified by inspection only,
  per QA gap review — README is documentation, not code, no test needed.)
- **Requires runtime validation**: actual link click-through behavior in a browser (opens new tab,
  correct Walmart cart contents) — not exercised by the automated suite.
- **Verification gaps**: none remaining for TC-GLV/TC-SL. Component-level test gap flagged in
  `story5-qa-review.md` is closed.

### Follow-Up

- `npx tsc --noEmit` ran clean (no type errors) alongside `npm test`.
