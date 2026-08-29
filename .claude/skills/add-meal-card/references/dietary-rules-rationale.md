# Dietary rule rationale

Background for this dataset: cards are built for someone managing a
cirrhosis diagnosis, where sodium load and liver-safe food handling matter
more than for a general audience. This is the "why" behind the hard-fail
rules in `src/lib/dietaryRules.ts` — use it to explain a refusal in plain
language, not to re-derive or second-guess the rules themselves.

## No red meat (beef, pork, lamb, bacon, ham, veal, sausage)

Cirrhosis management favors lean protein and limits saturated fat and iron
overload risk associated with red and processed meat. This is a firm
dietary boundary for this dataset, not a taste preference — refuse rather
than substitute a "leaner cut" workaround.

The one carve-out is chicken or turkey sausage: it's a lean poultry product
sold and eaten as sausage, not the red/processed meat the rule is aimed at,
so "Chicken sausage" / "Turkey sausage links" are allowed. Unqualified
"sausage" (implicitly pork) is still refused, as is sausage from any other
red-meat animal.

That carve-out isn't a free pass on sodium, though: standard chicken/turkey
sausage products commonly run 700+ mg sodium per serving, which works
against the same cirrhosis-driven sodium ceiling behind the soft-flag rule
below. Prefer a specific low-sodium chicken or turkey sausage product (look
up its own manufacturer panel — e.g. Jimmy Dean Low Sodium Chicken
Breakfast Sausage Links run about 58 mg per link, versus 300+ mg for a
regular chicken sausage link) and name that specific product rather than
using a generic "chicken sausage" nutrition figure.

## No legumes, except Banza chickpea pasta / chickpea penne

Beans, lentils, and whole chickpeas are excluded — likely for
digestive-tolerance or other individual dietary reasons specific to this
plan. The single carved-out exception is Banza brand chickpea-flour pasta
(sold and eaten as pasta, not as a bean dish), which is why the rule
matches on "Banza" / "chickpea pasta" / "chickpea penne" specifically
rather than on any chickpea-containing ingredient.

## Seafood must state a doneness cue

This is a food-safety non-negotiable, not a style preference. Undercooked
fish or shellfish carries real risk, and that risk is elevated for someone
managing liver disease (reduced tolerance for foodborne illness). Every
seafood card must therefore state a concrete temperature or doneness
signal (e.g. "145°F", "opaque and flakes easily") in an actual step — write
this in even if the user's request didn't ask for it.

## Sodium / saturated fat soft flags (900 mg / 8 g per card)

These come from daily ceilings of 2000 mg sodium and 13 g saturated fat
spread across roughly meals+snacks in a day — a single card near or over
half the daily budget is worth flagging so the person planning meals can
balance the rest of the day, even though one high-sodium or high-satfat
card isn't automatically disqualifying the way the hard-fail rules are.

## Bedtime-snack tag / protein floor

At least one card in the dataset must be tagged `bedtime-snack` — a
~50 g combined carb+protein snack close to bedtime is a specific
liver-health recommendation (supports overnight protein synthesis and
blood sugar stability in cirrhosis management), not an arbitrary category.
When drafting a card intended for this purpose, hit that combined
carb+protein target and apply the tag.
