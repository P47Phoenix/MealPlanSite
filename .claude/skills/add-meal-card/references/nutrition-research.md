# Nutrition research workflow

## Source order

1. **USDA FoodData Central** (fdc.nal.usda.gov) — preferred for raw/whole
   ingredients (chicken breast, quinoa, broccoli, olive oil, etc.). Use
   "Foundation" or "SR Legacy" entries over "Branded" when the ingredient
   isn't a specific packaged product.
2. **Manufacturer nutrition panel** — for branded/packaged items (Banza
   chickpea penne, a specific yogurt brand, coconut aminos, etc.), prefer
   the manufacturer's own published panel or the panel on the product's
   retail listing over a third-party aggregator.
3. **Reputable secondary source** — only as a last resort when neither of
   the above has the ingredient. Mark any figure sourced this way
   `estimated`, not `verified`, since the confidence in it is lower.

Perform the lookup via WebSearch/WebFetch. Do not answer from training-data
memory of "typical" nutrition values — that is always `estimated` at best,
and for a card's headline ingredients it isn't good enough to mark
`verified`.

## Scaling to actual quantity

Nutrition panels are usually per 100 g or per a specific serving size.
Convert the card's ingredient quantity/unit to grams (or match the panel's
unit) and scale linearly:

```
figure_for_card = (card_quantity_g / panel_serving_g) * panel_figure
```

For non-gram units (cup, tbsp, each, slice, oz), convert using a standard
reference (e.g. FoodData Central lists gram weights for common household
measures of that food) before scaling.

## Summing, not aggregate-guessing

Compute each of `calories`, `proteinG`, `sodiumMg`, `satFatG`, `carbsG` by
summing the scaled per-ingredient contributions across the whole
ingredient list. Don't shortcut by estimating what the whole dish "roughly"
comes to — that produces numbers that don't reconcile with the ingredient
list and are easy to get wrong on sodium in particular.

## verified vs. estimated

A figure is `verified` only when every ingredient contributing meaningfully
to it was looked up this session. If any non-trivial contributor's value
is a guess (source unavailable, or a garnish/spice too minor to look up
individually), mark the whole figure `estimated` rather than picking and
choosing per-ingredient within one summed number.

`carbsG` in this dataset is generally marked `estimated` even for cards
whose other figures are `verified` — follow the pattern in existing cards
(`CONTRIBUTING.md` documents this: carb-heavy meals get higher estimates,
protein-heavy/low-produce meals get lower ones) unless you did look every
carb source up individually.

## shoppingName

If the live `Ingredient` schema (checked in SKILL.md step 0) includes a
`shoppingName` field, populate it for every ingredient whose `name`
(the recipe-facing name, e.g. "Baked cod") differs from the plain
store-bought product ("Cod fillet"). See `CONTRIBUTING.md`'s
"Ingredient shoppingName" section for the full convention.
