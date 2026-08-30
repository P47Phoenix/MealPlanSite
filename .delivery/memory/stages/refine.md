# Stage Memory: Refine

## Lesson: verify external, unowned technical mechanisms via a live spike before locking requirements around them

Source: `run-2026-08-29-wmrt` (Walmart Cart Integration, first pipeline run).

Adversarial challenger hit confidence 2/5 on the PRD over the Walmart add-to-cart deep-link mechanism (`https://affil.walmart.com/cart/addToCart?...`) — no source cited proving the endpoint existed, was live, or accepted the assumed parameter shape, yet 8 dev stories and the North Star metric were about to be built on that assumption (`02-refine/challenger/challenge.md`).

Resolution was not more analysis or documentation review — it was an actual live browser spike against the real endpoint with a real product ID (`02-refine/po/spike-findings.md`), which confirmed single-item add, quantity syntax, multi-item syntax, and graceful degradation on invalid IDs, and closed the challenger's foundational blocker directly.

**Repeatable pattern for this project:** when a PRD's core mechanism depends on an external, unowned API or system (not controlled by this project, no formal contract/docs guaranteed current), do not accept "well-organized and internally consistent" as sufficient confidence. Require a live/empirical spike against the real system before the mechanism is locked into FRs — analysis of documentation alone is not a substitute for observation. Apply this any time Refine touches a third-party API, deep link, scraping target, or any interface this project does not own.

Note: the same spike also surfaces adjacent unknowns for free (e.g., this spike found no publisher/affiliate identifier in any working request, and an unconfirmed deprecation timeline) — treat those as new open questions, not blockers, unless they directly break the requirement being verified.
