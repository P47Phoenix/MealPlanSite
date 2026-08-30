## Product Owner DoD Validation -- Stage 3 Design (Post-Revision)
## Role: Product Owner
## Task: dod-validation

Scope: re-verify FR-04, FR-06, FR-08, NFR-07 against the **revised** `component-specs.md` (post component-spec revision), cross-checked against `user-flows.md` and `prd.md`. This is an independent re-check, not a reuse of the earlier review-board pass.

---

### Gate Criterion 1 -- FR-04, FR-06, FR-08, NFR-07 all remain represented after the revision

**FR-04 -- "Add all to Walmart cart" button, coverage count, conditional rendering**
Status: **PASS**
Evidence: `component-specs.md` section 1 (lines 11-32) specifies the anchor-styled button, rendered only when `buildCartUrl(...)` returns a defined string (line 30, explicitly citing FR-04); section 2 (lines 34-52) specifies the "N of M items" coverage text as a single source of truth paired 1:1 with button visibility (line 52: "Renders only alongside the button (same conditional -- FR-04)"). The States table (lines 107-111) enumerates hidden/visible states matching PRD FR-04's AC (button absent at zero coverage, not disabled; no "0 of M" text).

**FR-06 -- per-item "Search" link on every line, unconditional**
Status: **PASS**
Evidence: `component-specs.md` section 3 (lines 54-91), specifically line 91: "Appended at the end of each `<li>` text run, unconditionally, on every grocery-list line in every section -- curated or not (FR-06)." This matches PRD FR-06's AC verbatim (link present regardless of curation state, serves as stale-ID recovery path) and is consistent with `user-flows.md` Flow 2 (lines 74-94) and Flow 3 (lines 96-113, "Each of the M lines still renders its per-item Search link").

**FR-08 -- renders regardless of approval status**
Status: **PASS**
Evidence: Nothing in the revised `component-specs.md` introduces an approval-status flag, gate, or conditional branch anywhere in the button's render logic (section 1) or the States table. The only rendering condition stated anywhere in the spec is `buildCartUrl(...)` returning a defined string (an items-curated check, not an approval check) -- consistent with PRD FR-08's AC that "it is not gated behind an approval-status flag, because no such flag can be verified from a static client." No regression: the revision did not add any new conditional that could accidentally couple rendering to affiliate status.

**NFR-07 -- popup-blocked fallback, never a silent no-op**
Status: **PASS**
Evidence: `component-specs.md` section 4 (lines 93-99) and the Design Rationale table (line 161) resolve NFR-07 "by construction": the cart control is a real `<a href={cartUrl} target="_blank" rel="noopener noreferrer">`, always present in the DOM whenever `buildCartUrl` returns a string, never conditionally rendered on detected popup-block failure. This satisfies PRD NFR-07's AC ("a visible fallback... must be present so the action is never a silent no-op") because the primary element itself is that visible, clickable fallback -- there is no failure state in which nothing renders.

---

### Gate Criterion 2 -- Revised anchor-only contract still satisfies FR-04 "opens in new tab" and FR-08 "renders regardless of approval status"

**FR-04 "opens in new tab" sub-requirement**
Status: **PASS**
Evidence: The anchor element carries `target="_blank" rel="noopener noreferrer"` directly (`component-specs.md` lines 16-20), identical to the attribute set PRD FR-04 requires ("opens that URL in a new tab (`target="_blank" rel="noopener noreferrer"`)"). The States table (line 109) confirms: "Browser navigates `cartUrl` in a new tab per normal anchor click." `aria-label` additionally appends "(opens in new tab)" (line 21, line 31) so the new-tab behavior is also announced -- this is an accessibility addition, not a substitution for the actual `target="_blank"` mechanism, so the underlying PRD requirement is still met by the real attribute, not just by the label text.

**FR-08 "renders regardless of approval status" sub-requirement**
Status: **PASS**
Evidence: Same finding as Criterion 1's FR-08 check -- the anchor-only contract's sole rendering condition is `buildCartUrl(...)` returning a defined string. Collapsing the prior two-element design (button + separate fallback link) into one anchor did not introduce, and did not remove, any approval-status coupling -- there was none before and there is none now. The revision is orthogonal to this requirement.

---

### Gate Criterion 3 -- No requirement regressed during the revision pass

Status: **PASS**

Checked against `user-flows.md`'s NFR-07 recommendation (lines 72, 199) that the button be implemented as a real `<a href>` rather than `<button onClick={window.open}>` plus a conditional fallback -- the revised `component-specs.md` adopts exactly this recommendation and explicitly documents why the prior two-element shape is now removed (Design Rationale, line 161; Follow-Up, line 173: "Resolved, no longer open"). This is a simplification that satisfies the same NFR-07 outcome with fewer moving parts, not a scope reduction:

- FR-06 (Search link, every line, unconditional) -- unaffected by the button revision; still stated unconditionally at line 91.
- FR-04 (conditional render + coverage count) -- unaffected; still gated purely on `buildCartUrl` output (lines 30, 52).
- FR-08 (no approval gating) -- unaffected; no approval-status logic was ever present or is now present.
- NFR-07 (visible fallback, never silent no-op) -- strengthened, not weakened: the revision removes an unresolved "which engineering path will be chosen" open question (`component-specs.md` line 173, `user-flows.md` line 218) and replaces it with a single, definitive, always-present element. This closes a prior ambiguity rather than dropping a requirement.
- Accessibility warnings tied to these FRs/NFRs (new-tab announcement, coverage-count association, fallback-link discoverability) are all marked resolved in the revised spec (Accessibility table, lines 121-131) with no requirement left orphaned by the consolidation.

No PRD acceptance criterion text found in `prd.md` (FR-04, FR-06, FR-08, NFR-07, sections 6-7) is contradicted, weakened, or silently dropped by the revised `component-specs.md`.

---

### Overall Gate Result

**PASS** -- All three gate criteria pass. FR-04, FR-06, FR-08, and NFR-07 all remain fully represented in the revised component specs; the anchor-only contract satisfies both the "opens in new tab" and "renders regardless of approval status" sub-requirements; and the consolidation from a two-element (button + fallback) design to a single anchor is a defensible simplification that resolves a prior open engineering question without regressing any requirement.

### Notes / Non-Blocking Observations

- `user-flows.md` (line 218, Follow-Up) still asks engineering to "confirm... whether the cart action is implemented as `<a href target="_blank">` or `<button onClick={window.open}>`" -- this is now answered by the revised `component-specs.md` (anchor-only, definitively). Recommend `user-flows.md` be updated to mark this Follow-Up item resolved for consistency across the two Stage 3 artifacts, though this is a documentation-hygiene note, not a DoD blocker.
- PRD OQ-1 and OQ-5 (Impact Radius affiliate enrollment status and ToS-compliance question) remain open per `prd.md` section 11 and are correctly treated as out of this design pass's scope -- FR-08's design intentionally does not attempt to resolve them, consistent with the PRD's own position.
