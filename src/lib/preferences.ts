/**
 * Small per-browser preferences persisted to localStorage. Mirrors the
 * defensive-parsing idiom in `shareState.ts`: invalid stored values or a
 * throwing/inaccessible `localStorage` (e.g. private browsing) fall back
 * silently to the documented default, never throw.
 */

export type GroceryDisplayMode = 'purchase' | 'purchase+raw';

const DISPLAY_MODE_KEY = 'mealplan.groceryDisplayMode';
const SHOW_SOURCE_RECIPES_KEY = 'mealplan.showSourceRecipes';

const DEFAULT_DISPLAY_MODE: GroceryDisplayMode = 'purchase';
const DEFAULT_SHOW_SOURCE_RECIPES = false;

function isGroceryDisplayMode(value: string): value is GroceryDisplayMode {
  return value === 'purchase' || value === 'purchase+raw';
}

/** Reads the persisted grocery display mode, defaulting to 'purchase'. */
export function getGroceryDisplayMode(): GroceryDisplayMode {
  try {
    const stored = window.localStorage.getItem(DISPLAY_MODE_KEY);
    if (stored !== null && isGroceryDisplayMode(stored)) return stored;
  } catch {
    // localStorage unavailable (e.g. private browsing) - fall through to default.
  }
  return DEFAULT_DISPLAY_MODE;
}

/** Persists the grocery display mode. Swallows storage failures. */
export function setGroceryDisplayMode(mode: GroceryDisplayMode): void {
  try {
    window.localStorage.setItem(DISPLAY_MODE_KEY, mode);
  } catch {
    // Ignore - preference just won't persist this session.
  }
}

/** Reads the persisted "show contributing recipes" toggle, defaulting to false. */
export function getShowSourceRecipes(): boolean {
  try {
    const stored = window.localStorage.getItem(SHOW_SOURCE_RECIPES_KEY);
    if (stored === 'true') return true;
    if (stored === 'false') return false;
  } catch {
    // localStorage unavailable (e.g. private browsing) - fall through to default.
  }
  return DEFAULT_SHOW_SOURCE_RECIPES;
}

/** Persists the "show contributing recipes" toggle. Swallows storage failures. */
export function setShowSourceRecipes(show: boolean): void {
  try {
    window.localStorage.setItem(SHOW_SOURCE_RECIPES_KEY, String(show));
  } catch {
    // Ignore - preference just won't persist this session.
  }
}
