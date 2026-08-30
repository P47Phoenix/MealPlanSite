# Architect DoD Review — Stage 2 (Refine)

**Role:** Solution Architect
**Task:** dod-validation
**Artifact under review:** `.delivery/artifacts/02-refine/po/prd.md` (Walmart Cart Integration for the Grocery List)
**Supporting artifacts read:** `spike-findings.md`, `src/data/purchaseUnits.ts`

---

## Gate Criteria Results

### 1. Every FR is technically achievable given the stated constraints (static GitHub Pages, no backend, no secrets)

**PASS**

- FR-01 (data model extension), FR-02/FR-03 (pure URL-builder functions), FR-06 (per-item search links), FR-07 (README doc) are all buildable as static client code with no server component.
- FR-05 explicitly and correctly rules out the two credentialed Walmart API surfaces (Marketplace/Supplier OAuth2, I/O Affiliate RSA-signing) as infeasible under the no-secrets/no-backend constraint — this is the right call and is architecturally sound.
- FR-04/FR-08 (cart button, pre-approval UX) depend only on client-side URL construction and `window.open`, which is achievable statically.
- NFR-01–NFR-07 are all satisfiable by static-asset, framework-free TypeScript modules plus existing React component conventions; none imply a server dependency.

### 2. The core mechanism (Walmart add-to-cart deep link) has been verified, not just assumed

**PASS**

- `spike-findings.md` is directly referenced and incorporated at FR-02, FR-03, FR-04, and FR-08, each dated 2026-08-29 and citing specific findings.
- The spike confirms, via live browser test against the real endpoint: single-item add, cumulative `ID|QTY` quantity syntax, multi-item comma-joined format, and — critically — graceful degradation on a mixed valid/invalid-ID request (valid item added, invalid item silently dropped, landing on the cart page rather than an error page). This directly substantiates FR-02's "skip items without a match" behavior and NFR-05's stale-ID handling assumption, rather than leaving it as an unverified assumption.
- The PRD honestly carries forward what the spike did *not* resolve (affiliate/ToS compliance pre-enrollment, endpoint deprecation timeline) as OQ-5 and a Dependencies & Risks entry, rather than overstating the spike's coverage.

### 3. No FR contradicts another FR or the stated constraints

**PASS**

- FR-04 and FR-08 were checked specifically for contradiction (button visibility gated on coverage vs. pre-approval UX) — they are consistent: both key the button's visibility strictly to "≥1 curated item," independent of affiliate-approval status, and FR-08 explicitly defers to FR-06 as the fallback if Walmart rejects unapproved traffic.
- FR-05's "no backend" constraint is not contradicted anywhere else in the FR set — no other FR proposes a server call.
- One drafting gap, not a contradiction: FR-04's acceptance criteria describe the button's `target="_blank"` open behavior but do not mention NFR-07's popup-blocked visible-fallback-link requirement. This isn't a conflict (nothing in FR-04 precludes rendering the fallback), but the two ACs currently live in separate sections with no cross-reference, which risks NFR-07 being dropped during story decomposition. **Recommended fix (non-blocking for this gate):** add a one-line cross-reference in FR-04's AC or in NFR-07 pointing at the other, so the story that implements FR-04 explicitly inherits the NFR-07 AC.

### 4. Data model changes (walmartItemId addition) are consistent with the existing purchaseUnits.ts structure

**PASS**

- `src/data/purchaseUnits.ts` defines `PurchaseUnitEntry` with three required fields (`unitLabel`, `packageSize`, `packageUnit`) and a `Record<string, PurchaseUnitEntry>` keyed by "lowercased, trimmed shoppingName/name" per the file's own doc comment.
- FR-01 proposes adding `walmartItemId?: string` as an **optional** field to the same interface, keyed the same way — this is a non-breaking, additive change consistent with the existing structure and its documented key convention.
- FR-01's 8 named priority staples (chicken breast, eggs, olive oil, garlic, onion, brown rice, canned tuna, greek yogurt) all already exist as keys in `PURCHASE_UNITS` today, confirming no new key-derivation logic is needed for the minimum launch bar.
- FR-02's lookup (`PURCHASE_UNITS[key]?.walmartItemId`) matches the existing map's shape and optional-chaining is appropriate since most entries won't have the new field yet.

---

## Overall Result

**PASS — all 4 gate criteria met. No blocking issues found.**

One non-blocking drafting recommendation carried forward to story decomposition: cross-reference NFR-07 (popup-blocked fallback) from FR-04's acceptance criteria so it isn't overlooked when FR-04 is decomposed into an implementation story.
