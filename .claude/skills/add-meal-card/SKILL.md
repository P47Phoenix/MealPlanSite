---
name: add-meal-card
description: Add a new meal card to the Meal Card Planner dataset (src/data/cards/*.ts). Trigger on "add a meal card", "create a meal card", "add a recipe/dish/card for X", "draft a meal card", "turn this into a card", or the /add-meal-card slash command. Researches real nutrition, enforces the repo's dietary hard-fail rules as a refusal gate before writing anything, writes a schema-valid card, and runs the repo's validator.
---

# Add Meal Card

Adds one schema-valid, dietary-rule-compliant meal card to this repo's
dataset, with researched (not guessed) nutrition.

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

## 6. Summarize

Report: card name, meal type, headline macros (calories/protein/sodium/
satfat/carbs), a verified-vs-estimated breakdown across the 5 figures, and
a one-line note on daily-target fit — including any soft flag from step 1
(sodium/satfat over the per-card guideline).

## 7. Refusal path

On a step-1 hard fail: write a short explanation naming the specific rule
that was violated and why (pull the "why" from
`references/dietary-rules-rationale.md`), write nothing to any file, and do
not run the validator.
