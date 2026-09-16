---
name: add-meal-card
description: Add a new meal card to the Meal Card Planner dataset (src/data/cards/*.ts). Trigger on "add a meal card", "create a meal card", "add a recipe/dish/card for X", "draft a meal card", "turn this into a card", or the /add-meal-card slash command. Researches real nutrition, enforces the repo's dietary hard-fail rules as a refusal gate before writing anything, writes a schema-valid card, and runs the repo's validator.
---

# Add Meal Card

Adds one schema-valid, dietary-rule-compliant meal card to this repo's
dataset, with researched (not guessed) nutrition.

## Related agents

This repo has four persona agents under `.claude/agents/` that build on this
skill rather than duplicate it:

- `chef` — invokes this skill to create new cards; if the user addresses
  "the chef" directly, that agent is what runs this workflow.
- `sous-chef` — edits a card *already in* the dataset (ingredient swaps,
  portion/macro tweaks, validator-failure repairs). Route there instead of
  here if the request is about an existing card, not a new one.
- `food-critic` — a read-only, deeper quality pass beyond this skill's own
  step-1/step-5 checks (nutrition soft-flag review, verified-vs-estimated
  honesty, step clarity, `shoppingName` correctness, cooking-time realism,
  flavor coherence, dataset-level variety). Step 6 below runs it, alongside
  `chef` and `sous-chef`, as a mandatory red-team review of every new card.
- `menu-planner` — assembles multi-day plans from existing cards; not
  relevant to adding a single card.

Beyond the team, this repo also has a **review board** of read-only
chef-persona judges that acts as the final gate on every new card. Every
seat is held by a genuinely Michelin-starred chef persona — the board
judges Michelin-caliber technique and ingredient care, not celebrity
recognition. Core seats: `gordon-ramsay` (technique), `thomas-keller`
(refinement/Michelin lens), `daniel-boulud` (home-cook approachability
without sacrificing craft), plus cuisine specialists matched to the dish
(`lefteris-lazarou` for Mediterranean/Greek, `enrique-olvera` for Mexican,
`masayoshi-takayama` for Japanese/Asian flavor profiles, `massimo-bottura`
for Italian dish concepts (piccata, cacciatore, puttanesca, parmesan-style,
pomodoro, pesto, scampi, Tuscan-style, caprese, antipasto, or similar) —
check `.claude/agents/` for the current full roster). Step 6 below runs
this board too, after the team's red-team round.

## 0. Read live sources first — every invocation

Never rely on a paraphrased copy of the schema or rules baked into this
skill file; the repo is the source of truth and may have changed since this
skill was written. At the start of every run, read:

- `src/data/schema.ts` — the current `MealCard` / `Ingredient` shape.
- `src/lib/dietaryRules.ts` — the current hard-fail rule implementations.
- `scripts/validate-cards.ts` — how validation is invoked and what it prints.
- `CONTRIBUTING.md` — field conventions and worked examples.

In particular, check whether `Ingredient` currently has a `shoppingName`
field. If it does, populate it per `CONTRIBUTING.md`'s documented
convention (canonical store-product name, no prep-state adjectives, never
bundle two products into one ingredient entry) for every ingredient whose
`name` differs from what you'd actually buy. If the field doesn't exist,
skip it — don't invent schema. This is how this skill survives schema
changes without being edited.

## 1. Dietary rule gate — before writing anything

Check the requested dish against the live rules in `dietaryRules.ts` before
drafting ingredients or steps. For the reasoning behind each rule (useful
when explaining a refusal in plain language), see
`references/dietary-rules-rationale.md`.

Hard fails — refuse and write nothing:
- **Red meat**: whole-word beef, pork, lamb, bacon, ham, veal, or sausage in
  the dish concept, any ingredient, or any tag. Refuse. Exception: "sausage"
  qualified as chicken or turkey (e.g. "Chicken sausage") is allowed — lean
  poultry sausage, not the red/processed meat the rule targets. Unqualified
  "sausage" (implicitly pork) and sausage of any other red-meat animal are
  still refused. When you do use chicken/turkey sausage, look up a specific
  **low-sodium** product (e.g. Jimmy Dean Low Sodium Chicken Breakfast
  Sausage Links, ~58 mg/link) rather than a generic "chicken sausage" figure
  — regular chicken/turkey sausage commonly runs 700+ mg sodium per serving,
  which will usually trip the sodium soft flag below. Name the low-sodium
  product in the ingredient name or `cooksNotes`.
- **Legumes**: any bean, lentil, chickpea, or garbanzo ingredient, *except*
  Banza chickpea pasta / chickpea penne specifically. Plain chickpeas,
  black beans, lentils, etc. are still refused even in a card that also
  uses Banza.
- **Seafood doneness**: if the dish includes fish or shellfish, the steps
  you write MUST include a temperature or doneness cue (e.g. "145°F",
  "internal temp", "opaque", "flakes easily"). This is non-negotiable
  food-safety content, not optional detail — write it in regardless of
  whether the user asked for it.

Soft flags — proceed, but call out in your summary (step 6):
- Sodium > 900 mg for the card (2000 mg daily ceiling).
- Saturated fat > 8 g for the card (13 g daily ceiling).

Tag `bedtime-snack` when the card is a bedtime snack (~50 g combined
carb+protein) — see the rationale doc for why this tag matters at the
dataset level.

If you hard-fail here, stop: go straight to step 7 (refusal path). Do not
research nutrition, write steps, touch any file, or run the validator.

## 2. Nutrition research

Every nutrition figure must come from an actual lookup performed this
session — never from memory or a plausible-sounding guess presented as
verified. Full workflow (source order, scaling, verified-vs-estimated
rules) is in `references/nutrition-research.md`. Summary:

- Look up each ingredient (USDA FoodData Central preferred; manufacturer
  panel for branded items like Banza) via WebSearch/WebFetch, scale to the
  actual quantity used, and sum across ingredients — don't estimate a
  dish-level aggregate directly.
- Mark each of the 5 nutrition figures (`calories`, `proteinG`, `sodiumMg`,
  `satFatG`, `carbsG`) `verified` only if you performed a lookup this
  session for the values it's built from. Otherwise mark it `estimated`,
  per `CONTRIBUTING.md`'s carb-estimation guidance.

## 3. Real cookable steps

Write numbered, sequential steps with real temperatures, times, and
doneness cues — the way the existing cards read (see any card in
`src/data/cards/dinner.ts` for the target voice). Set `prepTimeMinutes` and
`cookTimeMinutes` as separate, realistic numbers, not a combined guess.

## 4. Assemble and write

- Match the live schema from step 0 exactly, field for field.
- `id`: unique kebab-case slug. Check the existing cards in the target
  file (and ideally the whole dataset) to avoid collisions.
- `cooksNotes: null` explicitly if there's no note — never omit the field.
- Append the card object to the array in the correct
  `src/data/cards/{breakfast,lunch,dinner,snacks}.ts`, matched by
  `mealType`. Note the mismatch: the *file* is `snacks.ts` (plural) but the
  *field value* is `mealType: 'snack'` (singular) — use `'snack'` in the
  card, append to `snacks.ts`.
- Do not touch `src/data/cards/index.ts` or `src/data/cards.ts`.

## 5. Validate

Run `npm run validate:cards` via Bash. Parse the output:
- On `Validation PASSED.`, proceed to step 6.
- On failure, the output lists `[rule] (cardId) message` per violation —
  fix the specific field/ingredient/step named and re-run. Target
  resolving within 2 tries; if still failing, report the exact validator
  output to the user rather than guessing further.

## 6. Red-team review and review board

Once `npm run validate:cards` passes, run the same two-layer review
`review-meal-card` uses (its steps 2b-4) on the card you just wrote, before
reporting to the user — passing the validator isn't the same as being
done.

**Team round (review-meal-card steps 2b-2c):**
- Dispatch `chef`, `sous-chef`, and `food-critic` in parallel (`Agent` tool,
  one message, three calls), each reviewing the new card independently from
  its own lens (dish concept/flavor, cooking-time/execution,
  compliance/quality), per each agent's own "Also: red-team review"
  instructions. Treat this as a genuinely independent check, not a rubber
  stamp of your own steps 1-4 work — the point is catching what your own
  drafting missed.
- Once all three round-1 reports are in, dispatch them again in parallel,
  each given the other two's full reports verbatim, and ask each to
  red-team: challenge anything wrong, overstated, or out of the other's
  lane, and state whether it stands by or revises its own findings.
- Synthesize into consensus findings, resolved disagreements, and open
  disputes — an unresolved tie goes to `chef`'s verdict, this repo's
  standing team-level tiebreak rule — using the same structure as
  `review-meal-card`'s step 3.

**Review board (review-meal-card step 4):**
- Dispatch the core seats (`gordon-ramsay`, `thomas-keller`, `daniel-boulud`)
  plus any cuisine specialist whose trigger matches this card (check
  `.claude/agents/` for the current roster — e.g. `lefteris-lazarou` for
  Mediterranean/Greek, `enrique-olvera` for Mexican, `masayoshi-takayama`
  for Japanese/Asian flavor profiles, `massimo-bottura` for Italian dish
  concepts), each given the card and the team synthesis above.
- Tally verdicts (**Ship as-is** / **Needs changes**); majority wins, an
  even split goes to `gordon-ramsay`'s individual verdict. This board
  verdict is the actual final gate — it can override the team synthesis,
  including a `chef` team-level tiebreak call.

If you're running this skill without `Agent`-tool access (e.g. you are the
`chef` sub-agent invoked directly and lack that tool), skip the live
dispatch, say so plainly in your summary, and suggest the user run
`review-meal-card` on the new card next rather than silently treating it as
reviewed.

## 7. Apply fixes and summarize

Report: card name, meal type, headline macros (calories/protein/sodium/
satfat/carbs), a verified-vs-estimated breakdown across the 5 figures, a
one-line note on daily-target fit (including any soft flag from step 1),
the step-6 team synthesis in full, and the review board's final verdict and
per-judge critique.

If the review surfaced fixes the user wants applied, make them yourself
now — you already hold edit access, so there's no need to spawn another
agent for it. Follow the same discipline as `chef`'s "applying review
fixes" rules: the minimal edit per finding, recompute affected nutrition
via a real lookup, keep `confidence` honest, follow the `shoppingName`
convention, and re-run `npm run validate:cards` after editing. If the board
called "Needs changes," re-run the board on the revised card before
considering it finalized. Don't apply anything without the user's
go-ahead — step 6 surfaces findings, it doesn't auto-fix them.

## 8. Refusal path

On a step-1 hard fail: write a short explanation naming the specific rule
that was violated and why (pull the "why" from
`references/dietary-rules-rationale.md`), write nothing to any file, and do
not run the validator.
