## Test Plan: Walmart Cart Integration for the Grocery List (UAT / Stage 7)

### Objective
Validate, prior to production sign-off, that the "Add all to Walmart cart" feature on the grocery list panel meets every FR/NFR acceptance criterion from the PRD (`.delivery/artifacts/02-refine/po/prd.md`), that the 146-147 existing automated tests provide sufficient coverage of pure-function and component-render logic, and that the remaining runtime behavior — which cannot be unit-tested in a static React/Vite site with no backend — is verified by a human in a real browser against real Walmart URLs before this ships to GitHub Pages.

### Scope

**In scope:**
- Full FR-01–FR-08 and NFR-01–NFR-07 checklist verification (automated-coverage cross-reference + manual gap-fill).
- Manual UAT execution of the 5 technical-plan steps (button count accuracy, real-cart click-through, per-item search links, zero-coverage/empty-list hiding, popup-blocked fallback).
- Human spot-check of the 7 non-verified `walmartItemId` values against live walmart.com product pages.
- Dark-mode visual check and keyboard focus-visible check on the new UI elements (TC-CSS-004, TC-CSS-005 visual half).
- Source-inspection checks: no affiliate credentials/secrets, README honesty, CSS token reuse, no OAuth/RSA-signing references.
- Regression confirmation that the full automated suite still passes unmodified.

**Out of scope:**
- Re-testing pure-function branch logic already covered by `walmartLinks.test.ts` / `purchaseUnits.test.ts` / `GroceryListView.test.tsx` (would duplicate automated coverage — see Strategy Summary).
- Actually completing a real Walmart purchase/checkout — verification stops at confirming the cart page loads with correct items, no live order is placed.
- Resolution of Impact Radius affiliate-program enrollment status (PRD OQ-1/OQ-5) — this is a Product Owner decision, flagged here as an open item, not a QA-executable test.
- Load/performance/security penetration testing — not applicable to a static client-side link-building feature (NFR-05/NFR-02 cover the relevant security concern via source inspection).

### Strategy Summary
This is a thin client-side feature (two pure functions + component render logic + static markup), so the test pyramid is intentionally automation-heavy: ~146-147 unit/component tests (Vitest + Testing Library) already cover all branches of `buildCartUrl`/`buildSearchUrl`, all render states of the cart button and per-item search links, and a data-integrity guard over `purchaseUnits.ts`. Per the "appropriate to the level" guardrail, this UAT plan does **not** re-prescribe UI tests for logic already exercised at the unit/component level — it targets only what a browser and a live network can prove: real Walmart URL resolution, popup-blocker interaction, dark-mode rendering, and keyboard focus rendering. Source-inspection items (secrets, CSS tokens, README wording) are treated as manual code-review checks, not automatable via Vitest, and are executed via `git grep` / direct file reading. Risk-based prioritization: the FR-02 real-cart click-through and the 7 unverified `walmartItemId` spot-checks are Critical (customer-facing purchase path, direct financial/trust risk if wrong); popup-fallback and zero-coverage hiding are High (correctness/UX risk); dark-mode and focus-visible are Medium (accessibility/visual polish, lower business impact).

### Test Schedule
| Phase | Activities | Duration | Dependencies |
|---|---|---|---|
| 1. Automated regression confirmation | Re-run full suite (`npm test`), confirm 146+ tests pass, zero new failures, reconcile 146 vs. 147 count discrepancy | 0.5 hr | `main` branch build green, Stage 6 complete |
| 2. Source-inspection pass | `git grep` for credentials/OAuth/RSA references, README review, CSS token review | 1 hr | Repo access |
| 3. Manual browser UAT | Execute MUAT-01 through MUAT-05 (5 technical-plan steps) on `npm run dev` | 2 hrs | Phase 1 pass, real network access to walmart.com |
| 4. Data spot-check | MUAT-06: verify 7 unverified `walmartItemId` values on live walmart.com product pages | 1 hr | Phase 3 environment available |
| 5. Visual/accessibility pass | MUAT-07 (dark mode), MUAT-08 (focus-visible) | 0.5 hr | Phase 3 environment available |
| 6. Defect triage & re-test | Log defects, re-verify fixes, re-run affected manual cases | Variable (buffer 1 day) | Phases 1-5 complete |
| 7. Sign-off | Compile results, present open items (OQ-1/OQ-5, unverified IDs) to PO, obtain sign-off | 0.5 hr | All phases exited cleanly or risk documented |

### Test Cases

#### FR/NFR Checklist

| ID | Requirement summary | Automated coverage (test file + TC-IDs) | Manual verification required (Y/N + what) | Status |
|---|---|---|---|---|
| FR-01 | 8 staples curated with non-empty all-digit `walmartItemId`; entries without field remain valid | `purchaseUnits.test.ts` TC-PU-001–007, TC-PU-N01–N03 (format/collision/valid-without-field) | **Y** — human must open 7 non-verified staples' walmart.com/ip/.../<ID> URLs and confirm product match (eggs=145051970 already live-spike-verified) | Automated: Pass. Manual: Pending (MUAT-06) |
| FR-02 | `buildCartUrl(items)` builds correct URL, skips uncurated, skips invalid qty, undefined at zero-qualifying | `walmartLinks.test.ts` TC-CART-001–008, TC-CART-N01–N03 | **Y** — click-through must load a real, correct Walmart cart page (logic itself fully unit-tested) | Automated: Pass. Manual: Pending (MUAT-02) |
| FR-03 | `buildSearchUrl(itemName)` always returns defined URL, handles special chars/unicode/empty | `walmartLinks.test.ts` TC-SEARCH-001–005, TC-SEARCH-N01–N02 | N (encoding logic fully covered; optional light spot-check during MUAT-03) | Automated: Pass |
| FR-04 | Cart button renders only when coverage>0, shows "N of M", opens new tab, href exact, hidden at M=0 or curated=0 | `GroceryListView.test.tsx` TC-GLV-001–008 | **Y** — visual appearance/count accuracy and hidden state in a rendered browser (MUAT-01, MUAT-04) | Automated: Pass. Manual: Pending |
| FR-05 | Zero references to Marketplace/Supplier OAuth or I/O Affiliate RSA APIs; zero credentials in source/bundle | None (not unit-testable; static code property) | **Y** — `git grep` source inspection + built-bundle scan | Manual: Pending (MUAT-09) |
| FR-06 | Per-item Search link on every line, opens `buildSearchUrl`, muted styling, is the fallback if cart ID stale | `GroceryListView.test.tsx` TC-SL-001–005 | **Y** — visually confirm every rendered line has a working link (MUAT-03) | Automated: Pass. Manual: Pending |
| FR-07 | README documents Impact Radius prerequisite honestly, no false enrollment claim, no fabricated tracking ID | None (documentation content) | **Y** — README review | Manual: Pending (MUAT-10) |
| FR-08 | Cart button renders regardless of affiliate approval status (no gating flag); search link is required fallback | `GroceryListView.test.tsx` TC-GLV (no-gating-flag case) | **Y** — confirmed implicitly by MUAT-01/MUAT-05 | Automated: Pass. Manual: Pending |
| NFR-01 | No server/backend introduced; static-only, GitHub Pages deployable | None (architectural property) | N — confirmed by architecture review (Stage 4), reconfirm via `npm run build` producing static output only | Assumed satisfied; light re-check in Phase 2 |
| NFR-02 | No secrets/credentials/API keys in source or built bundle | None | **Y** — `git grep` + scan `dist/` bundle after `npm run build` | Manual: Pending (MUAT-09) |
| NFR-03 | `walmartLinks.ts` pure, framework-free (no React import), unit-testable in isolation | Implicit in `walmartLinks.test.ts` running without React/DOM setup | N (proven by the test file itself running standalone) | Automated: Pass |
| NFR-04 | New UI elements reuse existing design tokens, no new ad hoc visual language | None (CSS content) | **Y** — source inspection of `styles.css` (TC-CSS-001,002,003) already done by dev; QA re-confirms | Manual: Pending (MUAT-09) |
| NFR-05 | Unit coverage for every branch of `walmartLinks.ts` + `purchaseUnits.ts` data-integrity guard | `walmartLinks.test.ts` (26 tests), `purchaseUnits.test.ts` (10 tests) | N — fully automated | Automated: Pass |
| NFR-06 | No hard cap on cart URL length; accepted/documented risk, not gated this release | None — informational only | N — no test required, note accepted-risk status only | N/A — accepted risk, documented |
| NFR-07 | `target="_blank"` cart link must not be sole path if popup/tab blocked; visible fallback must exist | None (runtime browser/popup-blocker behavior not unit-testable) | **Y** — empirical check: does a plain `<a target=_blank>` anchor get blocked by this browser/extension combo, and is the per-item search link (FR-06) a visible working fallback if it does | Manual: Pending (MUAT-05) — **flag architecture discrepancy, see note below** |

**Note on NFR-07 architecture discrepancy:** The dev team implemented the cart action as a single `<a href target="_blank">` anchor rather than a scripted `window.open()` call, reasoning that a plain anchor click is generally not subject to the same popup-blocker suppression as scripted opens. This is a reasonable engineering choice but is **not the same thing** as NFR-07's literal wording, which anticipates a blocked-popup scenario and requires a visible fallback in that case. QA must not rubber-stamp this as "N/A because it's an anchor" — MUAT-05 requires an empirical check in the actual test browser/extension configuration of whether blocking occurs and, if it somehow does, whether the FR-06 search link is genuinely visible and clickable as the fallback.

**Note on automated test count:** The task brief states "147 unit/component tests" as the reference figure for this plan. The most recent dev stage notes (`story-5.md`) report 146/146 total after `GroceryListView.test.tsx` landed (133 after `walmartLinks.test.ts` per `story-4.md`, +13 in Story 5 = 146). This plan uses 146 as the last-verified-in-dev-notes figure and flags the 147-vs-146 gap for the record; Phase 1 (automated regression confirmation) will re-run `npm test` and report the actual current count rather than assuming either figure is current. No explanation for the discrepancy is fabricated here — possible causes (an added CSS/lint check, an additional case since Story 5) are unconfirmed.

#### Automation vs Manual Summary

| Coverage type | What it proves | What it cannot prove |
|---|---|---|
| Automated (~146-147 tests, Vitest + Testing Library) | Every branch of `buildCartUrl`/`buildSearchUrl` (FR-02/FR-03), all render/hidden states and href-exactness of the cart button and search links (FR-04/FR-06), data-integrity of the 8 curated staple IDs' format and non-collision (FR-01), `purchaseUnits`/`groceryList` regression stability | Whether a real browser actually opens a real, correct Walmart page; whether a popup blocker intervenes; how the UI actually looks in dark mode or under keyboard focus; whether the 7 non-verified product IDs correspond to the correct real products |
| Manual (this UAT plan, `npm run dev` + real browser + real network) | Live Walmart cart/search URL resolution, popup-blocker interaction and fallback visibility, dark-mode visual rendering, focus-visible outline rendering, human product-page spot-checks of unverified data, source-level absence of secrets/OAuth references and README honesty | N/A — manual scope is intentionally narrow and does not re-derive logic already proven by automation |

In short: automation fully covers pure-function and component-render correctness; manual UAT covers exactly the slice of runtime/browser/network/visual behavior that unit tests structurally cannot reach.

#### Manual UAT Test Cases

**MUAT-01 — Cart button appears with accurate coverage count**
- Type: Functional
- Priority: Critical
- Preconditions: `npm run dev` running; app loaded in browser; grocery list contains a mix of curated (e.g., chicken breast, eggs) and uncurated items.
- Steps:
  1. Navigate to the grocery list panel with items present.
  2. Observe the "Add all to Walmart cart" button in the header.
  3. Read the coverage text (e.g., "N of M items").
  4. Manually count curated vs. total items on the visible list.
- Expected Result: Button is visible; coverage text numerator matches the count of items with a curated `walmartItemId` present, denominator matches total list item count; counts match manual count exactly.
- Test Data: Grocery list with at least 3 curated staples and at least 2 uncurated items.
- Traceability: FR-04; technical-plan step 1; PRD Timeline manual step "cart button appears with accurate count."

**MUAT-02 — Click opens correct real Walmart cart**
- Type: Functional (E2E, live integration)
- Priority: Critical
- Preconditions: Same list as MUAT-01; real network access to affil.walmart.com.
- Steps:
  1. Note the exact curated items and quantities expected in the cart (per `buildCartUrl` logic: `purchase.quantity` or ceil(quantity), floored to 1 if positive fractional).
  2. Click "Add all to Walmart cart."
  3. Observe the new tab that opens.
  4. Compare the URL opened to the expected `buildCartUrl` output format and confirm it targets `affil.walmart.com/cart/addToCart`.
  5. Confirm Walmart's page loads without an error and reflects the expected item IDs/quantities in the cart (to the extent Walmart's UI displays them without completing checkout).
- Expected Result: New tab opens to the exact URL `buildCartUrl` would generate for this item set; Walmart's cart page loads successfully (no 404/error) and shows the expected items; no purchase/checkout is completed.
- Test Data: Same curated list as MUAT-01, with known expected quantities.
- Traceability: FR-02, FR-04; technical-plan step 2; PRD Timeline manual step "click opens correct Walmart cart."

**MUAT-03 — Every grocery-list line has a working Search link**
- Type: Functional
- Priority: High
- Preconditions: Grocery list with both curated and uncurated items, including at least one item with special characters or multi-word name.
- Steps:
  1. For each line in the grocery list (curated and uncurated), locate the small "Search" link.
  2. Click the Search link on a curated item.
  3. Click the Search link on an uncurated item.
  4. Click the Search link on an item with special characters/spaces in its name.
- Expected Result: Every line — regardless of curation status — has a visible, clickable Search link; each opens `https://www.walmart.com/search?q=<encoded name>` in a new tab; the Walmart search results page loads and the query reflects the item name; this remains true even for items whose cart ID might be stale/delisted (this is the mandated fallback per FR-06/FR-08).
- Test Data: List including a curated staple, an uncurated item, and an item like "1% low-fat milk (2%)" to check encoding of special characters live.
- Traceability: FR-06, FR-08; technical-plan step 3; PRD Timeline manual step "every line has a working search link."

**MUAT-04 — Button and coverage text fully hidden at zero-item and zero-curated states**
- Type: Functional, negative/boundary
- Priority: High
- Preconditions: Ability to produce (a) an empty grocery list (M=0), and (b) a grocery list with items but none curated (curated count=0, M>0).
- Steps:
  1. Clear the grocery list to empty. Observe the header area where the cart button normally appears.
  2. Repopulate the list with only uncurated items (no curated staples).
  3. Observe the header area again.
- Expected Result: In both scenario (a) empty list and (b) zero-curated-with-items, the "Add all to Walmart cart" button is completely absent from the DOM/visible UI, and no coverage text ("0 of 0" or "0 of N") is shown either — not merely disabled or hidden via CSS with lingering text.
- Test Data: Scenario A: empty grocery list. Scenario B: grocery list containing only items with no `walmartItemId`.
- Traceability: FR-04; technical-plan step 4; PRD Timeline manual step "button hides fully at zero coverage"; Devops deploy-plan.md Release-Readiness Check #4.

**MUAT-05 — Popup-blocked fallback confirmed clickable**
- Type: Functional, negative
- Priority: Critical
- Preconditions: A browser/extension configuration capable of blocking popups or new-tab opens from anchor clicks (e.g., a strict popup blocker extension enabled, or browser popup-blocking setting turned on) available for the test; grocery list with curated items.
- Steps:
  1. Enable the strictest popup-blocking configuration available in the test browser.
  2. Click "Add all to Walmart cart."
  3. Observe whether the new tab opens or is suppressed/blocked by the browser/extension.
  4. Regardless of outcome in step 3, locate the per-item Search links on the grocery list.
  5. Confirm the Search links remain visible and clickable, and that clicking one still opens the search results (not blocked, or if blocked, note that too).
  6. Document empirically: did this configuration ever block the plain `<a target="_blank">` cart click? If yes, was a visible working fallback present at that moment?
- Expected Result: Either (a) the anchor click is not blocked by common browser/extension popup blockers (supporting the dev team's design rationale), in which case document this as verified evidence rather than assumption; or (b) if blocking does occur, the per-item Search link(s) must be visibly present and clickable as the required fallback per NFR-07 — the action must never silently no-op with no visible recourse.
- Test Data: Same curated list as MUAT-01; at least one popup-blocking browser extension/setting.
- Traceability: NFR-07 (flagged architecture discrepancy — anchor vs. window.open — verify empirically, do not rubber-stamp); technical-plan step 5; PRD Timeline discrepancy note (PRD text omits this step from its own 4-item summary despite claiming "5" — technical plan list is authoritative, see discrepancy note below).

**MUAT-06 — Human spot-check of 7 non-verified `walmartItemId` values**
- Type: Functional, data-integrity (live verification)
- Priority: Critical
- Preconditions: List of the 8 staple items and their `walmartItemId` values from `src/data/purchaseUnits.ts`; real network access to walmart.com.
- Steps:
  1. For each of the 7 non-verified staples (all except eggs=145051970, already live-spike-verified in story-1.md) — chicken breast, olive oil, garlic, onion, brown rice, canned tuna, greek yogurt — construct the URL `https://www.walmart.com/ip/.../<walmartItemId>`.
  2. Open each URL in a browser.
  3. Confirm the product page loads (not a 404/removed-listing page).
  4. Confirm the product shown genuinely matches the ingredient it's mapped to (e.g., the ID for "chicken breast" actually resolves to a chicken breast product, not an unrelated item).
- Expected Result: All 7 IDs resolve to live, existing Walmart product pages that reasonably match their mapped ingredient name. Any ID that 404s, redirects to an unrelated product, or resolves to a delisted item is a blocking defect requiring a corrected ID before production sign-off.
- Test Data: The 7 `walmartItemId` values currently in `src/data/purchaseUnits.ts` for chicken breast, olive oil, garlic, onion, brown rice, canned tuna, greek yogurt.
- Traceability: FR-01; story-1.md "Action required before shipping to production" note.

**MUAT-07 — Dark-mode visual rendering of new UI elements**
- Type: Non-functional (visual/UX)
- Priority: Medium
- Preconditions: App running via `npm run dev`; OS/browser set to dark color-scheme, or app's dark-mode toggle (if present) engaged.
- Steps:
  1. Switch to dark mode.
  2. Observe the "Add all to Walmart cart" button styling (background, text contrast, borders).
  3. Observe the coverage count text ("N of M items") styling.
  4. Observe the per-item Search link styling on grocery list lines.
- Expected Result: All three elements render legibly with sufficient contrast in dark mode, using the existing design token dark-mode overrides (no unstyled/invisible/clashing elements); consistent with TC-CSS-005's source-inspection finding that no new dark-mode selector was needed because tokens already have dark overrides — confirm that holds true visually.
- Test Data: N/A (visual inspection).
- Traceability: NFR-04; Story 6 dev notes (TC-CSS-005 visual half deferred pending Story 5 markup, now ready).

**MUAT-08 — Focus-visible outline on cart button (keyboard navigation)**
- Type: Non-functional (accessibility)
- Priority: Medium
- Preconditions: App running via `npm run dev`; grocery list populated with curated items so the cart button renders.
- Steps:
  1. Using only the keyboard (Tab key), navigate focus through the grocery list panel until the "Add all to Walmart cart" button receives focus.
  2. Observe whether a visible focus-visible outline/ring appears on the button.
  3. Repeat for a per-item Search link.
- Expected Result: A clearly visible focus-visible outline appears on both the cart button and Search links when reached via keyboard, meeting basic keyboard-accessibility expectations; outline uses existing design tokens, not an ad hoc style.
- Test Data: N/A (keyboard interaction).
- Traceability: NFR-04; Story 6 dev notes (TC-CSS-004, deferred pending rendered markup, now ready with Story 5 landed).

**MUAT-09 — Source inspection: no secrets, no OAuth/RSA references, CSS token reuse**
- Type: Functional/security, source-review
- Priority: Critical
- Preconditions: Repo checked out at the release commit; `npm run build` producing a `dist/` bundle.
- Steps:
  1. Run `git grep -i` for terms: "oauth", "supplier", "marketplace", "rsa", "signing", "affiliateId", "secret", "apikey", "api_key" across `src/` and `dist/`.
  2. Manually review any hits for false positives vs. genuine leaked credentials or forbidden API references.
  3. Review `src/styles.css` additions for `.walmart-cart-button`, `.walmart-coverage-count`, `.grocery-item__search-link` — confirm only existing design tokens are referenced, no new hardcoded colors/spacing values.
  4. Confirm `walmartLinks.ts` contains no `import React` or JSX.
- Expected Result: Zero matches for OAuth/Marketplace-Supplier/RSA-signing API references; zero credentials/secrets/API keys found in source or built bundle; new CSS rules use only existing custom-property tokens; `walmartLinks.ts` remains framework-free.
- Test Data: Full repo source tree at release commit; built `dist/` output.
- Traceability: FR-05, NFR-02, NFR-03, NFR-04.

**MUAT-10 — README honesty review (Impact Radius prerequisite)**
- Type: Functional, documentation review
- Priority: High
- Preconditions: Current `README.md` at release commit.
- Steps:
  1. Locate the section documenting the Walmart cart integration / affiliate prerequisite.
  2. Confirm it states the Impact Radius affiliate-program enrollment as a prerequisite for the `addToCart` endpoint to function as intended.
  3. Confirm it does not falsely claim current enrollment/approval.
  4. Confirm no fabricated tracking/affiliate ID is present anywhere in the README.
- Expected Result: README wording is honest about the unresolved enrollment status, does not overstate readiness, and contains no fabricated IDs.
- Test Data: N/A (document review).
- Traceability: FR-07; PRD OQ-1/OQ-5 (related open item, see Risks section).

**PRD "5 steps" discrepancy note:** The PRD's Timeline section (§10, "Manual verification pass" row) states "All 5 manual-verification steps from the technical plan pass" but then textually enumerates only 4 clauses: cart button accurate count, click opens correct cart, working search links, button hides at zero coverage. It omits the popup-blocked-fallback clause that IS present as the 5th item in the technical plan's actual list (`.delivery/artifacts/05-plan/qa/test-strategy.md`, line 47). This is flagged here as a documentation inconsistency in the PRD, not silently reconciled — this UAT plan treats the technical plan's 5-item list (MUAT-01 through MUAT-05) as authoritative, since NFR-07 explicitly requires the popup-fallback behavior to be verified.

### Entry / Exit Criteria

**Entry Criteria:**
- Stage 6 development complete; code merged to a UAT-candidate branch or `main`.
- All 146+ automated unit/component tests pass (`npm test` green); actual count reconciled against the 146/147 discrepancy and recorded.
- `npm run dev` environment available with real network access to walmart.com and affil.walmart.com (cannot be sandboxed/CI-run).
- Test data available: a grocery list configurable to produce all-curated, mixed, zero-curated, and empty states.
- Access to a browser with a popup-blocking extension/setting for MUAT-05.
- Acceptance criteria (FR-01–08, NFR-01–07) are unambiguous and available (this document's checklist).

**Exit Criteria:**
- All 10 manual UAT test cases (MUAT-01–10) executed with results recorded.
- Zero open Critical or High severity defects; any Medium/Low defects documented with accepted risk and owner.
- All 8 staple `walmartItemId` values confirmed to resolve to correct, live Walmart product pages (0 of 8 failing) — this is a hard blocker per story-1.md.
- FR-05/NFR-02 source inspection finds zero secrets/OAuth references (0 found) — hard blocker.
- Automated regression suite passes at 100% with no new failures introduced since Stage 6.
- NFR-07 popup-fallback behavior empirically verified with a documented outcome (not assumed).
- Open items requiring Product Owner input (Impact Radius enrollment status, PRD OQ-1/OQ-5) explicitly escalated and acknowledged by PO — QA does not block sign-off solely on these being unresolved, but does require they are visibly flagged rather than silently passed through.
- Sign-off obtained from QA lead and Product Owner.
- If any exit criterion is not met but the team chooses to proceed, the residual risk must be explicitly documented and accepted by the PO — testing is not stopped solely for a deadline without this documentation.

### Risks and Mitigations

| Risk | Mitigation |
|---|---|
| 7 of 8 `walmartItemId` values are dev's best-effort/model-recalled IDs, not independently browser-verified; a wrong ID could add the wrong product to a customer's real cart | MUAT-06 mandates human verification of all 7 before production sign-off; treat any failure as a blocking defect, not a follow-up item |
| Impact Radius affiliate enrollment status and ToS-compliance question (PRD OQ-1/OQ-5) remain unresolved at UAT stage | Escalate explicitly to Product Owner in this plan's sign-off section; QA documents the open item rather than attempting to resolve or silently pass it |
| NFR-07 implemented via plain `<a target=_blank>` instead of `window.open()`, a discrepancy from the requirement's literal framing of a "popup-blocked" scenario | MUAT-05 requires empirical verification (does this browser/extension combo actually block it, and is the fallback visible if so) rather than accepting the dev team's rationale at face value |
| Live Walmart pages/IDs can change or be delisted after UAT completes but before/after production release | FR-06 per-item Search link is the mandated permanent fallback; note in sign-off that MUAT-06 findings are a point-in-time snapshot, not a permanent guarantee |
| Manual tests require real network access to a third-party site (walmart.com) not under this team's control, introducing external flakiness/unavailability risk to the test schedule | Schedule Phase 3-5 with buffer time (see Test Schedule); if Walmart is unreachable during the window, document as a schedule risk and reschedule rather than skipping the check |
| 146 vs. 147 automated test count discrepancy between story notes and task brief could mask an uncounted or newly-added test not covered by this plan's checklist | Phase 1 re-runs `npm test` and records the actual current count/pass rate before manual testing begins, rather than trusting either historical figure |
| No hard cap on cart URL length (NFR-06) could theoretically produce an unusably long URL for very large curated lists | Accepted as documented, non-blocking risk per PRD; no test required this release, but flagged here for visibility into future regression if cart URL length issues are ever reported |

### Sign-Off

**Approvers:** QA Lead (execution and defect triage sign-off), Product Owner (business acceptance and disposition of open items: Impact Radius enrollment status, any accepted residual risk).

**Evidence required for sign-off:**
- Completed MUAT-01–10 execution records (pass/fail, evidence — e.g., screenshot of the real Walmart cart page loaded, screenshot of dark-mode/focus-visible rendering).
- `npm test` output showing final automated pass count and 0 failures.
- `git grep` output from MUAT-09 showing zero matches for forbidden terms.
- Explicit disposition (resolved / accepted-risk / escalated) for: 7 unverified `walmartItemId` values, Impact Radius enrollment open question, NFR-07 empirical popup-fallback finding.
- This document's FR/NFR checklist with every row's Status column marked Pass, Fail, or Accepted-Risk (with owner) — no row left blank at sign-off time.

### Shared-Module Review

**Shared modules identified**: 4

Scanned `.delivery/artifacts/01-idea` through `07-uat` (56 artifact files) for file-path/name references. A module counts as shared when referenced across 2+ distinct stage directories. All four below clear that bar by a wide margin (8-9 stages each) — this feature touches a small, tightly-coupled cluster (grocery list aggregation, purchase-unit data, cart-link building, list UI), not a sprawl of shared dependencies.

| Module Path | Stages Referencing | Modified in Dev | Test Coverage | Status |
|---|---|---|---|---|
| `src/lib/groceryList.ts` | 01-idea, 02-refine, 04-architect, 05-plan, 06-dev, 07-uat (14 files total) | Yes — added `purchase` field wiring + `computePurchaseQuantity` | `src/lib/groceryList.test.ts` — 13 tests covering summing, section grouping, case-insensitive dedup, volume normalization, shoppingName aggregation, real-card aggregation, `computePurchaseQuantity` boundary/negative cases, and purchase-quantity wiring (present/absent in `PURCHASE_UNITS`) | PASS |
| `src/data/purchaseUnits.ts` | 01-idea, 02-refine, 04-architect, 05-plan, 06-dev, 07-uat (21 files total) | Yes — added `walmartItemId` field to `PurchaseUnitEntry` and populated 8 staples | `src/data/purchaseUnits.test.ts` — 12 tests: format/collision guard (TC-PU-001–007, TC-PU-N01–N03) covering empty ID, non-digit ID, whitespace-only ID, leading-zero preservation, trailing-space key collision, case-only key collision, and the 8-staple non-empty-ID requirement | PASS |
| `src/lib/walmartLinks.ts` (new file, but referenced across the same 8-9 stages as an anchor for the other three) | 01-idea, 02-refine, 03-design, 04-architect, 05-plan, 06-dev, 07-uat (23 files total) | Yes — new module this feature | `src/lib/walmartLinks.test.ts` — TC-CART-001–008, TC-CART-N01–N03, TC-SEARCH-001–005, TC-SEARCH-N01–N02 (26 tests per test-plan's own count) | PASS |
| `src/components/GroceryListView.tsx` | 01-idea, 02-refine, 03-design, 04-architect, 05-plan, 06-dev, 07-uat (24 files total) | Yes — cart button, coverage text, per-item search links added | `GroceryListView.test.tsx` — TC-GLV-001–008 (render/hidden states, coverage count, href-exactness) + TC-SL-001–005 (per-item search link states) | PASS |

**Special-attention modules — pre-existing, cross-feature shared:**

- **`groceryList.ts`**: pre-exists from the original grocery-list feature; this pipeline run only added the `purchase` field and `computePurchaseQuantity`. The original consuming context (grocery-list rendering/aggregation, exercised by the pre-existing summing/grouping/dedup/volume tests above) is still covered by the same test file — those tests were not removed or weakened, and the new purchase-quantity tests were added alongside them rather than replacing them. No evidence in dev-stage artifacts (`story-1.md` through `story-6.md`) that any pre-existing test was deleted or skipped to accommodate the new field. Integration impact: `computePurchaseQuantity` is additive (new optional `purchase` field on `GroceryItem`), consumers reading `GroceryItem.name/quantity/unit/sourceCards` without `purchase` are unaffected.
- **`purchaseUnits.ts`**: pre-exists from the prior purchase-quantity feature; this run added `walmartItemId` as an *optional* field. `purchaseUnits.test.ts` explicitly tests both branches — entries with the field (staples, TC-PU-002/003) and entries without it (TC-PU-001, "leaves entries without walmartItemId valid and unaffected"). This directly verifies the prior feature's consuming context (purchase-quantity lookups that don't know about `walmartItemId`) is undisturbed. Integration impact: additive optional field, `PurchaseUnitEntry.unitLabel/packageSize/packageUnit` shape and semantics unchanged, so `groceryList.ts`'s `computePurchaseQuantity` (its only consumer) needed no changes to its own logic beyond passing the entry through.

**Findings**: No gaps. All four shared modules have test coverage for every consuming context referenced in the artifacts, including the pre-existing consuming contexts for `groceryList.ts` and `purchaseUnits.ts` from prior features. One naming caveat: `walmartLinks.ts` is new-to-this-feature (not pre-existing), so its "shared" status here reflects cross-stage documentation references within this single pipeline run, not cross-feature reuse like the other two — included for completeness since it meets the 2+-stage definition. Recommend MUAT-06 (live `walmartItemId` spot-check) and MUAT-09 (source inspection) remain the gating manual checks for `purchaseUnits.ts` and `walmartLinks.ts` respectively, per the FR/NFR checklist above; no additional shared-module-specific manual test is needed beyond what's already scheduled.
