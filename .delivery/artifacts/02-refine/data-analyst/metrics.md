## Metrics Definition: Walmart Cart Integration for the Grocery List

### Constraint Statement

MealPlanSite is a static GitHub Pages site, no backend, no analytics wired up (per PRD Out of Scope: "Analytics/telemetry on cart-button usage, click-through, or conversion. No backend exists to collect it, and none is added for this feature."). All metrics below are either (a) build-time/manual-review checks against source and rendered output, or (b) explicitly flagged as requiring a lightweight client-side analytics addition NOT currently in scope. No metric assumes a data warehouse, event pipeline, or server log.

### North Star Metric

**Metric:** Curated Coverage Rate
**Definition:** Share of a rendered grocery list's line items that carry a `walmartItemId` and therefore qualify for one-click add-to-cart, versus falling back to search-only.
**Formula:** `curated_items_with_walmartItemId / total_grocery_list_items` for a given rendered list, surfaced by the "N of M items" UI text (FR-04).
**Target:** No fixed numeric target at launch (PRD sets no coverage-% target, only that the count displayed must be accurate). Track directionally: coverage should not decrease release-over-release as `PURCHASE_UNITS` grows, since new entries added without a `walmartItemId` dilute the ratio.
**Observability:** Manual/build-time. Compute by counting `walmartItemId`-populated entries in `src/data/purchaseUnits.ts` (23 entries at PRD time, priority staples listed in FR-01) versus total entries. No runtime instrumentation needed — this is a static-data count, re-derivable from source at any commit.

### Supporting Metrics

| Metric | Definition | Formula | Source | Owner | Cadence | Target |
|--------|-----------|---------|--------|-------|---------|--------|
| Functional correctness (cart URL) | Cart deep link opens with correct items/quantities for a curated-only, mixed, and zero-curated list | Manual test per acceptance criteria in FR-02/FR-04, or unit test assertions (NFR-05) | Unit tests + manual `npm run dev` verification | Engineering | Per PR / pre-release | 100% of test cases pass, 0 known regressions |
| Functional correctness (search fallback) | Every grocery-list line, curated or not, has a working per-item Search link | Manual inspection of rendered `GroceryListView.tsx` output against FR-06 AC | Manual verification pass (PRD Timeline milestone) | Engineering / QA | Pre-release, then spot-check per release | 100% of lines have a working link |
| Coverage-count accuracy | Displayed "N of M items" matches actual curated-vs-total ratio for the rendered list | Compare UI text to source-derived count for a known test list | Manual verification / unit test | Engineering | Per PR touching `GroceryListView.tsx` or `purchaseUnits.ts` | Exact match, 0 discrepancy |
| Secret/credential leakage | Zero API keys, tokens, or affiliate IDs committed to source or present in built bundle | Repo + bundle grep/review against NFR-02, FR-05, FR-07 | `git grep` for credential patterns + manual review of `dist/` build output | Engineering | Pre-release, and on any change touching `walmartLinks.ts` | 0 secrets found |
| `walmartItemId` staleness | Age since last hand-verification of each curated ID against a live `walmart.com/ip/.../<ID>` page | Manual spot-check log (date last verified per staple item) | Manual curation log (not currently a tracked artifact — see Open Question below) | Product Owner / whoever maintains `purchaseUnits.ts` | Ungoverned per PRD OQ-4 unless a cadence is set | No target set; PRD explicitly leaves this ungoverned pending OQ-4 |
| Impact Radius affiliate status | Whether the deployed site currently holds Impact Radius affiliate approval (governs whether the cart link is a legitimate production integration vs. best-effort) | Binary status, tracked outside the codebase | Site operator's affiliate-program account (external, not observable from repo) | Site operator | Check before Stage 7 UAT sign-off per PRD OQ-1 | Approved, or README explicitly states "affiliate-pending" |

### Flagged: Metrics That Would Require a Client-Side Analytics Addition (Not In Scope This Release)

These would be true usage/adoption/conversion metrics — the kind a HEART or AARRR framework would normally call for — but PRD Out of Scope explicitly excludes analytics/telemetry for this feature. Listed here so a future release can pick them up if a lightweight client-side analytics tool (e.g., a privacy-respecting static-site analytics script, or a serverless log-collection endpoint) is ever added. None of these are buildable today without that addition.

| Metric | Definition | Why it needs instrumentation |
|--------|-----------|-------------------------------|
| Cart-button click-through rate | % of sessions with ≥1 curated item where the "Add all to Walmart cart" button is clicked | Requires a click event capture; no telemetry pipeline exists today |
| Search-link usage rate | % of grocery-list sessions where at least one per-item Search link is used | Same — requires client-side event capture |
| Cart-link failure/rejection rate | % of cart-button clicks where Walmart rejects the deep link (e.g., due to lack of affiliate approval) | Client has no way to observe what happens after the new tab opens (per PRD Out of Scope) even with analytics added client-side; would need Walmart-side reporting, which is outside this project's control entirely |
| Downstream purchase conversion | % of cart-button clicks that result in a completed Walmart purchase | Fully outside MealPlanSite's visibility; would require Walmart-side attribution data (e.g., via Impact Radius affiliate reporting dashboard, not app instrumentation) — the closest real proxy for this is the affiliate network's own conversion reporting, available only after Impact Radius approval (PRD OQ-1) |

### Dashboard Requirements

No dashboard is proposed for this release — there is no data pipeline to feed one, and the PRD explicitly rules out adding telemetry for this feature. In place of a dashboard, success is verified through:
1. The PRD's own Goals & Success Metrics table (functional gates, checked at PR review and pre-release manual verification).
2. The PRD Timeline's "Manual verification pass" milestone (Stage 7 / UAT), which runs the 5 manual-verification steps listed there.
3. If Impact Radius affiliate approval is later obtained, that network's own affiliate dashboard becomes the first real usage/conversion data source available to this project — external to MealPlanSite, not something this feature builds or owns.

### Open Questions

- Should a lightweight, backend-less client-side analytics addition (e.g., a static-site analytics snippet) be scoped for a future release specifically to capture cart-button click-through and search-link usage rate? Not decided in the PRD; flagged here as a prerequisite for any of the "Flagged" metrics above. Owner: Product Owner.
- No cadence exists for re-verifying `walmartItemId` staleness (PRD OQ-4, explicitly left ungoverned unless a cadence is set before Stage 5 Plan). If this pipeline reaches Stage 5 without a decision, staleness will remain untracked and unmeasured indefinitely.
- Impact Radius affiliate approval status (PRD OQ-1) is the single external gate on whether any real conversion/usage metric will ever be observable for this feature, since the affiliate network is the only party with visibility past the point Walmart's cart page opens.

### Downstream Notes

All metrics here are verification gates or manual-review checks, consistent with the PRD's statement that "success is verified functionally (acceptance criteria + manual verification) rather than measured post-launch." QA/test planning (Stage 4/6) should treat the Supporting Metrics table above as its acceptance-test checklist input. No analytics instrumentation work should be scheduled against this release unless the Open Question on a client-side analytics addition is explicitly resolved.
