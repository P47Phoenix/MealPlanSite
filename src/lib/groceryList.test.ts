import { describe, it, expect } from 'vitest';
import type { MealCard } from '../data/schema';
import { buildGroceryList, computePurchaseQuantity } from './groceryList';
import { MEAL_CARDS } from '../data/cards';
import type { PurchaseUnitEntry } from '../data/purchaseUnits';

function makeCard(overrides: Partial<MealCard>): MealCard {
  return {
    id: 'x',
    name: 'X',
    mealType: 'dinner',
    tags: [],
    prepTimeMinutes: 1,
    cookTimeMinutes: 1,
    ingredients: [],
    steps: ['Step.'],
    nutrition: {
      calories: { value: 1, confidence: 'estimated' },
      proteinG: { value: 1, confidence: 'estimated' },
      sodiumMg: { value: 1, confidence: 'estimated' },
      satFatG: { value: 1, confidence: 'estimated' },
      carbsG: { value: 1, confidence: 'estimated' },
    },
    cooksNotes: null,
    ...overrides,
  };
}

describe('buildGroceryList - simple summing', () => {
  it('sums matching ingredient+unit pairs across cards', () => {
    const cardA = makeCard({
      id: 'a',
      name: 'Card A',
      ingredients: [{ name: 'Olive oil', quantity: 2, unit: 'tbsp', section: 'pantry' }],
    });
    const cardB = makeCard({
      id: 'b',
      name: 'Card B',
      ingredients: [{ name: 'olive oil', quantity: 1, unit: 'tbsp', section: 'pantry' }],
    });
    const list = buildGroceryList([cardA, cardB]);
    expect(list.pantry).toHaveLength(1);
    expect(list.pantry[0].quantity).toBe(3);
    expect(list.pantry[0].unit).toBe('tbsp');
  });
});

describe('buildGroceryList - section grouping', () => {
  it('groups items into their correct sections, sorted alphabetically', () => {
    const card = makeCard({
      ingredients: [
        { name: 'Zucchini', quantity: 1, unit: 'each', section: 'produce' },
        { name: 'Apple', quantity: 1, unit: 'each', section: 'produce' },
        { name: 'Chicken', quantity: 1, unit: 'g', section: 'protein' },
      ],
    });
    const list = buildGroceryList([card]);
    expect(list.produce.map((i) => i.name)).toEqual(['Apple', 'Zucchini']);
    expect(list.protein.map((i) => i.name)).toEqual(['Chicken']);
  });
});

describe('buildGroceryList - case-insensitive dedup', () => {
  it('dedups differently-cased ingredient names into one item', () => {
    const cardA = makeCard({ ingredients: [{ name: 'Olive Oil', quantity: 1, unit: 'tbsp', section: 'pantry' }] });
    const cardB = makeCard({ ingredients: [{ name: 'OLIVE OIL', quantity: 1, unit: 'tbsp', section: 'pantry' }] });
    const list = buildGroceryList([cardA, cardB]);
    expect(list.pantry).toHaveLength(1);
    expect(list.pantry[0].quantity).toBe(2);
  });
});

describe('buildGroceryList - volume unit normalization', () => {
  it('normalizes tsp into tbsp/cup when the total is a clean multiple', () => {
    const card = makeCard({
      ingredients: [
        { name: 'Rice vinegar', quantity: 3, unit: 'tsp', section: 'pantry' },
      ],
    });
    const list = buildGroceryList([card]);
    expect(list.pantry[0].quantity).toBe(1);
    expect(list.pantry[0].unit).toBe('tbsp');
  });
});

describe('buildGroceryList - shoppingName aggregation', () => {
  it('merges two differently-named ingredients with the same shoppingName into one line', () => {
    const cardA = makeCard({
      id: 'a',
      name: 'Card A',
      ingredients: [{ name: 'Shredded chicken', shoppingName: 'Chicken breast', quantity: 120, unit: 'g', section: 'protein' }],
    });
    const cardB = makeCard({
      id: 'b',
      name: 'Card B',
      ingredients: [{ name: 'Roast chicken', shoppingName: 'Chicken breast', quantity: 150, unit: 'g', section: 'protein' }],
    });
    const list = buildGroceryList([cardA, cardB]);
    expect(list.protein).toHaveLength(1);
    expect(list.protein[0].name).toBe('Chicken breast');
    expect(list.protein[0].quantity).toBe(270);
  });

  it('falls back to name when shoppingName is omitted', () => {
    const card = makeCard({
      ingredients: [{ name: 'Broccoli', quantity: 1, unit: 'cup', section: 'produce' }],
    });
    const list = buildGroceryList([card]);
    expect(list.produce[0].name).toBe('Broccoli');
  });
});

describe('buildGroceryList - real card aggregation', () => {
  it('aggregates ingredients across real cards from the dataset', () => {
    const roastChicken = MEAL_CARDS.find((c) => c.id === 'roast-chicken-over-greens')!;
    const chickenBowl = MEAL_CARDS.find((c) => c.id === 'turkey-sweet-potato-bowl')!;
    const salmonBowl = MEAL_CARDS.find((c) => c.id === 'salmon-quinoa-bowl')!;
    expect(roastChicken).toBeTruthy();
    expect(chickenBowl).toBeTruthy();
    expect(salmonBowl).toBeTruthy();

    const list = buildGroceryList([roastChicken, chickenBowl, salmonBowl]);

    // olive oil appears in all three cards, 1 tbsp each -> 3 tbsp total
    const oliveOil = list.pantry.find((i) => i.name.toLowerCase() === 'olive oil');
    expect(oliveOil).toBeTruthy();
    expect(oliveOil!.quantity).toBe(3);
    expect(oliveOil!.unit).toBe('tbsp');

    // sweet potato appears in two of the three cards, 1 each -> 2 each
    const sweetPotato = list.produce.find((i) => i.name.toLowerCase() === 'sweet potato');
    expect(sweetPotato).toBeTruthy();
    expect(sweetPotato!.quantity).toBe(2);
    expect(sweetPotato!.unit).toBe('each');

    // Every section's items should be alphabetically sorted.
    for (const items of Object.values(list)) {
      const names = items.map((i) => i.name);
      const sorted = [...names].sort((a, b) => a.localeCompare(b));
      expect(names).toEqual(sorted);
    }
  });

  it('merges chicken-bearing cards into a single Chicken breast line via shoppingName', () => {
    const roastChickenLunch = MEAL_CARDS.find((c) => c.id === 'roast-chicken-over-greens')!;
    const chickpeaDinner = MEAL_CARDS.find((c) => c.id === 'chickpea-penne-pomodoro-chicken')!;
    expect(roastChickenLunch).toBeTruthy();
    expect(chickpeaDinner).toBeTruthy();

    const list = buildGroceryList([roastChickenLunch, chickpeaDinner]);
    const chickenLines = list.protein.filter((i) => i.name === 'Chicken breast');
    expect(chickenLines).toHaveLength(1);
    expect(chickenLines[0].quantity).toBe(270);
  });
});

describe('computePurchaseQuantity', () => {
  const lbEntry: PurchaseUnitEntry = { unitLabel: 'lb', packageSize: 454, packageUnit: 'g' };

  it('rounds up to the next whole package', () => {
    expect(computePurchaseQuantity(130, 'g', lbEntry)).toEqual({ quantity: 1, unit: 'lb' });
  });

  it('handles an exact multiple of the package size', () => {
    expect(computePurchaseQuantity(908, 'g', lbEntry)).toEqual({ quantity: 2, unit: 'lb' });
  });

  it('returns undefined when there is no purchase-unit entry', () => {
    expect(computePurchaseQuantity(130, 'g', undefined)).toBeUndefined();
  });

  it('returns undefined when units are incompatible (mass vs. count)', () => {
    const eachEntry: PurchaseUnitEntry = { unitLabel: 'each', packageSize: 1, packageUnit: 'each' };
    expect(computePurchaseQuantity(130, 'g', eachEntry)).toBeUndefined();
  });

  it('converts within the volume family (tbsp raw vs. cup package)', () => {
    const bottleEntry: PurchaseUnitEntry = { unitLabel: 'bottle', packageSize: 1, packageUnit: 'cup' };
    // 1 cup = 48 tsp = 16 tbsp, so 8 tbsp is half a cup -> ceil to 1 bottle.
    expect(computePurchaseQuantity(8, 'tbsp', bottleEntry)).toEqual({ quantity: 1, unit: 'bottle' });
  });

  it('does not throw on zero or negative raw quantity, returning a zero purchase quantity', () => {
    expect(computePurchaseQuantity(0, 'g', lbEntry)).toEqual({ quantity: 0, unit: 'lb' });
    expect(computePurchaseQuantity(-5, 'g', lbEntry)).toEqual({ quantity: 0, unit: 'lb' });
  });
});

describe('buildGroceryList - purchase-quantity wiring', () => {
  it('attaches a purchase quantity for an ingredient present in PURCHASE_UNITS', () => {
    const card = makeCard({
      ingredients: [{ name: 'Chicken breast', quantity: 130, unit: 'g', section: 'protein' }],
    });
    const list = buildGroceryList([card]);
    expect(list.protein[0].purchase).toEqual({ quantity: 1, unit: 'lb' });
  });

  it('leaves purchase undefined for an ingredient absent from PURCHASE_UNITS', () => {
    const card = makeCard({
      ingredients: [{ name: 'Zucchini', quantity: 1, unit: 'each', section: 'produce' }],
    });
    const list = buildGroceryList([card]);
    expect(list.produce[0].purchase).toBeUndefined();
  });
});
