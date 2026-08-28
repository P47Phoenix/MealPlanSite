import { describe, it, expect } from 'vitest';
import type { MealCard } from '../data/schema';
import { buildGroceryList } from './groceryList';
import { MEAL_CARDS } from '../data/cards';

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
});
