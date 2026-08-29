import type { MealType } from '../data/schema';
import { isTagId, type TagId } from '../data/tags';

const MEAL_TYPES: (MealType | 'all')[] = ['all', 'breakfast', 'lunch', 'dinner', 'snack'];

function isMealTypeOrAll(s: string): s is MealType | 'all' {
  return (MEAL_TYPES as string[]).includes(s);
}

/** All state that round-trips through the URL's query string. */
export interface ShareableState {
  query: string;
  mealType: MealType | 'all';
  activeTags: TagId[];
  selectedIds: Set<string>;
  view: 'browse' | 'detail';
  activeCardId: string | null;
  groceryOpen: boolean;
}

/** Encodes state into a URLSearchParams, omitting params at their default value. */
export function encodeState(state: ShareableState): URLSearchParams {
  const params = new URLSearchParams();

  if (state.query !== '') params.set('q', state.query);
  if (state.mealType !== 'all') params.set('type', state.mealType);
  if (state.activeTags.length > 0) params.set('tags', state.activeTags.join(','));
  if (state.selectedIds.size > 0) params.set('meals', Array.from(state.selectedIds).join(','));
  if (state.view === 'detail' && state.activeCardId) params.set('card', state.activeCardId);
  if (state.groceryOpen === true) params.set('grocery', '1');

  return params;
}

/**
 * Decodes a URL's query string into a partial ShareableState. Defensive:
 * unknown card/meal ids are dropped silently, invalid enum-like values are
 * omitted (caller applies its own defaults), and only keys actually present
 * in the URL are returned.
 */
export function decodeState(search: string, validIds: ReadonlySet<string>): Partial<ShareableState> {
  const params = new URLSearchParams(search);
  const result: Partial<ShareableState> = {};

  if (params.has('q')) result.query = params.get('q') ?? '';

  if (params.has('type')) {
    const type = params.get('type') ?? '';
    if (isMealTypeOrAll(type)) result.mealType = type;
  }

  if (params.has('tags')) {
    const tags = (params.get('tags') ?? '')
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0 && isTagId(t)) as TagId[];
    result.activeTags = tags;
  }

  if (params.has('meals')) {
    const ids = (params.get('meals') ?? '')
      .split(',')
      .map((id) => id.trim())
      .filter((id) => id.length > 0 && validIds.has(id));
    result.selectedIds = new Set(ids);
  }

  if (params.has('card')) {
    const cardId = params.get('card') ?? '';
    if (validIds.has(cardId)) {
      result.view = 'detail';
      result.activeCardId = cardId;
    }
  }

  if (params.has('grocery')) {
    result.groceryOpen = params.get('grocery') === '1';
  }

  return result;
}

/** Builds a full shareable URL (path + query string) for the given state. */
export function stateToUrl(state: ShareableState, base: string = window.location.pathname): string {
  const params = encodeState(state);
  const qs = params.toString();
  return qs ? `${base}?${qs}` : base;
}
