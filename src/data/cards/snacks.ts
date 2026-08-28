import type { MealCard } from '../schema';

export const snackCards: MealCard[] = [
  {
    id: 'bedtime-yogurt-banana-oats',
    name: 'Bedtime Yogurt, Banana & Oats',
    mealType: 'snack',
    tags: ['bedtime-snack', 'high-protein', 'low-sodium', 'no-cook', 'vegetarian'],
    prepTimeMinutes: 5,
    cookTimeMinutes: 0,
    ingredients: [
      { name: 'Greek yogurt', quantity: 170, unit: 'g', section: 'dairy' },
      { name: 'Banana', quantity: 1, unit: 'each', section: 'produce' },
      { name: 'Rolled oats', quantity: 20, unit: 'g', section: 'grains' },
    ],
    steps: [
      'Spoon 170 g Greek yogurt into a bowl.',
      'Slice the banana and stir it in.',
      'Stir in 20 g raw oats and let sit a couple of minutes to soften before eating.',
    ],
    nutrition: {
      calories: { value: 280, confidence: 'verified' },
      proteinG: { value: 21.2, confidence: 'verified' },
      sodiumMg: { value: 62, confidence: 'verified' },
      satFatG: { value: 0.6, confidence: 'verified' },
      carbsG: { value: 38, confidence: 'estimated' },
    },
    cooksNotes: 'The nightly non-negotiable — see the evidence note on the main plan.',
  },
  {
    id: 'bedtime-cottage-cheese-banana-oats',
    name: 'Bedtime Cottage Cheese, Banana & Oats',
    mealType: 'snack',
    tags: ['bedtime-snack', 'high-protein', 'low-sodium', 'no-cook', 'gluten-free', 'vegetarian'],
    prepTimeMinutes: 5,
    cookTimeMinutes: 0,
    ingredients: [
      { name: 'No-salt-added cottage cheese', quantity: 0.5, unit: 'cup', section: 'dairy' },
      { name: 'Banana', quantity: 1, unit: 'each', section: 'produce' },
      { name: 'Rolled oats', quantity: 20, unit: 'g', section: 'grains' },
    ],
    steps: [
      'Spoon ½ cup no-salt-added cottage cheese into a bowl.',
      'Slice the banana and stir it in.',
      'Stir in 20 g oats and serve.',
    ],
    nutrition: {
      calories: { value: 270, confidence: 'verified' },
      proteinG: { value: 15.9, confidence: 'verified' },
      sodiumMg: { value: 31, confidence: 'verified' },
      satFatG: { value: 1.4, confidence: 'verified' },
      carbsG: { value: 36, confidence: 'estimated' },
    },
    cooksNotes: null,
  },
  {
    id: 'apple-peanut-butter',
    name: 'Apple & Peanut Butter',
    mealType: 'snack',
    tags: ['low-sodium', 'no-cook', 'gluten-free', 'vegetarian'],
    prepTimeMinutes: 2,
    cookTimeMinutes: 0,
    ingredients: [
      { name: 'Apple', quantity: 1, unit: 'each', section: 'produce' },
      { name: 'Unsalted peanut butter', quantity: 1, unit: 'tbsp', section: 'pantry' },
    ],
    steps: [
      'Slice the apple.',
      'Serve with 1 tbsp unsalted peanut butter for dipping.',
    ],
    nutrition: {
      calories: { value: 191, confidence: 'verified' },
      proteinG: { value: 4.0, confidence: 'verified' },
      sodiumMg: { value: 5, confidence: 'verified' },
      satFatG: { value: 0.7, confidence: 'verified' },
      carbsG: { value: 28, confidence: 'estimated' },
    },
    cooksNotes: 'Good as an afternoon bridge, not a substitute for the bedtime snack.',
  },
];
