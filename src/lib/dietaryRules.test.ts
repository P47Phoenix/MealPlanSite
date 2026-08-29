import { describe, it, expect } from 'vitest';
import type { MealCard } from '../data/schema';
import {
  validateCard,
  validateDataset,
  checkBedtimeSnackPresent,
} from './dietaryRules';

function baseCard(overrides: Partial<MealCard> = {}): MealCard {
  return {
    id: 'test-card',
    name: 'Test Card',
    mealType: 'dinner',
    tags: ['high-protein'],
    prepTimeMinutes: 10,
    cookTimeMinutes: 10,
    ingredients: [{ name: 'Chicken breast', quantity: 150, unit: 'g', section: 'protein' }],
    steps: ['Cook the chicken until done, internal temp 165°F.'],
    nutrition: {
      calories: { value: 400, confidence: 'verified' },
      proteinG: { value: 40, confidence: 'verified' },
      sodiumMg: { value: 100, confidence: 'verified' },
      satFatG: { value: 2, confidence: 'verified' },
      carbsG: { value: 20, confidence: 'estimated' },
    },
    cooksNotes: null,
    ...overrides,
  };
}

describe('validateCard - compliant card', () => {
  it('produces no violations for a fully compliant card', () => {
    const card = baseCard();
    expect(validateCard(card)).toEqual([]);
  });
});

describe('validateCard - red meat hard-fail', () => {
  it('flags a card containing beef', () => {
    const card = baseCard({
      ingredients: [{ name: 'Ground beef', quantity: 150, unit: 'g', section: 'protein' }],
    });
    const violations = validateCard(card);
    expect(violations.some((v) => v.rule === 'red-meat')).toBe(true);
  });

  it('flags a card containing pork or lamb', () => {
    const pork = baseCard({
      ingredients: [{ name: 'Pork chop', quantity: 150, unit: 'g', section: 'protein' }],
    });
    const lamb = baseCard({
      ingredients: [{ name: 'Lamb shank', quantity: 150, unit: 'g', section: 'protein' }],
    });
    expect(validateCard(pork).some((v) => v.rule === 'red-meat')).toBe(true);
    expect(validateCard(lamb).some((v) => v.rule === 'red-meat')).toBe(true);
  });

  it('does not flag chicken or turkey sausage (poultry exception)', () => {
    const chickenSausage = baseCard({
      ingredients: [{ name: 'Chicken sausage', quantity: 90, unit: 'g', section: 'protein' }],
    });
    const turkeySausage = baseCard({
      ingredients: [{ name: 'Turkey sausage links', quantity: 90, unit: 'g', section: 'protein' }],
    });
    expect(validateCard(chickenSausage).some((v) => v.rule === 'red-meat')).toBe(false);
    expect(validateCard(turkeySausage).some((v) => v.rule === 'red-meat')).toBe(false);
  });

  it('still flags plain/unqualified sausage', () => {
    const card = baseCard({
      ingredients: [{ name: 'Sausage links', quantity: 90, unit: 'g', section: 'protein' }],
    });
    expect(validateCard(card).some((v) => v.rule === 'red-meat')).toBe(true);
  });
});

describe('validateCard - legume hard-fail', () => {
  it('flags a card containing plain black beans', () => {
    const card = baseCard({
      ingredients: [{ name: 'Black beans', quantity: 1, unit: 'cup', section: 'pantry' }],
    });
    const violations = validateCard(card);
    expect(violations.some((v) => v.rule === 'legume')).toBe(true);
  });

  it('flags a card containing plain lentils', () => {
    const card = baseCard({
      ingredients: [{ name: 'Lentils', quantity: 1, unit: 'cup', section: 'pantry' }],
    });
    expect(validateCard(card).some((v) => v.rule === 'legume')).toBe(true);
  });

  it('does not flag Banza chickpea penne (allow-listed exception)', () => {
    const card = baseCard({
      name: 'Chickpea Penne Pomodoro',
      ingredients: [
        { name: 'Banza chickpea penne (dry)', quantity: 85, unit: 'g', section: 'grains' },
      ],
    });
    expect(validateCard(card).some((v) => v.rule === 'legume')).toBe(false);
  });

  it('still flags plain chickpeas that are not the Banza pasta exception', () => {
    const card = baseCard({
      name: 'Chickpea Salad',
      ingredients: [{ name: 'Chickpeas', quantity: 1, unit: 'cup', section: 'pantry' }],
    });
    expect(validateCard(card).some((v) => v.rule === 'legume')).toBe(true);
  });
});

describe('validateCard - seafood doneness hard-fail', () => {
  it('flags a seafood card with no temperature/doneness cue in any step', () => {
    const card = baseCard({
      ingredients: [{ name: 'Salmon', quantity: 150, unit: 'g', section: 'protein' }],
      steps: ['Cook the salmon in a pan.'],
    });
    const violations = validateCard(card);
    expect(violations.some((v) => v.rule === 'seafood-temp')).toBe(true);
  });

  it('does not flag a seafood card with a proper doneness cue', () => {
    const card = baseCard({
      ingredients: [{ name: 'Tilapia', quantity: 150, unit: 'g', section: 'protein' }],
      steps: ['Cook until opaque and flakes easily with a fork, internal temp 145°F.'],
    });
    expect(validateCard(card).some((v) => v.rule === 'seafood-temp')).toBe(false);
  });
});

describe('checkBedtimeSnackPresent - dataset level', () => {
  it('passes when at least one card has the bedtime-snack tag', () => {
    const cards = [baseCard({ id: 'a', tags: ['bedtime-snack'] }), baseCard({ id: 'b' })];
    expect(checkBedtimeSnackPresent(cards)).toEqual([]);
  });

  it('fails when no card has the bedtime-snack tag', () => {
    const cards = [baseCard({ id: 'a' }), baseCard({ id: 'b' })];
    const violations = checkBedtimeSnackPresent(cards);
    expect(violations.length).toBe(1);
    expect(violations[0].rule).toBe('bedtime-snack-required');
  });
});

describe('validateDataset', () => {
  it('aggregates per-card and dataset-level violations', () => {
    const goodCard = baseCard({ id: 'good', tags: ['bedtime-snack'] });
    const badCard = baseCard({
      id: 'bad',
      ingredients: [{ name: 'Beef', quantity: 100, unit: 'g', section: 'protein' }],
    });
    const violations = validateDataset([goodCard, badCard]);
    expect(violations.some((v) => v.cardId === 'bad' && v.rule === 'red-meat')).toBe(true);
    expect(violations.some((v) => v.rule === 'bedtime-snack-required')).toBe(false);
  });
});
