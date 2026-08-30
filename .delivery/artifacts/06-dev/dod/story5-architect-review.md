# Architect DoD Validation — Story 5 (Walmart Cart Integration)

Role: Solution Architect | Task: dod-validation

## Criterion 1 — Cart control is exactly one `<a href target="_blank" rel="noopener noreferrer">`

**PASS**

`GroceryListView.tsx` lines 133-149: the only cart control is:

```jsx
<a
  className="copy-link-button walmart-cart-button"
  href={cartUrl}
  target="_blank"
  rel="noopener noreferrer"
  aria-label="Add all to Walmart cart (opens in new tab)"
  aria-describedby="walmart-coverage-count"
>
```

Repo-wide grep for `window.open` and `walmart-cart-fallback` returns no matches in `src/`. No `<button onClick={window.open}>` path exists, and no second conditionally-rendered fallback element exists. Matches architecture §2a exactly (locked decision honored, not reopened).

## Criterion 2 — curatedCount derives from `getQualifyingItems(...).length`

**PASS**

`GroceryListView.tsx` line 58: `curatedCount: getQualifyingItems(allItems).length`. `walmartLinks.ts` line 61: `buildCartUrl` internally calls `const qualifying = getQualifyingItems(items);`. Both call sites route through the single exported `getQualifyingItems` (walmartLinks.ts lines 40-52) — no separately reimplemented filter exists. Matches architecture §3.2.

## Criterion 3 — `useMemo` keyed on `[groceryList]`

**PASS**

`GroceryListView.tsx` lines 54-61:

```js
const { cartUrl, curatedCount, totalCount } = useMemo(() => {
  const allItems = Object.entries(groceryList).flatMap(([, items]) => items);
  return { cartUrl: buildCartUrl(allItems), curatedCount: getQualifyingItems(allItems).length, totalCount: allItems.length };
}, [groceryList]);
```

Dependency array is `[groceryList]`, not `[selectedCards]`. `groceryList` itself is a separate `useMemo` keyed on `[selectedCards]` (line 52), so there is a single source of truth for "what changed" — matches architecture §3.3's desync-prevention requirement.

## Criterion 4 — Empty-list (M=0) and zero-curated (N=0, M>0) both render nothing via the same code path

**PASS**

Both cases collapse to `cartUrl === undefined`: `buildCartUrl` returns `undefined` when `qualifying.length === 0` (walmartLinks.ts line 62), which is true both when `items` is empty and when items exist but none qualify. `GroceryListView.tsx` line 133 gates the entire cart-button-plus-coverage-span block on `{cartUrl && (...)}`  — one conditional, one code path, no separate branch for the two cases. Matches PRD FR-04 AC.

## Criterion 5 — No affiliate tracking ID or credential in new code

**PASS**

Grepped `walmartLinks.ts` for `affil|token|apiKey|api_key|secret|credential` (case-insensitive): only match is the literal endpoint host `https://affil.walmart.com/cart/addToCart` (line 66), which is the documented, architecture-approved deep-link host, not a tracking ID or credential. No API keys, tokens, or affiliate IDs are embedded anywhere in `walmartLinks.ts` or `GroceryListView.tsx`. Matches NFR-02/FR-07.

## Overall

All 5 gate criteria PASS. Implementation conforms to the architecture decisions recorded in `architecture.md` §2a, §3.2, §3.3, and satisfies the FR-04 empty/zero-curated AC and NFR-02/FR-07 credential constraint.
