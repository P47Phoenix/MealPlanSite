# Architect DoD Validation — Sprint 1 (Walmart Cart Integration) — Round 2

Role: Solution Architect | Task: review (re-validation) | Verified against `.delivery/artifacts/04-architect/solution/architecture.md` §3.1, §3.2, §2a

Round 1 finding being re-verified: `groceryList.ts` line ~153 had an inline `PURCHASE_UNITS[acc.displayName.trim().toLowerCase()]` re-derivation instead of calling the shared `normalizeIngredientKey`.

## Criterion 1: `normalizeIngredientKey` genuinely shared (architecture §3.1)

**Verdict: PASS**

- `normalizeIngredientKey` is exported from `groceryList.ts` (lines 78-80), unchanged: `return name.trim().toLowerCase();`.
- The fix is confirmed present: `groceryList.ts` line 153 now reads `const purchaseEntry = PURCHASE_UNITS[normalizeIngredientKey(acc.displayName)];` — the inline `.trim().toLowerCase()` re-derivation is gone.
- `groceryList.ts`'s aggregation key at line 112 (`const key = normalizeIngredientKey(shoppingName);`) also uses the shared function, as before.
- `walmartLinks.ts` line 43 uses `PURCHASE_UNITS[normalizeIngredientKey(item.name)]?.walmartItemId`.
- Full-file grep of `groceryList.ts` for the inline pattern: the only remaining `.trim().toLowerCase()` occurrences are at lines 56-57 (`normalizedRawUnit`/`normalizedPackageUnit` inside `computePurchaseQuantity`, for matching volume/unit labels like "tsp"/"cup") and lines 124/126 (`unitKey`/`addAmount` derivation for volume-family aggregation). None of these index `PURCHASE_UNITS` by ingredient name — they normalize *unit* strings, a distinct concern from the ingredient-key lookup `normalizeIngredientKey` was created to unify. No inline re-derivation of the ingredient-key pattern remains anywhere in the file.
- Both `PURCHASE_UNITS` call sites in the codebase (`groceryList.ts:153`, `walmartLinks.ts:43`) now go through `normalizeIngredientKey`. The drift risk identified in round 1 is closed.

## Criterion 2: `getQualifyingItems` is the single implementation `buildCartUrl` uses (architecture §3.2)

**Verdict: PASS** (unchanged from round 1 — re-confirmed)

- `getQualifyingItems` exported from `walmartLinks.ts` (line 40); `buildCartUrl` calls it directly and only (line 61), builds the URL from its result (lines 62-66). No parallel filter logic exists in the file.

## Criterion 3: No architectural decision silently re-opened (esp. no `window.open()` path)

**Verdict: PASS** (unchanged from round 1 — re-confirmed)

- `buildCartUrl` returns a plain string URL; nothing in `walmartLinks.ts` dispatches navigation. No `window.open(` introduced.
- Same out-of-scope observation as round 1 stands: `GroceryListView.tsx` UI wiring was not in this task's input artifacts and is not evaluated here — not a criterion failure.

## Criterion 4: `purchaseUnits.ts` extension is additive only

**Verdict: PASS** (unchanged from round 1 — re-confirmed)

- `PurchaseUnitEntry.walmartItemId?: string` remains a new optional field; no existing entry's shape changed. `computePurchaseQuantity` still reads only `unitLabel`/`packageSize`/`packageUnit`, unaffected by the new field.

## Overall

**Verdict: PASS — 4 of 4 criteria PASS.**

The round-1 gap is fixed and verified by direct file inspection: `groceryList.ts` line 153 now calls `normalizeIngredientKey(acc.displayName)`, matching the aggregation key derivation and `walmartLinks.ts`'s lookup. No remaining inline `.trim().toLowerCase()` re-derivation of the `PURCHASE_UNITS` ingredient key exists anywhere in the codebase. No new issues found. Sprint 1 passes the Architect Definition of Done.
