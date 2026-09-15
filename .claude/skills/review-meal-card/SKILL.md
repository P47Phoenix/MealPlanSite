---
name: review-meal-card
description: Review one meal card or the whole Meal Card Planner dataset for dietary-rule compliance and quality — including cooking-time realism and whether the ingredients taste good together. For a single card, runs chef, sous-chef, and food-critic as an adversarial three-way review that red-teams each other's findings, then puts the result through a review board of chef-persona judges (technique, refinement, home-cook appeal, plus matching cuisine specialists) as the final gate. For a dataset audit, runs food-critic alone. Trigger on "review this recipe/card", "review recipes", "audit the dataset", "check this card before I add it", "does this meet the sodium target", "check the cooking time", "do these ingredients go together", "get the review board's verdict", or the /review-meal-card slash command. Read-only by default; can hand confirmed fixes to the chef agent on explicit request.
---

# Review Meal Card

Reviews a card (or the whole dataset) for dietary-rule compliance and
quality. For a single card, this has two layers:

1. A three-agent adversarial review — `chef`, `sous-chef`, and
   `food-critic` each review independently from their own lens, then
   red-team each other's findings.
2. A **review board** of chef-persona judges that takes that team output
   and renders the actual final verdict — the board's ruling is the final
   gate, and it can affirm, soften, or overrule anything from layer 1,
   including a `chef` tiebreak call.

This skill is the coordinator; the actual review logic lives in each
agent's own instructions — don't duplicate it here.

## Related agents

**The team** (`.claude/agents/`):

- `chef` — creates new cards; in review, argues the dish-concept/flavor
  angle. Also applies fixes after a review, once the user approves them.
- `sous-chef` — edits existing cards outside of a review flow; in review,
  argues the execution angle (can a home cook actually follow these steps/
  timing/quantities as written).
- `food-critic` — read-only review; argues the compliance/quality angle
  (dietary rules, nutrition honesty, `shoppingName`, dataset variety).
- `menu-planner` — assembles multi-day plans from existing cards; unrelated
  to review.

**The review board** — read-only judges, final gate on a single-card
review, majority-rule verdict of **Ship as-is** or **Needs changes**. Every
seat is held by a genuinely Michelin-starred chef persona; the board's
whole point is judging Michelin-caliber technique and ingredient care, not
celebrity recognition:

- Core seats, always included: `gordon-ramsay` (technique/execution),
  `thomas-keller` (ingredient quality/refinement, Michelin-star lens),
  `daniel-boulud` (home-cook approachability without sacrificing craft).
- Cuisine-specialist seats, included when the card matches: `lefteris-
  lazarou` (Mediterranean/Greek — `mediterranean` tag or Greek dish
  concept), `enrique-olvera` (Mexican — `mexican-inspired` tag or Mexican/
  Tex-Mex concept), `masayoshi-takayama` (Japanese/Asian — teriyaki/soy-
  ginger-sesame flavor profile, even without a dedicated tag). This roster
  can grow as more cuisine specialists are added for this repo — check
  `.claude/agents/` for the current set rather than assuming this list is
  exhaustive.
- If the board's verdict splits evenly (possible when a cuisine specialist
  makes the seat count even), `gordon-ramsay`'s individual verdict is the
  board's own tiebreaker — separate from `chef`'s tiebreak role at the team
  level in step 3.

If the request is actually "add a new card" or "build a weekly plan" rather
than a review, hand off to `chef` or `menu-planner` instead of running this
skill.

## 1. Determine scope

- **Single card**: a specific card was just added/edited in this
  conversation, or the user names a card by id/name. Runs the full team
  review plus the review board below.
- **Dataset audit**: "audit everything", "review the dataset", "review
  recipes" with no specific card named. Runs `food-critic` alone (step 2a)
  — a full team-plus-board review across the whole dataset is not worth the
  cost; only escalate a specific card `food-critic` flags to the full
  process if the user asks for a closer look at it.

If genuinely ambiguous (e.g. bare "review recipes" with no recent card in
context and no name given), ask which — don't guess between a single card
and a full dataset sweep.

## 2a. Dataset audit: food-critic alone

Invoke the `food-critic` agent (`Agent` tool, `subagent_type:
"food-critic"`) for the whole dataset. Let it do the actual work: reading
the live schema/rules/tags files, running `npm run validate:cards`, and
applying its own hand-checks. Skip to step 5 to relay its findings — no
team red-team round and no review board for a dataset-wide pass.

## 2b. Single card: round 1 — independent team reviews

Dispatch all three agents in parallel (one message, three `Agent` tool
calls) against the same card:

- `chef` (`subagent_type: "chef"`) — dish concept and flavor coherence.
- `sous-chef` (`subagent_type: "sous-chef"`) — cooking-time realism and
  step/technique feasibility.
- `food-critic` (`subagent_type: "food-critic"`) — full compliance/quality
  pass (validator, nutrition, `shoppingName`, etc.).

Give each agent the card's id/name and file location, and tell it plainly
this is a read-only review (none of them should edit anything in this
round, including `chef` and `sous-chef`, whose default jobs otherwise
create/edit files).

## 2c. Single card: round 2 — team red team

Once all three round-1 reports are in, dispatch all three again in
parallel, each given the *other two* agents' full round-1 reports verbatim,
and ask each to:

- Point out anything in the other two reports it thinks is wrong,
  overstated, out of the reviewer's lane, or missing context.
- State whether it still stands by each of its own round-1 findings or
  revises/withdraws any of them.

## 3. Synthesize the team report

Compile the team's output (don't relay to the user yet for a single-card
review — the board still needs this to do its job):

- **Consensus findings** — anything raised in round 1 that none of the
  three disputed in round 2. Most-severe first (hard-fail rule violations,
  then soft flags, then style/quality/flavor/timing notes).
- **Resolved disagreements** — a round-1 finding one agent walked back or
  revised after round 2; note the original claim and the correction.
- **Open disputes** — a round-1 finding still contested after round 2 with
  no resolution. State each side's position. If it's a genuine, unresolved
  tie, `chef`'s verdict wins by this repo's standing team-level tiebreak
  rule — note this explicitly, but still carry the dissenting agent's
  argument forward into step 4 rather than dropping it.

## 4. Review board — final gate (single card only)

Determine the judge roster per "Related agents" above (the three core
seats, plus any cuisine specialist whose trigger condition the card
matches), then dispatch all of them in parallel (`Agent` tool, one message,
one call per judge), each given:

- The card's id/name and file location (they read the card themselves,
  not just your summary).
- The full step-3 team synthesis, verbatim — including open disputes and
  which side `chef`'s tiebreak favored.

Each judge returns a verdict (**Ship as-is** / **Needs changes**) plus
itemized critique and explicit agreement/disagreement with team findings on
their lens. Tally the verdicts: majority wins; an even split goes to
`gordon-ramsay`'s individual verdict per the board's own tiebreak rule.

The board's verdict is the final gate for this review — it supersedes
anything from step 3 it disagrees with, including a `chef` team-level
tiebreak call. Carry every judge's critique forward, not just the winning
side.

## 5. Relay final verdict

Present one synthesized report to the user, not one per agent/judge:

- For a single-card review: the step-3 team synthesis, then the step-4
  board ruling (each judge's verdict and critique, and the final majority/
  tiebreak outcome), clearly labeled as two layers — team findings, then
  the board's final gate.
- For a dataset audit: `food-critic`'s findings directly, in the severity
  order it returned them.

Don't soften, summarize away, or omit a finding from any agent or judge,
including a losing side of a tiebreak at either layer.

## 6. Offer fixes — only on request

If findings exist and the user wants them fixed, invoke the `chef` agent
once per distinct card, describing the specific fix(es) from the final
report (not a vague "fix everything"). Never invoke `chef` automatically
without the user opting in — this skill's default mode is diagnostic, not
corrective.

For a dataset audit with findings spread across many cards, list them and
let the user pick which to fix now rather than batch-fixing all of them in
one pass.

## 7. Confirm fixes

After `chef` applies a fix, re-invoke `food-critic` on that same card (or,
for a quick check when the only findings were automated-validator
violations, just re-run `npm run validate:cards` directly) to confirm the
fix actually resolved what was flagged. If the fix addressed something the
review board called a "Needs changes" blocker, re-run the board (step 4) on
the revised card before considering it finalized, rather than assuming the
fix satisfies judges who haven't seen it.
