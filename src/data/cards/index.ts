import type { MealCard } from '../schema';
import { breakfastCards } from './breakfast';
import { lunchCards } from './lunch';
import { dinnerCards } from './dinner';
import { snackCards } from './snacks';

export const ALL_CARDS: MealCard[] = [
  ...breakfastCards,
  ...lunchCards,
  ...dinnerCards,
  ...snackCards,
];
