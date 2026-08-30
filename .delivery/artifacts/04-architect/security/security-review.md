## Security Review: Walmart Cart Integration
## Role: Security Architect
## Task: security-design (Stage 4, Light depth, single reviewer)

Traces `.delivery/artifacts/04-architect/solution/architecture.md`, `.delivery/artifacts/02-refine/po/prd.md` (FR-01–FR-08, NFR-01–NFR-07, OQ-1, OQ-5), `.delivery/artifacts/03-design/ui/component-specs.md`. Scope per task brief: secret exposure, open-redirect/URL-injection, reverse-tabnabbing, third-party redirect trust, ToS/policy risk. No new attack surface class (no backend, no auth, no user-supplied input at runtime) — this is a narrow, bounded review.

---

### Prior Art Analysis

| Spec Element | Classification | Rationale |
|---|---|---|
| No backend/secrets, static hosting only | Decision Already Made | NFR-01/NFR-02, architecturally load-bearing |
| `URLSearchParams`-based encoding for cart/search URLs | Decision Already Made | FR-02/FR-03 |
| Single `<a href target="_blank" rel="noopener noreferrer">` cart control, no `window.open()` path | Decision Already Made | Formalized in architecture.md §2a, component-specs.md §1/§4 |
| Per-item search link, same anchor pattern | Decision Already Made | component-specs.md §3 |
| No affiliate ID fabricated in URL | Decision Already Made | FR-07 |
| ToS-compliance timing (pre-approval traffic) | Open Question, explicitly deferred to PO/Legal | OQ-5 |

No blockers against Decisions Already Made. This review validates those decisions hold up under adversarial scrutiny and confirms the one Open Question (OQ-5) is correctly *not* an architectural gap.

---

### 1. Secret/Credential Exposure (NFR-02)

**Finding: Clean. No architectural path introduces a secret.**

- The cart mechanism (`affil.walmart.com/cart/addToCart`) is confirmed by live spike (2026-08-29) to require no publisher/affiliate identifier in the request — the URL contains only item IDs and quantities. There is no credential to embed, so there is no credential to leak.
- `walmartItemId` values are literal digit strings sourced from public Walmart product-page URLs (`walmart.com/ip/.../<ID>`), hand-curated into `purchaseUnits.ts`. These are product identifiers, not secrets — same trust class as a SKU or barcode. No rotation, no confidentiality requirement.
- FR-05 explicitly bars the two credentialed Walmart API surfaces (OAuth2 client-credentials Marketplace API, RSA-signed I/O Affiliate API) — both would require a server-held secret that a static GitHub Pages site cannot hold. Ruling them out at the requirement level, not just at code-review time, closes this risk architecturally rather than by discipline.
- PRD's own metrics table (§3) commits to a pre-release `git grep` for credential patterns plus `dist/` bundle review — a verification step, correctly placed at Dev/QA stage, not a gap in this design.

No action needed. Confirm at Stage 6 (Dev) that no one adds an "affiliate tracking parameter" to `buildCartUrl`'s output speculatively — FR-07 explicitly forbids fabricating one, and the architecture's data flow (architecture.md §2) shows no such field entering the URL builder.

---

### 2. Open-Redirect / URL-Injection Risk (FR-02/FR-03)

**Finding: Clean, with one confirmation and one minor hardening note (non-blocking).**

Threat model: could a crafted ingredient/item name break out of the intended URL structure and redirect the user somewhere other than `walmart.com`, or inject extra query parameters?

- `buildCartUrl` builds `https://affil.walmart.com/cart/addToCart?items=ID|QTY,ID2|QTY2` from `walmartItemId` (an internal digit-string, not derived from item *name*) and a numeric quantity — neither is attacker-controllable text. `walmartItemId` is a hand-curated literal in `purchaseUnits.ts`, not runtime input. This closes the injection vector for the cart URL by construction: there's no free-text field entering the query string on that path.
- `buildSearchUrl(itemName)` is the one function that takes free text (`item.name`) and must encode it. Architecture confirms FR-03's contract is `https://www.walmart.com/search?q=<encoded name>` via `URLSearchParams`. `URLSearchParams` percent-encodes the value it's given (including `&`, `=`, `#`, `?`, `/`, whitespace), so a name like `chicken & rice #1` cannot inject additional query parameters or break out of the `q=` value. This is the correct mechanism — confirm at Dev time it is literally `new URLSearchParams({q: itemName}).toString()` or equivalent, not manual string concatenation (`` `?q=${itemName}` ``), which would reopen this exact risk. Flag this as the one concrete implementation check for Dev/QA to verify, since "uses `URLSearchParams`" is stated as a requirement but the actual call site doesn't exist yet.
- Protocol/host are hardcoded literals (`https://www.walmart.com/search`, `https://affil.walmart.com/cart/addToCart`) — the item name only ever populates a query *value*, never the scheme or host. There is no code path where user-influenced text can change the destination domain (classic open-redirect requires attacker control of the redirect target itself, which doesn't exist here).
- Source of the name: this app's own data (`GroceryItem.name`, itself derived from `MealCard` ingredient lists curated in the repo), not third-party or user-submitted input. So even the theoretical risk surface is internal content, reviewed via normal PR process — genuinely low residual risk, correctly characterized in the task brief as "worth checking, not urgent."

**Verdict:** architecture is sound. No open-redirect risk exists (host is never parameterized). URL-injection into the query value is prevented by `URLSearchParams` as specified, contingent on Dev actually using the API rather than string interpolation — call this out explicitly as an NFR-05 test case: assert `buildSearchUrl` output for a name containing `&`, `=`, `#`, and a literal `%` renders as a single well-formed `q=` value, not multiple parameters.

---

### 3. Reverse-Tabnabbing (`target="_blank"` without `rel="noopener noreferrer"`)

**Finding: Clean. Both controls specify the full `rel` value.**

- Cart control (architecture.md §2a, component-specs.md §1): `<a class="copy-link-button walmart-cart-button" href={cartUrl} target="_blank" rel="noopener noreferrer" ...>` — `rel` present and correct.
- Per-item search link (component-specs.md §3): `<a class="grocery-item__search-link" href={buildSearchUrl(item.name)} target="_blank" rel="noopener noreferrer" ...>` — `rel` present and correct.
- Both specs state this as literal markup, not a paraphrase, and architecture.md carries it through unchanged as a "Decision Already Made" formalization, explicitly warning Dev not to substitute a `<button onClick={window.open(...)}>` variant that could drop the `rel` attribute or otherwise change the opener-isolation guarantee.

`noopener` prevents the newly opened Walmart tab from getting a `window.opener` reference back into MealPlanSite (blocks `window.opener.location = ...` redirect attacks against the origin tab). `noreferrer` additionally suppresses the `Referer` header. Since the destination here is a known, fixed, trusted host (Walmart's own domain, not attacker-influenced), the tabnabbing threat this defends against is theoretical for this specific integration — but the architecture applies the defense-in-depth correctly and consistently anyway, which is the right call given it costs nothing and is already spec'd.

**Verdict:** both anchors correctly close this. Confirm at code review this attribute doesn't get lost in refactor/copy-paste — cheap to check via a grep-based test if NFR-05's suite wants one, not required.

---

### 4. Third-Party Redirect Trust (Disclosure, Not a Dark Pattern)

**Finding: Clean. The redirect is expected, labeled, and user-initiated.**

- Button label is explicit: "Add all to Walmart cart" — the destination is named in the control's own visible text, not obscured behind generic copy like "Continue" or "Next."
- `aria-label` reinforces this further: "Add all to Walmart cart (opens in new tab)" — both the destination and the new-tab behavior are disclosed before activation, for sighted and assistive-technology users alike.
- Per-item search links carry `aria-label="Search for {item.name} (opens in new tab)"` — same pattern, same disclosure.
- The redirect only ever fires on a direct user gesture (anchor click or Enter on a focused link) — never on page load, never on a timer, never as a side effect of an unrelated action. This is the opposite of a dark pattern: no auto-redirect, no bait-and-switch label, no disguised ad.
- `target="_blank"` keeps MealPlanSite's own tab open and intact — the user isn't stranded away from their grocery list; the redirect is additive (a new tab), not a takeover of the page they're on.
- No cross-site tracking pixel, no MealPlanSite-side logging of the click, no data sent to a third party beyond the URL navigation itself (consistent with PRD §8 Out of Scope — no analytics/telemetry added this release).

**Verdict:** disclosure is adequate. The user is never surprised about where the click goes — the label states it, the aria-label restates it, and the click is the only trigger.

---

### 5. ToS/Policy Risk (OQ-5) — Architecture Does Not Worsen It

**Finding: Architecture correctly avoids compounding OQ-5; the open question is a business/legal decision, not an engineering gap.**

OQ-5 asks whether using `affil.walmart.com/cart/addToCart` before Impact Radius affiliate approval is itself a ToS violation, distinct from whether approval will eventually be granted. The spike (2026-08-29) confirmed the endpoint works today, unauthenticated, with no publisher identifier in the request — but could not resolve the policy question. Reviewing what the architecture does with that uncertainty:

- **No fabricated affiliate ID.** FR-07 is explicit: "No affiliate tracking ID is fabricated or hardcoded into the URL format." Architecture's data flow (§2) confirms the URL builder only ever emits `items=ID|QTY,...` — there is no field anywhere in the design for an affiliate/publisher parameter, real or invented. This is the correct posture: fabricating one to *look* compliant would be actively worse (potential fraud/misrepresentation against Impact Radius's program rules) than sending an honest, unauthenticated request. The architecture does not do this.
- **No misrepresentation of approval status.** FR-08 and architecture.md §6 both correctly state the client has no way to detect or assert affiliate-approval status server-side, and the design does not attempt to fake one (e.g., no hardcoded `isApproved: true` flag, no UI copy asserting approval). FR-07 requires the README to state the requirement "without asserting the project currently has that enrollment unless confirmed true at ship time" — this is the right instruction; it prevents the shipped artifact from making a false claim about its own compliance status.
- **Graceful degradation, not silent failure dressed as success.** Per the spike findings cited in FR-02, a request containing an invalid/rejected item lands on Walmart's cart page rather than an error page — this is Walmart's own behavior, external to this app, and the architecture's mitigation (FR-06's always-present per-item search link) is a legitimate fallback, not a mechanism to obscure or launder a ToS-violating request. If Walmart rejects unapproved traffic outright, the user still reaches a working manual path; nothing in the design tries to disguise a rejection as a success.
- **No engineering action can resolve OQ-5.** This is correctly scoped as a Product Owner/Legal decision (owner and due-date both specified in PRD §11), not something a code change fixes. From a security-architecture standpoint, the risk is bounded and identical whether or not the button ships: the endpoint is publicly reachable and unauthenticated regardless of who calls it. This app sending traffic to it does not create a new capability Walmart doesn't already expose to any browser typing the same URL manually — it is not privilege escalation, credential misuse, or a novel abuse vector; it is a UX convenience wrapper around a URL that already works for anyone.
- **README documentation (FR-07) is the correct control**, not a code gate — since no server-side flag can be verified from a static client (FR-08's own reasoning), a documentation-level disclosure is the only architecturally honest option available, and that's what's specified.

**Verdict:** the architecture does not worsen OQ-5's exposure and actively avoids the two ways it could have (fabricated affiliate ID, false approval claim). OQ-5 itself remains correctly unresolved and correctly gated before Stage 7 UAT sign-off — carrying forward as a business/legal open question, not a security-architecture defect.

---

### Summary Table

| Area | Verdict | Residual Risk | Owner |
|---|---|---|---|
| Secret/credential exposure (NFR-02) | Clean — no secret exists to leak | None architectural; verify via pre-release `git grep`/`dist/` review | Engineering, pre-release |
| Open-redirect / URL-injection (FR-02/FR-03) | Clean — host hardcoded, query value `URLSearchParams`-encoded | Low — confirm Dev uses `URLSearchParams` API, not string concat, for `buildSearchUrl` | Engineering, at implementation + NFR-05 test |
| Reverse-tabnabbing (`rel="noopener noreferrer"`) | Clean — both anchors specify it | Low — confirm attribute survives implementation/refactor | Code review |
| Third-party redirect trust/disclosure | Clean — labeled, user-gesture-only, no auto-redirect | None | N/A |
| ToS/policy risk (OQ-5) | Architecture does not worsen it; correctly deferred | External, business-owned | Product Owner/Legal, before Stage 7 UAT |

### Recommendation

No architectural change required. One implementation-time test case recommended for NFR-05's suite: assert `buildSearchUrl` correctly encodes item names containing `&`, `=`, `#`, `%`, and whitespace into a single well-formed `q=` parameter (guards against a future maintainer swapping `URLSearchParams` for manual string interpolation). OQ-5 remains the sole open item, already correctly routed to Product Owner/Legal ahead of Stage 7 UAT sign-off — no security-architecture blocker to this feature's Stage 5/6 progression.
