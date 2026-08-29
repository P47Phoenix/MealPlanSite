/**
 * Core data schema for the Meal Card Planner.
 */
import type { TagId } from './tags';

export type { TagId };

/** Which meal of the day a card belongs to. */
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

/** Which grocery-store section an ingredient is typically found in. */
export type IngredientSection =
  | 'produce'
  | 'protein'
  | 'dairy'
  | 'pantry'
  | 'grains'
  | 'bakery'
  | 'other';

/** A single ingredient line used by a meal card. */
export interface Ingredient {
  /** Human-readable ingredient name, e.g. "Greek yogurt (nonfat)". */
  name: string;
  /**
   * Canonical store-product name used for grocery-list aggregation, e.g.
   * "Chicken breast" for a `name` of "Shredded chicken". Should be the raw/
   * base product with no prep-state adjectives ("cooked", "shredded",
   * "grilled") and never bundle two distinct products into one entry. Falls
   * back to `name` when omitted.
   */
  shoppingName?: string;
  /** Numeric quantity, e.g. 1, 0.5, 255. */
  quantity: number;
  /** Unit for the quantity, e.g. "g", "cup", "tbsp", "oz", "slice". */
  unit: string;
  /** Grocery-store section this ingredient belongs to. */
  section: IngredientSection;
}

/** Confidence level for a nutrition figure. */
export type NutritionConfidence = 'verified' | 'estimated';

/** A single nutrition figure with a confidence flag. */
export interface NutritionFigure {
  /** The numeric value of the figure, in the figure's stated unit. */
  value: number;
  /** Whether this figure is sourced/verified data or an estimate. */
  confidence: NutritionConfidence;
}

/** Full nutrition panel for a meal card. */
export interface NutritionInfo {
  /** Calories (kcal). */
  calories: NutritionFigure;
  /** Protein, in grams. */
  proteinG: NutritionFigure;
  /** Sodium, in milligrams. */
  sodiumMg: NutritionFigure;
  /** Saturated fat, in grams. */
  satFatG: NutritionFigure;
  /** Carbohydrates, in grams. */
  carbsG: NutritionFigure;
}

/**
 * A single meal card: one recipe/meal option that can be browsed, viewed in
 * detail, and selected for grocery-list generation.
 */
export interface MealCard {
  /** Stable kebab-case slug identifier, e.g. "greek-yogurt-power-bowl". */
  id: string;
  /** Display name of the meal. */
  name: string;
  /** Which meal of the day this card is intended for. */
  mealType: MealType;
  /**
   * Tags used for filtering, drawn from the typed registry in `./tags.ts`
   * (e.g. 'bedtime-snack', 'mediterranean', 'high-protein', 'seafood').
   */
  tags: TagId[];
  /** Active prep time in minutes (chopping, mixing, etc.). */
  prepTimeMinutes: number;
  /** Active/passive cook time in minutes (baking, roasting, simmering, etc.). */
  cookTimeMinutes: number;
  /** Full ingredient list with quantities and grocery sections. */
  ingredients: Ingredient[];
  /** Numbered, sequential, cookable instructions. */
  steps: string[];
  /** Nutrition panel, each figure flagged verified or estimated. */
  nutrition: NutritionInfo;
  /** Optional free-text cook's note, or null if none. */
  cooksNotes: string | null;
}
