import { describe, it, expect } from 'vitest';
import type { MealCard } from '../data/schema';
import { MEAL_CARDS } from '../data/cards';
import { TAG_IDS } from '../data/tags';
import {
  normalize,
  tokenize,
  buildHaystack,
  buildHaystackMap,
  filterCards,
  facetCounts,
  type FilterCriteria,
} from './search';

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

const salmon = makeCard({
  id: 'salmon',
  name: 'Sautéed Salmon Bowl',
  mealType: 'dinner',
  tags: ['seafood', 'gluten-free', 'high-protein'],
  ingredients: [
    { name: 'Salmon fillet', shoppingName: 'Salmon', quantity: 150, unit: 'g', section: 'protein' },
    { name: 'Quinoa (cooked)', shoppingName: 'Quinoa', quantity: 1, unit: 'cup', section: 'grains' },
  ],
});
const tacos = makeCard({
  id: 'tacos',
  name: 'Chicken Tacos',
  mealType: 'lunch',
  tags: ['mexican-inspired', 'high-protein'],
  ingredients: [{ name: 'Jalapeño', quantity: 1, unit: 'each', section: 'produce' }],
});
const yogurt = makeCard({
  id: 'yogurt',
  name: 'Greek Yogurt Bowl',
  mealType: 'breakfast',
  tags: ['vegetarian', 'no-cook', 'high-protein'],
  ingredients: [{ name: 'Greek yogurt', quantity: 1, unit: 'cup', section: 'dairy' }],
});
const CARDS = [salmon, tacos, yogurt];
const NONE: FilterCriteria = { query: '', mealType: 'all', tags: [] };

describe('normalize / tokenize', () => {
  it('lowercases, trims and strips diacritics', () => {
    expect(normalize('  SAUTÉ ')).toBe('saute');
    expect(normalize('Jalapeño')).toBe('jalapeno');
  });
  it('tokenizes on whitespace and drops empties', () => {
    expect(tokenize('  Greek   yogurt ')).toEqual(['greek', 'yogurt']);
    expect(tokenize('')).toEqual([]);
  });
});

describe('buildHaystack', () => {
  it('includes name, ingredient names, shoppingNames and tag ids + labels', () => {
    const hay = buildHaystack(salmon);
    expect(hay).toContain('sauteed salmon bowl');
    expect(hay).toContain('salmon fillet');
    expect(hay).toContain('quinoa');
    expect(hay).toContain('gluten-free');
    expect(hay).toContain('high protein');
  });
  it('does not include steps or cooksNotes', () => {
    const c = makeCard({ steps: ['Zzzsecretstep'], cooksNotes: 'Qqqsecretnote' });
    const hay = buildHaystack(c);
    expect(hay).not.toContain('zzzsecretstep');
    expect(hay).not.toContain('qqqsecretnote');
  });
});

describe('filterCards', () => {
  it('returns all cards for an empty query with no filters', () => {
    expect(filterCards(CARDS, NONE)).toHaveLength(3);
  });
  it('matches case- and diacritic-insensitively', () => {
    expect(filterCards(CARDS, { ...NONE, query: 'saute' }).map((c) => c.id)).toEqual(['salmon']);
    expect(filterCards(CARDS, { ...NONE, query: 'jalapeno' }).map((c) => c.id)).toEqual(['tacos']);
    expect(filterCards(CARDS, { ...NONE, query: 'JALAPEÑO' }).map((c) => c.id)).toEqual(['tacos']);
  });
  it('ANDs multiple tokens', () => {
    expect(filterCards(CARDS, { ...NONE, query: 'bowl' })).toHaveLength(2);
    expect(filterCards(CARDS, { ...NONE, query: 'bowl salmon' }).map((c) => c.id)).toEqual(['salmon']);
    expect(filterCards(CARDS, { ...NONE, query: 'bowl tacos' })).toHaveLength(0);
  });
  it('matches ingredient names', () => {
    expect(filterCards(CARDS, { ...NONE, query: 'quinoa' }).map((c) => c.id)).toEqual(['salmon']);
  });
  it('matches tag labels', () => {
    expect(filterCards(CARDS, { ...NONE, query: 'gluten free' }).map((c) => c.id)).toEqual(['salmon']);
  });
  it('combines query, meal type and tags', () => {
    expect(filterCards(CARDS, { query: 'bowl', mealType: 'breakfast', tags: [] }).map((c) => c.id)).toEqual(['yogurt']);
    expect(filterCards(CARDS, { query: '', mealType: 'all', tags: ['high-protein', 'seafood'] }).map((c) => c.id)).toEqual(['salmon']);
    expect(filterCards(CARDS, { query: 'bowl', mealType: 'lunch', tags: [] })).toHaveLength(0);
  });
  it('gives the same results with a prebuilt haystack map', () => {
    const hay = buildHaystackMap(CARDS);
    expect(filterCards(CARDS, { ...NONE, query: 'quinoa' }, hay)).toEqual(
      filterCards(CARDS, { ...NONE, query: 'quinoa' }),
    );
  });
});

describe('facetCounts', () => {
  it('mealType.all equals the sum of the per-type counts', () => {
    const f = facetCounts(CARDS, { ...NONE, query: 'bowl' });
    expect(f.mealType.all).toBe(2);
    expect(f.mealType.breakfast + f.mealType.lunch + f.mealType.dinner + f.mealType.snack).toBe(2);
  });
  it('releases the mealType axis for meal-type counts', () => {
    const a = facetCounts(CARDS, { ...NONE, mealType: 'dinner' });
    const b = facetCounts(CARDS, { ...NONE, mealType: 'breakfast' });
    expect(a.mealType).toEqual(b.mealType);
    expect(a.mealType.dinner).toBe(filterCards(CARDS, { ...NONE, mealType: 'dinner' }).length);
  });
  it('tag count equals the result count if that tag were added', () => {
    const c: FilterCriteria = { query: '', mealType: 'all', tags: ['high-protein'] };
    const f = facetCounts(CARDS, c);
    expect(f.tags['high-protein']).toBe(filterCards(CARDS, c).length);
    expect(f.tags.seafood).toBe(filterCards(CARDS, { ...c, tags: [...c.tags, 'seafood'] }).length);
    expect(f.tags['bedtime-snack']).toBe(0);
  });
  it('scopes tag counts to the selected meal type', () => {
    const f = facetCounts(CARDS, { ...NONE, mealType: 'lunch' });
    expect(f.tags['high-protein']).toBe(1);
    expect(f.tags.seafood).toBe(0);
  });
  it('has an entry for every registered tag', () => {
    const f = facetCounts(CARDS, NONE);
    for (const t of TAG_IDS) expect(typeof f.tags[t]).toBe('number');
  });
});

describe('real dataset smoke', () => {
  it('returns every card with no criteria', () => {
    expect(filterCards(MEAL_CARDS, NONE)).toHaveLength(MEAL_CARDS.length);
    expect(facetCounts(MEAL_CARDS, NONE).mealType.all).toBe(MEAL_CARDS.length);
  });
  it('per-type counts match a direct tally', () => {
    const f = facetCounts(MEAL_CARDS, NONE);
    for (const t of ['breakfast', 'lunch', 'dinner', 'snack'] as const) {
      expect(f.mealType[t]).toBe(MEAL_CARDS.filter((c) => c.mealType === t).length);
    }
  });
  it('finds salmon cards', () => {
    expect(filterCards(MEAL_CARDS, { ...NONE, query: 'salmon' }).length).toBeGreaterThan(0);
  });
});
