## Language: TypeScript
## Task: write (User Story 3 — Build the Search-URL Function and Export a Shared Key Normalizer)

### Code

**`src/lib/groceryList.ts`** (edited — pure extract-and-export refactor):
- Added exported `normalizeIngredientKey(name: string): string` (returns `name.trim().toLowerCase()`), placed above `normalizeVolume`.
- Replaced the inline `const key = shoppingName.toLowerCase();` (shoppingName was already `.trim()`-ed one line above) with `const key = normalizeIngredientKey(shoppingName);`. Output is byte-identical to before since `shoppingName` was already trimmed — `normalizeIngredientKey` re-trims a no-op on an already-trimmed string, then lowercases, same as before.

**`src/lib/walmartLinks.ts`** (new file):
```ts
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- imported for Story 2's use of the shared key normalizer
import { normalizeIngredientKey } from './groceryList';

/**
 * Builds a Walmart search URL for the given item name. Always returns a
 * usable, syntactically valid URL — requires no curated data, so it works
 * for any ingredient, curated or not.
 */
export function buildSearchUrl(itemName: string): string {
  const params = new URLSearchParams({ q: itemName });
  return `https://www.walmart.com/search?${params.toString()}`;
}
```

### Key Decisions
- `normalizeIngredientKey` is a one-line pure function, matching the existing inline logic exactly — zero behavior change to `groceryList.ts` output (confirmed by unchanged test pass).
- `buildSearchUrl` uses `URLSearchParams({ q: itemName })` rather than manual `encodeURIComponent`, matching `shareState.ts`'s established convention in this codebase for query building; this correctly percent-encodes spaces, `%`, `(`, `)`, `&`, Unicode/emoji, and empty strings without manual escaping logic.
- Kept `walmartLinks.ts` minimal per instructions (only `buildSearchUrl` — Story 2 adds `buildCartUrl` to this file in parallel). Imported `normalizeIngredientKey` even though `buildSearchUrl` itself doesn't need a key lookup, per the story's explicit instruction that the import be available for Story 2's use; suppressed the resulting unused-import lint warning with an explanatory eslint-disable comment (verified `noUnusedLocals`/`noUnusedParameters` are `false` in `tsconfig.app.json`, so this does not block `tsc`).
- No curated-data dependency in `buildSearchUrl` — satisfies AC "always returns a usable URL — never undefined" for any item, curated or not.

### Test Suggestions
- Existing: `npm test -- groceryList` — 16/16 pass, confirming no regression to `groceryList.ts` output.
- For Story 4 (unit tests for `walmartLinks.ts`), recommend covering TC-SEARCH-001 through 005 and N01/N02:
  - `buildSearchUrl("chicken breast")` → contains `q=chicken` and `+` or `%20` encoding.
  - `buildSearchUrl("greek yogurt (2%)")` → percent-encodes `%`, `(`, `)`.
  - `buildSearchUrl("salt & pepper")` → single `q` param, `&` encoded as `%26`, not a second param.
  - `buildSearchUrl("café ☕")` → no throw, valid URL.
  - `buildSearchUrl("")` → returns `https://www.walmart.com/search?q=`.
  - `normalizeIngredientKey("  Garlic ")` → `"garlic"`; cross-check against `groceryList.ts` internal key and any `walmartLinks.ts` lookup key for same input (TC-SEARCH-004).

### Verification Status
- **Verified by tests**: All 16 pre-existing `groceryList.test.ts` assertions pass unchanged after the refactor (confirms no behavior change to `groceryList.ts`'s output, per AC and story constraint).
- **Verified by inspection**: 
  - `normalizeIngredientKey` is exported from `groceryList.ts` and used at its original call site (source read).
  - `walmartLinks.ts` contains no inline `.trim().toLowerCase()` duplication — `buildSearchUrl` does no key derivation at all, and the imported normalizer is available for future use (TC-SEARCH-004's "no inline duplication" clause).
  - `buildSearchUrl` construction via `URLSearchParams` guarantees percent-encoding of spaces, `%`, `(`, `)`, `&`, Unicode per the `URLSearchParams`/`application/x-www-form-urlencoded` spec — covers TC-SEARCH-001, 002, N01, N02 by construction.
  - `buildSearchUrl` has no conditional/curated-data branch that could return `undefined` — always returns a string (TC-SEARCH-003).
  - Empty string input flows through unchanged: `new URLSearchParams({ q: '' }).toString()` → `q=`, no throw (TC-SEARCH-005).
- **Requires runtime validation**: None — this story's AC are pure string/URL-construction behavior, no visual, API, or runtime-dependent output.
- **Verification gaps**: No automated tests were written for `walmartLinks.ts` in this story (Story 4 owns that); behavior was verified by source inspection and knowledge of `URLSearchParams` semantics only, not by running new test code.

### Follow-Up
- Story 4 should add `walmartLinks.test.ts` covering TC-SEARCH-001–005 and N01/N02 as listed above.
- Story 2 (parallel) will add `buildCartUrl` to `src/lib/walmartLinks.ts` — file kept minimal/mergeable as instructed; expect a merge on this file.
