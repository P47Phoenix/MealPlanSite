# Consensus Round 1 — Product Owner Position

**Topic:** Sprint 1 committed scope (Stories 1, 2, 3, 4, 7 — 11 points) for Walmart Cart Integration
**Role:** Product Owner
**Round:** 1 (independent — no visibility into other roles' positions)

---

## Position: Scope split is capacity-sound, but the Sprint Goal misrepresents what ships

I do **not** agree, as currently framed, that this sprint delivers coherent *end-user* value — and I think that's a documentation/framing defect, not a scoping defect. The story split itself (defer 5, 6, 8; keep 1, 2, 3, 4, 7) is the right call given a 12.5-point solo capacity ceiling. My objection is to the Sprint Goal statement, not the story selection.

### Why this is a half-feature as stated

The Sprint Goal reads: *"Meal planners get a one-click way to add curated grocery items to a Walmart cart, with an honest coverage count and a per-item search fallback that always works."*

Nothing in Sprint 1's committed stories (1, 2, 3, 4, 7) produces that outcome. The "Add all to Walmart cart" button (Story 5) and the per-item search link (Story 6) — the only two stories that put anything in front of a user — are both deferred to Sprint 2. Sprint 1 ships:

- A curated data field (Story 1) — invisible to the user.
- `buildCartUrl` / `buildSearchUrl` / `getQualifyingItems` / `normalizeIngredientKey` (Stories 2, 3) — pure functions, invisible to the user.
- Unit tests for those functions (Story 4) — invisible to the user.
- CSS rules for classes that don't exist in the DOM yet (Story 7) — invisible to the user, and per the sprint plan's own risk note, unverifiable until Sprint 2's markup lands.

At the end of Sprint 1, a meal planner opens the grocery list and sees **nothing different** from today. No button, no coverage count, no search link. That is not "a one-click way to add items to a cart" — it's the engine for one, built and tested, sitting unwired. If I read only the Sprint Goal without the story table, I would expect a demoable feature at sprint review. There isn't one.

### What I'd change

I am **not** recommending pulling Stories 5/6 into Sprint 1 — at 3 and 2 points respectively, adding either pushes committed load to 14–16 points against an unproven 12.5-point solo ceiling with zero historical velocity data. That's the wrong trade for a first sprint with no track record.

Instead, fix the Sprint Goal's language so it honestly reflects an internal/technical increment rather than claiming user-facing capability:

> *"The cart-link and search-link engine (`buildCartUrl`, `buildSearchUrl`, qualification and key-normalization helpers) is built, fully unit-tested, and de-risked — ready to wire into the grocery list UI in Sprint 2 with zero remaining core-logic uncertainty."*

This is a legitimate, coherent sprint on its own terms — it just isn't the sprint the current goal statement describes. A goal that overpromises user-visible value risks a confusing sprint review (nothing to click through) and, on a solo project, risks the PO (same person as the dev) losing track of the fact that real user value is still one full sprint away.

### Secondary scope concern: Story 7 sequencing

Story 7 (CSS) is scoped into Sprint 1 but styles classes (`.walmart-cart-button`, `.walmart-coverage-count`, `.grocery-item__search-link`) that Stories 5 and 6 — both in Sprint 2 — actually introduce into the DOM. The sprint plan itself flags this as a risk ("styling against assumed class names that drift") and defers verification to Sprint 2. I'd rather see Story 7 also deferred and grouped with 5/6 so CSS and markup land together and get verified in the same sprint — reduces the chance of Sprint 1 "completing" a story that can't be visually confirmed until later. This is a minor process point, not a blocker; I can accept Story 7 staying in Sprint 1 as speculative/draft work if it's explicitly not counted toward Sprint 1's Definition of Done for visual correctness (the plan already gestures at this but doesn't fully commit to it).

## Top Risk to Value Delivery

**The two-sprint split creates a real chance that user-visible value (Stories 5, 6, 8) slips past Sprint 2, stranding Sprint 1's entire 11-point investment as dead weight with nothing shippable to show.** This is a solo, no-backup, ~6 hr/week hobby cadence with no historical velocity data. If Sprint 2 has a below-average week (explicitly called out as a risk in the sprint plan), the feature could span 3+ sprints before a single user ever sees a cart button — while the Sprint Goal language (as currently written) implies user value arrives after this sprint. I'd rather see the goal reworded now (see above) than have that mismatch surface at sprint review as a "why isn't this done" surprise, even in a solo context where I'm reviewing my own work.

## Open Questions for Consensus

- Do other roles agree the Sprint Goal statement should be reworded to describe the technical/foundation outcome rather than implied user-facing capability, given the actual committed stories?
- Is there appetite to also defer Story 7 to Sprint 2 (grouping CSS with the markup it styles), or is drafting it speculatively in Sprint 1 acceptable given the sprint plan's own caveat?

---

**downstream_ready:** true — no blocker to proceeding with the story set as committed; the concern is framing/wording, not scope, and can be resolved by editing the Sprint Goal sentence.
