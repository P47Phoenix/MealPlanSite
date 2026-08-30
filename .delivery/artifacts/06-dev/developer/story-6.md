## Language: CSS
## Task: write

### Code

File: `src/styles.css` (edits near lines 315-380)

```css
.copy-link-button:focus-visible {
  outline: 3px solid var(--focus-ring);
  outline-offset: 2px;
}

.walmart-cart-button {
}

.copy-confirmation {
  font-size: 0.8rem;
  color: var(--text-muted);
}
```

```css
.target-note {
  color: var(--text-muted);
  font-size: 0.8rem;
}

.walmart-coverage-count {
}

.grocery-item__search-link {
  color: var(--text-muted);
  text-decoration: underline;
  padding: 0 var(--space-2);
}

.grocery-item__search-link:hover,
.grocery-item__search-link:focus {
  color: var(--text);
}

.grocery-item__search-link:focus-visible {
  outline: 3px solid var(--focus-ring);
  outline-offset: 2px;
}
```

### Key Decisions
`.walmart-cart-button` and `.walmart-coverage-count` are deliberately empty rule blocks — placed directly after `.copy-link-button:focus-visible` and `.target-note` respectively so Sprint 2 markup can apply both classes (`class="copy-link-button walmart-cart-button"`) and get identical visuals with zero override risk. `.grocery-item__search-link` uses only the four tokens named in the acceptance criteria (`--text-muted`, `--text`, `--focus-ring`, `--space-2`); `--space-2` is applied as horizontal padding since no other spacing use was specified. The `:focus-visible` block is copied verbatim from `.copy-link-button:focus-visible` (3px solid `--focus-ring`, 2px offset) per TC-CSS-004. No `@media (prefers-color-scheme: dark)` or dark-mode selector was added — `--text`, `--text-muted`, and `--focus-ring` already have dark-mode overrides declared elsewhere in the file (lines ~923-925, ~951-953), so all three elements inherit dark styling automatically.

### Test Suggestions
- Source inspection: confirm `.walmart-cart-button {}` and `.walmart-coverage-count {}` declare zero properties (TC-CSS-001, TC-CSS-002).
- Source inspection: confirm `.grocery-item__search-link` references only `--text-muted`, `--text`, `--focus-ring`, `--space-2` (TC-CSS-003).
- Once Sprint 2 markup lands, tab-focus the rendered search link and inspect computed outline: expect 3px solid using the `--focus-ring` color, 2px offset (TC-CSS-004).
- Toggle dark mode and visually confirm cart button, coverage text, and search link pick up dark-mode colors with no new dark-mode rule present in source (TC-CSS-005).

### Verification Status
- **Verified by inspection**: TC-CSS-001, TC-CSS-002, TC-CSS-003, TC-CSS-005 (source contains no new dark-mode selectors; tokens confirmed pre-existing with dark overrides).
- **Requires runtime validation**: TC-CSS-004 (focus-visible outline requires rendered markup and keyboard focus — Sprint 2 markup not yet landed) and full visual dark-mode rendering of all three elements (TC-CSS-005 visual half).
- **Verification gaps**: None — markup to attach these classes to does not exist yet (Story 5/Sprint 2 dependency), so live rendering checks are deferred by design per this story's stated dependency.

### Follow-Up
- When Sprint 2 JSX lands and applies `walmart-cart-button`, `walmart-coverage-count`, and `grocery-item__search-link` classes, do a manual pass in both light and dark themes plus keyboard-tab focus check on the search link.
