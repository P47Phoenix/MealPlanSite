# Adversarial Challenge — Walmart Cart Integration PRD

**Role:** Challenger (QA, adversarial review)
**Target:** `.delivery/artifacts/02-refine/po/prd.md` + `constraints.yml`
**Verdict:** confidence 2/5 — material gap found, flag for human escalation.

---

## 1. Foundational blocker: the deep-link mechanism itself is unverified

FR-02 / constraints.yml specify the cart URL format as:

```
https://affil.walmart.com/cart/addToCart?items=ID|QTY,ID2|QTY2
```

No publisher ID, campaign ID, affiliate tag, or credential appears anywhere in that format. But FR-05/FR-07/FR-08 all assert the endpoint is "restricted to Impact Radius affiliate publishers" and gated by "publisher-eligibility policy." Those two claims don't fit together:

- If Walmart enforces the restriction, it needs *something* in the request to identify the publisher — a query param, a referrer check tied to a registered domain, a required cookie set by Impact Radius's own redirect chain. The PRD's URL format has none of that.
- If the URL genuinely needs no publisher identifier to function, then it's unclear what "restricted to affiliate publishers" even means mechanically, or why FR-07/FR-08 exist at all.

No source is cited — no Walmart/Impact Radius doc link, no working example, no spike output — proving this endpoint exists, is live in 2026, or accepts this exact parameter shape. The entire feature is built on an assumption nobody has verified end-to-end (open a browser, hit the real URL, watch an item land in a real cart). Constraints.yml calls this "the only viable cart-building mechanism," but "only viable" and "confirmed to work" are different claims, and the PRD treats them as the same thing.

This is not a nitpick — if the URL format is wrong or the endpoint requires a param the PRD doesn't have, FR-02 through FR-04, FR-08, and the whole North Star metric (Curated Coverage Rate) point at a mechanism that may not exist as described. Everything downstream (8 dev stories, unit tests, README claims) gets built against an unconfirmed contract.

**Missing requirement:** a Stage-2/3 spike — manually construct the URL against a real product ID and confirm in a real browser session that an item actually appears in a Walmart cart — before story decomposition locks in the format.

## 2. Legal/ToS risk is described as purely technical, understated

FR-08 and the risk table treat "Walmart rejects the link" as a graceful-degradation UX problem, solved by the search fallback. That undersells the actual exposure:

- Sending traffic through an affiliate-restricted endpoint *without* affiliate approval, if that's what's happening, may violate Walmart's or Impact Radius's terms of service — not just "fail silently," but potentially flag the domain, jeopardize future approval eligibility, or draw a cease-and-desist. None of that is in the Dependencies & Risks table.
- The PRD's framing ("may function or may be rejected... MealPlanSite has no way to detect that") is presented as a technical unknown. It's also a compliance unknown, and the PO has not asked Legal/ToS-review questions at all — OQ-1 only asks about pursuing approval, not about whether shipping pre-approval is itself against Walmart's terms.

**Gap:** no requirement or open question addresses "is it a ToS violation to use this endpoint before approval is granted," only "will it work."

## 3. Value proposition given hand-curation is weaker than claimed

FR-01's minimum bar is 8 curated staples out of 23 `PURCHASE_UNITS` entries, and the grocery list itself can include ingredients beyond those 23 (anything not covered by `PURCHASE_UNITS` presumably falls through to text-only, un-curated — the PRD doesn't say how large that set is). A realistic weekly list of, say, 20 items might see "8 of 20" or worse — a minority of the list actually gets one-click add. The "N of M" honesty framing is good, but the PRD never asks whether a coverage rate this low is even worth shipping, or sets any target/threshold for "this feature is worth using now." Section 3 explicitly declines to set a numeric target ("no fixed numeric target at launch"), which means there's no defined bar for "did this deliver value," only "does it function." A feature can pass every AC in this PRD and still be a curiosity nobody uses because coverage rounds to "search everything yourself anyway."

## 4. Staleness has no owner or cadence — coverage rate will silently rot

OQ-4 (staleness cadence) is explicitly left "ungoverned pending" resolution, and Out of Scope forbids any automated check. The North Star metric explicitly says "track directionally so coverage does not regress" — but nothing in the FRs, NFRs, or dependencies actually prevents regression; there's no test, no CI check, no scheduled reminder. A single-maintainer hobby project with no cadence and no automation is, empirically, a project where curated IDs go stale and nobody notices until a user hits a dead cart link. FR-06's search fallback catches the user-facing symptom, but the PRD's own success metric (coverage not regressing) has zero enforcement mechanism behind it.

## 5. Edge cases not addressed

- **URL length limits:** `buildCartUrl` concatenates all curated items into one query string. A large curated list (as `PURCHASE_UNITS` grows per the stated goal of coverage increasing over time) could produce a URL exceeding browser/server URL length limits. No AC or NFR bounds this.
- **Popup/tab-blocking:** `window.open`-style `target="_blank"` triggered from a button click is normally exempt from popup blockers, but the PRD doesn't specify what happens if a browser blocks it anyway (some extensions/strict settings do) — no fallback UX (e.g., a visible link as backup) is required.
- **Duplicate/near-duplicate ingredient keys:** two distinct grocery items that normalize to the same lowercased/trimmed key would collide in `PURCHASE_UNITS` lookup. Not called out as a test case despite NFR-05 asking for a "data-integrity guard test" that only checks digit-string format, not key collisions.
- **Package-size drift:** curation verifies that a `walmartItemId` exists and is a real product page, not that the product's actual pack size still matches what `computePurchaseQuantity` assumes (e.g., "1 dozen eggs" ID later becomes an 18-count listing). Quantity correctness silently drifts even while the ID itself stays "valid." No AC covers this class of staleness distinct from delisting.
- **Quantity ceiling/sanity bound:** the fallback chain floors at 1 but has no upper bound — a data or logic bug upstream producing an absurd quantity (e.g., 500) would be passed straight into the cart URL with no sanity check.

## 6. "No backend, no secrets" constraint — holds up, but only because scope was cut hard to fit it

Worth confirming explicitly since it's asked: this constraint is internally consistent. Every rejected path (Marketplace/Supplier OAuth, I/O Affiliate RSA-signing, Instacart Bearer token, Data Feed API) genuinely requires a server-held secret, and the PRD correctly excludes all of them. The one surviving mechanism is the only one that avoids secrets — which is exactly why point 1 above matters so much: the entire feature's existence depends on that one mechanism actually working as described, unverified.

---

## Confidence Rating: 2/5

**Rationale:** the PRD is well-organized, internally cross-referenced, and honest about scope trade-offs (Out of Scope section is unusually rigorous) — that's real strength. But it rests on an unverified technical premise (point 1) that, if wrong, invalidates FR-02 through FR-04, FR-08, and the North Star metric simultaneously. Combined with an understated legal/ToS risk (point 2) and no enforcement behind its own "coverage shouldn't regress" success metric (point 4), this is not a PRD that's merely missing edge-case polish — its central mechanism has never been confirmed to exist in the form assumed.

**Escalation:** flag for immediate human review before Stage 3 story decomposition. Recommend: (a) a manual spike hitting the real `affil.walmart.com/cart/addToCart` endpoint with a real product ID to confirm the URL format actually adds an item to a cart, before locking FR-02's contract; (b) a Legal/ToS question added to Open Questions on pre-approval usage risk, not just approval-pursuit timing; (c) an explicit minimum coverage threshold or an accepted-as-is note that low coverage is fine for v1.
