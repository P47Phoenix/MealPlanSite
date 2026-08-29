import { describe, it, expect } from 'vitest';
import { encodeState, decodeState, stateToUrl, type ShareableState } from './shareState';

const validIds = new Set(['id1', 'id2', 'card-a']);

function makeState(overrides: Partial<ShareableState> = {}): ShareableState {
  return {
    query: '',
    mealType: 'all',
    activeTags: [],
    selectedIds: new Set(),
    view: 'browse',
    activeCardId: null,
    groceryOpen: false,
    ...overrides,
  };
}

describe('encodeState / decodeState round-trip', () => {
  it('round-trips a fully-populated state', () => {
    const state = makeState({
      query: 'chicken bowl',
      mealType: 'dinner',
      activeTags: ['high-protein', 'gluten-free'],
      selectedIds: new Set(['id1', 'id2']),
      view: 'detail',
      activeCardId: 'card-a',
      groceryOpen: true,
    });

    const params = encodeState(state);
    const decoded = decodeState('?' + params.toString(), validIds);

    expect(decoded.query).toBe('chicken bowl');
    expect(decoded.mealType).toBe('dinner');
    expect(decoded.activeTags).toEqual(['high-protein', 'gluten-free']);
    expect(decoded.selectedIds).toEqual(new Set(['id1', 'id2']));
    expect(decoded.view).toBe('detail');
    expect(decoded.activeCardId).toBe('card-a');
    expect(decoded.groceryOpen).toBe(true);
  });

  it('produces an empty query string for default state', () => {
    const params = encodeState(makeState());
    expect(params.toString()).toBe('');
  });

  it('drops unknown ids from meals', () => {
    const decoded = decodeState('?meals=id1,unknown-id,id2', validIds);
    expect(decoded.selectedIds).toEqual(new Set(['id1', 'id2']));
  });

  it('ignores a stale card id without crashing', () => {
    const decoded = decodeState('?card=stale-id', validIds);
    expect(decoded.view).toBeUndefined();
    expect(decoded.activeCardId).toBeUndefined();
  });

  it('omits mealType for a bogus type value', () => {
    const decoded = decodeState('?type=bogus', validIds);
    expect(decoded.mealType).toBeUndefined();
  });

  it('round-trips special characters in q', () => {
    const state = makeState({ query: 'salt & pepper #1 crème brûlée' });
    const url = stateToUrl(state, '/base');
    const search = url.slice(url.indexOf('?'));
    const decoded = decodeState(search, validIds);
    expect(decoded.query).toBe('salt & pepper #1 crème brûlée');
  });

  it('round-trips a large (200-id) selection without truncation', () => {
    const manyIds = Array.from({ length: 200 }, (_, i) => `id-${i}`);
    const bigValidIds = new Set(manyIds);
    const state = makeState({ selectedIds: new Set(manyIds) });

    const params = encodeState(state);
    const decoded = decodeState('?' + params.toString(), bigValidIds);

    expect(decoded.selectedIds?.size).toBe(200);
    expect(decoded.selectedIds).toEqual(new Set(manyIds));
  });

  it('only returns keys actually present in the URL', () => {
    const decoded = decodeState('?q=hello', validIds);
    expect(Object.keys(decoded)).toEqual(['query']);
  });
});

describe('stateToUrl', () => {
  it('returns just the base path when state is default', () => {
    expect(stateToUrl(makeState(), '/base')).toBe('/base');
  });

  it('appends a query string when state has non-default values', () => {
    const url = stateToUrl(makeState({ query: 'soup' }), '/base');
    expect(url).toBe('/base?q=soup');
  });
});
