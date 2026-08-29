# Contributing meal cards

This doc is for a human or AI assistant adding or editing meal cards in Meal
Card Planner.

## Where card data lives

- `src/data/schema.ts` — the `MealCard` TypeScript type and its field docs.
- `src/data/cards/breakfast.ts`, `lunch.ts`, `dinner.ts`, `snacks.ts` — one
  array of `MealCard` objects per meal type. Add your card to the array that
  matches its `mealType`.
- `src/data/cards/index.ts` — combines the four arrays into `ALL_CARDS`.
- `src/data/cards.ts` — barrel file that re-exports `MEAL_CARDS` (what the
  rest of the app and the validator script import).

You should not need to touch `index.ts` or `cards.ts` when adding a card —
just add an object to the right per-meal-type file's array.

## The `MealCard` schema

```ts
interface MealCard {
  id: string;                 // kebab-case slug, unique, e.g. "salmon-quinoa-bowl"
  name: string;                // display name
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  tags: string[];               // see "Tags" below
  prepTimeMinutes: number;
  cookTimeMinutes: number;
  ingredients: Ingredient[];    // see below
  steps: string[];              // numbered, sequential, cookable instructions
  nutrition: NutritionInfo;     // see below
  cooksNotes: string | null;
}

interface Ingredient {
  name: string;
  shoppingName?: string;         // optional; see "Ingredient shoppingName" below
  quantity: number;
  unit: string;                 // "g", "cup", "tbsp", "oz", "slice", "each", ...
  section: 'produce' | 'protein' | 'dairy' | 'pantry' | 'grains' | 'bakery' | 'other';
}

interface NutritionFigure {
  value: number;
  confidence: 'verified' | 'estimated';
}

interface NutritionInfo {
  calories: NutritionFigure;   // kcal
  proteinG: NutritionFigure;   // grams
  sodiumMg: NutritionFigure;   // milligrams
  satFatG: NutritionFigure;    // grams
  carbsG: NutritionFigure;     // grams
}
```

All fields are required except `shoppingName`. `cooksNotes` is `null` (not
omitted) when there is no note.

### Ingredient `shoppingName`

The grocery list aggregates ingredients by `shoppingName` when present,
falling back to `name` otherwise. Set `shoppingName` whenever a recipe's
`name` differs from the plain product you'd actually buy at the store:

- Strip prep-state adjectives: "Roast chicken", "Shredded chicken", "Grilled
  chicken", "Cooked chicken" → `shoppingName: 'Chicken breast'`. "Quinoa
  (cooked)" / "Quinoa (dry)" → `shoppingName: 'Quinoa'`.
- Keep a brand name if it's the actual product to buy: "Banza chickpea penne
  (dry)" → `shoppingName: 'Banza chickpea penne'` (drops the prep-state
  parenthetical, keeps the brand).
- Do **not** set `shoppingName` — or merge — for genuinely different store
  products, e.g. deli-style "Roasted turkey breast" vs. raw "Fresh turkey
  breast cutlets".
- Never bundle two distinct products into a single ingredient entry (e.g.
  "Bell peppers and onion" as one line) — give each product its own
  `Ingredient` object so it can be shopped and aggregated correctly.

### Tags

Tags drive the Browse view's filter chips. Use existing tags where they
apply, and add new ones as needed:

- `bedtime-snack` — must be applied to any card intended as the nightly
  bedtime snack. **At least one card in the whole dataset must carry this
  tag** — the validator checks this at the dataset level.
- `mediterranean` — soft tag for salmon/olive-oil/vegetable-heavy cards.
- `high-protein`, `low-sodium`, `low-fat`, `seafood`, `gluten-free`,
  `vegetarian`, `no-cook`, `make-ahead` — apply where accurate.

## Nutrition: verified vs. estimated

- `calories`, `proteinG`, `sodiumMg`, and `satFatG` should be marked
  `'verified'` whenever the figure comes from the seed dataset or from a
  labeled/measured source (a nutrition label, a trusted database entry for the
  exact quantity used).
- `carbsG` is not present in the original seed data. Estimate it from the
  ingredient list — starchy/grain/fruit-heavy meals (oats, quinoa, rice,
  potato, banana, tortillas) get higher carb estimates; egg/protein-heavy,
  low-produce meals get lower ones — and mark it `'estimated'`.
- Any figure you compute yourself rather than pull from a verified source
  should be marked `'estimated'`, not `'verified'`. Don't mark a guess as
  verified.

## Dietary hard-fail rules

Implemented in `src/lib/dietaryRules.ts` and enforced by
`npm run validate:cards`. A card (or the dataset) that fails any of these
causes the validator to exit non-zero:

1. **Schema validation** — every required field must be present with the
   correct type (see schema above).
2. **No red meat** — no ingredient, tag, or name may contain "beef", "pork",
   "lamb", "bacon", "ham", "veal", or "sausage" (case-insensitive, whole-word
   match), **except** "sausage" qualified as "chicken" or "turkey" (e.g.
   "Chicken sausage", "Turkey sausage links") — those are lean poultry
   products and are allowed. Unqualified "sausage" is still a hard fail
   (implicitly pork), as is sausage of any other red-meat animal.
   Chicken/turkey sausage still runs high in sodium in most standard
   products (700+ mg per serving is common) — **prefer a low-sodium chicken
   or turkey sausage product specifically** (e.g. Jimmy Dean Low Sodium
   Chicken Breakfast Sausage Links, ~58 mg sodium per link) when adding a
   sausage-based card, look up that specific product's own nutrition panel
   rather than a generic "chicken sausage" figure, and name the low-sodium
   product in the ingredient name and/or `cooksNotes` so the choice is
   explicit rather than assumed.
3. **No legumes, with one exception** — no ingredient may contain "bean",
   "lentil", "chickpea", or "garbanzo" **unless** it is specifically Banza
   chickpea pasta / chickpea penne (ingredient name contains "Banza" or
   "chickpea pasta"/"chickpea penne", or the card name contains "Chickpea
   Penne"). Plain chickpeas, black beans, lentils, etc. are still hard
   failures even if the card also happens to use Banza elsewhere.
4. **Seafood must state a safe doneness cue** — if any ingredient is a fish
   or shellfish (salmon, tilapia, tuna, shrimp, cod, halibut, crab, lobster,
   scallop, or generic "fish"), at least one step must contain a temperature
   (e.g. "145°F", "165°F", "degrees") or a doneness cue such as "opaque",
   "flakes easily", or "internal temp".
5. **Dataset-level: at least one bedtime snack** — across the whole dataset,
   at least one card must carry the `bedtime-snack` tag.

Run the validator with:

```bash
npm run validate:cards
```

It prints a clear list of violations (rule, card id, message) and exits
non-zero on any hard failure; on success it prints a summary (card count, meal
type counts, tag counts) and exits 0.

## Worked example: adding a new compliant card

Say you want to add a chicken-and-vegetable dinner. Add this object to the
`dinnerCards` array in `src/data/cards/dinner.ts`:

```ts
{
  id: 'lemon-chicken-and-broccoli',
  name: 'Lemon Chicken & Broccoli',
  mealType: 'dinner',
  tags: ['high-protein', 'low-sodium', 'gluten-free'],
  prepTimeMinutes: 10,
  cookTimeMinutes: 20,
  ingredients: [
    { name: 'Chicken breast', quantity: 150, unit: 'g', section: 'protein' },
    { name: 'Broccoli', quantity: 1.5, unit: 'cup', section: 'produce' },
    { name: 'Lemon', quantity: 0.5, unit: 'each', section: 'produce' },
    { name: 'Olive oil', quantity: 1, unit: 'tbsp', section: 'pantry' },
  ],
  steps: [
    'Preheat the oven to 400°F.',
    'Toss the chicken breast and broccoli with olive oil and lemon juice on a sheet pan.',
    'Roast for 18-20 minutes, until the chicken reaches an internal temp of 165°F and the broccoli is tender.',
  ],
  nutrition: {
    calories: { value: 410, confidence: 'verified' },
    proteinG: { value: 45, confidence: 'verified' },
    sodiumMg: { value: 110, confidence: 'verified' },
    satFatG: { value: 2.2, confidence: 'verified' },
    carbsG: { value: 15, confidence: 'estimated' },
  },
  cooksNotes: null,
},
```

Notes on why this passes:

- No beef/pork/lamb.
- No legumes.
- Not a seafood card, so the doneness-cue rule doesn't apply (though the step
  does state one anyway, which is good practice for poultry too).
- All required fields present with correct types.

Then run:

```bash
npm run validate:cards
```

Expected output ends with `Validation PASSED.` and a summary showing the new
card counted under `dinner` and its tags counted. If you introduced a typo'd
field or a banned ingredient, the script will print the specific rule and
card id that failed instead.
