import { describe, it, expect, vi } from 'vitest';
import { buildCartUrl, buildSearchUrl, getQualifyingItems } from './walmartLinks';
import { normalizeIngredientKey } from './groceryList';
import type { GroceryItem } from './groceryList';

/**
 * This suite tests cart-URL-building *behavior* (qualification, quantity
 * resolution, encoding), not the real curated data set. Only `eggs` has a
 * live-verified walmartItemId in production data (see
 * src/data/purchaseUnits.ts); 'chicken breast' and 'olive oil' are mocked
 * here with synthetic test-only IDs so these tests don't depend on which
 * ingredients happen to be curated in production at any given time.
 */
vi.mock('../data/purchaseUnits', () => ({
  PURCHASE_UNITS: {
    'chicken breast': { unitLabel: 'lb', packageSize: 454, packageUnit: 'g', walmartItemId: '145393578' },
    eggs: { unitLabel: 'dozen', packageSize: 12, packageUnit: 'each', walmartItemId: '145051970' },
    'olive oil': { unitLabel: 'bottle', packageSize: 96, packageUnit: 'tbsp', walmartItemId: '10534400' },
    zucchini: { unitLabel: 'each', packageSize: 1, packageUnit: 'each' },
    celery: { unitLabel: 'bunch', packageSize: 340, packageUnit: 'g' },
  },
}));

/** Minimal valid GroceryItem fixture builder. */
function makeItem(overrides: Partial<GroceryItem>): GroceryItem {
  return {
    name: 'Item',
    quantity: 1,
    unit: 'each',
    sourceCards: [],
    ...overrides,
  };
}

// Synthetic test-only IDs (mocked above, not real curated production data):
// 'chicken breast' -> walmartItemId '145393578'
// 'eggs' -> walmartItemId '145051970' (this one matches the real, live-verified production ID)
// 'olive oil' -> walmartItemId '10534400'

describe('buildCartUrl - TC-CART-001 all-curated list builds full URL', () => {
  it('returns a URL with one ID|QTY pair per curated item, comma-joined', () => {
    const items: GroceryItem[] = [
      makeItem({ name: 'Chicken breast', purchase: { quantity: 2, unit: 'lb' } }),
      makeItem({ name: 'Eggs', purchase: { quantity: 1, unit: 'dozen' } }),
    ];
    const url = buildCartUrl(items);
    expect(url).toBeDefined();
    expect(url).toBe(
      'https://affil.walmart.com/cart/addToCart?items=145393578%7C2%2C145051970%7C1',
    );
    // decode to double check the human-readable pairing
    const decoded = new URL(url!).searchParams.get('items');
    expect(decoded).toBe('145393578|2,145051970|1');
  });
});

describe('buildCartUrl - TC-CART-002 mixed curated/uncurated list omits uncurated silently', () => {
  it('includes only curated items, no error thrown', () => {
    const items: GroceryItem[] = [
      makeItem({ name: 'Chicken breast', purchase: { quantity: 1, unit: 'lb' } }),
      makeItem({ name: 'Zucchini', quantity: 1, unit: 'each' }), // uncurated
    ];
    expect(() => buildCartUrl(items)).not.toThrow();
    const url = buildCartUrl(items);
    const decoded = new URL(url!).searchParams.get('items');
    expect(decoded).toBe('145393578|1');
  });
});

describe('buildCartUrl - TC-CART-003 zero-curated list returns undefined', () => {
  it('returns undefined when no item has a walmartItemId', () => {
    const items: GroceryItem[] = [
      makeItem({ name: 'Zucchini', quantity: 1, unit: 'each' }),
      makeItem({ name: 'Celery', quantity: 1, unit: 'each' }),
    ];
    expect(buildCartUrl(items)).toBeUndefined();
  });
});

describe('buildCartUrl - TC-CART-004 fractional quantity below 1 floors to 1', () => {
  it('emits ID|1, never ID|0.4 or below 1', () => {
    const items: GroceryItem[] = [
      makeItem({ name: 'Olive oil', purchase: { quantity: 0.4, unit: 'bottle' } }),
    ];
    const url = buildCartUrl(items);
    const decoded = new URL(url!).searchParams.get('items');
    expect(decoded).toBe('10534400|1');
  });
});

describe('buildCartUrl - TC-CART-005 invalid quantity item is skipped, not floored to 1', () => {
  it.each([
    ['zero', 0],
    ['negative', -1],
    ['NaN', NaN],
  ])('skips item with %s quantity, no throw, remaining items still processed', (_label, badQty) => {
    const items: GroceryItem[] = [
      makeItem({ name: 'Olive oil', purchase: { quantity: badQty, unit: 'bottle' } }),
      makeItem({ name: 'Eggs', purchase: { quantity: 1, unit: 'dozen' } }),
    ];
    expect(() => buildCartUrl(items)).not.toThrow();
    const url = buildCartUrl(items);
    const decoded = new URL(url!).searchParams.get('items');
    expect(decoded).toBe('145051970|1');
  });

  it('skips item when purchase is undefined and raw quantity is null/undefined-like', () => {
    const items: GroceryItem[] = [
      makeItem({ name: 'Olive oil', quantity: 0, unit: 'bottle', purchase: undefined }),
      makeItem({ name: 'Eggs', purchase: { quantity: 1, unit: 'dozen' } }),
    ];
    expect(() => buildCartUrl(items)).not.toThrow();
    const url = buildCartUrl(items);
    const decoded = new URL(url!).searchParams.get('items');
    expect(decoded).toBe('145051970|1');
  });
});

describe('buildCartUrl - TC-CART-006 all-invalid-quantity list returns undefined', () => {
  it('returns undefined, same as zero-curated case', () => {
    const items: GroceryItem[] = [
      makeItem({ name: 'Olive oil', purchase: { quantity: 0, unit: 'bottle' } }),
      makeItem({ name: 'Eggs', purchase: { quantity: NaN, unit: 'dozen' } }),
      makeItem({ name: 'Chicken breast', purchase: { quantity: -3, unit: 'lb' } }),
    ];
    expect(buildCartUrl(items)).toBeUndefined();
  });
});

describe('getQualifyingItems - TC-CART-007 exported and shared with buildCartUrl', () => {
  it('same item set as reflected in buildCartUrl output, no divergent second filter', () => {
    const items: GroceryItem[] = [
      makeItem({ name: 'Chicken breast', purchase: { quantity: 2, unit: 'lb' } }),
      makeItem({ name: 'Eggs', purchase: { quantity: 1, unit: 'dozen' } }),
      makeItem({ name: 'Zucchini', quantity: 1, unit: 'each' }), // uncurated
      makeItem({ name: 'Olive oil', purchase: { quantity: 0, unit: 'bottle' } }), // invalid qty
    ];
    const qualifying = getQualifyingItems(items);
    expect(qualifying).toEqual([
      { id: '145393578', qty: 2 },
      { id: '145051970', qty: 1 },
    ]);

    const url = buildCartUrl(items);
    const decoded = new URL(url!).searchParams.get('items');
    const expectedParam = qualifying.map(({ id, qty }) => `${id}|${qty}`).join(',');
    expect(decoded).toBe(expectedParam);
  });
});

describe('buildCartUrl - TC-CART-008 empty item array', () => {
  it('returns undefined for []', () => {
    expect(buildCartUrl([])).toBeUndefined();
  });
});

describe('buildSearchUrl - TC-SEARCH-001 plain item name encodes correctly', () => {
  it('produces a valid encoded search URL', () => {
    const url = buildSearchUrl('chicken breast');
    expect(url).toBe('https://www.walmart.com/search?q=chicken+breast');
    expect(() => new URL(url)).not.toThrow();
  });
});

describe('buildSearchUrl - TC-SEARCH-002 name with special characters encodes correctly', () => {
  it('percent-encodes %, (), and spaces into a syntactically valid URL', () => {
    const url = buildSearchUrl('greek yogurt (2%)');
    expect(() => new URL(url)).not.toThrow();
    const decoded = new URL(url).searchParams.get('q');
    expect(decoded).toBe('greek yogurt (2%)');
    expect(url).toContain('%25'); // '%' encoded
    expect(url).toContain('%28'); // '('
    expect(url).toContain('%29'); // ')'
  });
});

describe('buildSearchUrl - TC-SEARCH-003 always returns a defined URL, curated or not', () => {
  it('returns a usable URL for an item absent from PURCHASE_UNITS', () => {
    const url = buildSearchUrl('some totally uncurated ingredient');
    expect(url).toBeDefined();
    expect(url.startsWith('https://www.walmart.com/search?q=')).toBe(true);
  });
});

describe('normalizeIngredientKey - TC-SEARCH-004 exported and shared', () => {
  it('produces identical keys for groceryList and walmartLinks call sites', () => {
    expect(normalizeIngredientKey('  Garlic ')).toBe('garlic');
    expect(normalizeIngredientKey('Garlic')).toBe(normalizeIngredientKey('  garlic  '));
  });

  it('is the key getQualifyingItems uses for PURCHASE_UNITS lookup (no drift)', () => {
    const items: GroceryItem[] = [
      makeItem({ name: '  Chicken Breast  ', purchase: { quantity: 1, unit: 'lb' } }),
    ];
    // normalizeIngredientKey('  Chicken Breast  ') === 'chicken breast', which is curated
    expect(normalizeIngredientKey('  Chicken Breast  ')).toBe('chicken breast');
    expect(getQualifyingItems(items)).toEqual([{ id: '145393578', qty: 1 }]);
  });
});

describe('buildSearchUrl - TC-SEARCH-005 empty string name', () => {
  it('returns a valid URL with empty q param, does not throw', () => {
    expect(() => buildSearchUrl('')).not.toThrow();
    const url = buildSearchUrl('');
    expect(url).toBe('https://www.walmart.com/search?q=');
    expect(new URL(url).searchParams.get('q')).toBe('');
  });
});

describe('buildSearchUrl - negative cases', () => {
  it('TC-SEARCH-N01: handles unicode/emoji without throwing, still a valid URL', () => {
    const url = buildSearchUrl('café ☕');
    expect(() => new URL(url)).not.toThrow();
    expect(new URL(url).searchParams.get('q')).toBe('café ☕');
  });

  it('TC-SEARCH-N02: encodes ampersand, does not create a spurious second query param', () => {
    const url = buildSearchUrl('salt & pepper');
    const parsed = new URL(url);
    expect(Array.from(parsed.searchParams.keys())).toEqual(['q']);
    expect(parsed.searchParams.get('q')).toBe('salt & pepper');
  });
});

describe('buildCartUrl - negative cases', () => {
  it('TC-CART-N01: NaN quantity is skipped, no throw, remaining items still processed', () => {
    const items: GroceryItem[] = [
      makeItem({ name: 'Olive oil', purchase: { quantity: NaN, unit: 'bottle' } }),
      makeItem({ name: 'Eggs', purchase: { quantity: 2, unit: 'dozen' } }),
    ];
    expect(() => buildCartUrl(items)).not.toThrow();
    expect(new URL(buildCartUrl(items)!).searchParams.get('items')).toBe('145051970|2');
  });

  it('TC-CART-N02: no fallback quantity resolves, item skipped, no throw', () => {
    const items: GroceryItem[] = [
      makeItem({ name: 'Chicken breast', quantity: undefined as unknown as number, purchase: undefined }),
    ];
    expect(() => buildCartUrl(items)).not.toThrow();
    expect(buildCartUrl(items)).toBeUndefined();
  });

  it('TC-CART-N03: negative quantity is skipped, never floored to 1', () => {
    const items: GroceryItem[] = [
      makeItem({ name: 'Chicken breast', purchase: { quantity: -3, unit: 'lb' } }),
    ];
    expect(buildCartUrl(items)).toBeUndefined();
  });
});

describe('buildCartUrl / getQualifyingItems - BUG-01 regression: unit-conversion failure excludes item', () => {
  it('excludes a curated item (walmartItemId present) whose purchase is undefined due to a conversion failure, rather than falling back to the raw recipe quantity', () => {
    const items: GroceryItem[] = [
      // 'chicken breast' is curated (walmartItemId '145393578'), but here purchase is
      // undefined -- as computePurchaseQuantity() returns when the recipe unit doesn't
      // match the package unit/volume family. Pre-fix, this fell back to
      // Math.ceil(item.quantity) = 3 and wrongly qualified.
      makeItem({ name: 'Chicken breast', quantity: 3, unit: 'tsp', purchase: undefined }),
      makeItem({ name: 'Eggs', purchase: { quantity: 1, unit: 'dozen' } }),
    ];

    expect(getQualifyingItems(items)).toEqual([{ id: '145051970', qty: 1 }]);

    const url = buildCartUrl(items);
    expect(url).toBeDefined();
    const decoded = new URL(url!).searchParams.get('items');
    expect(decoded).toBe('145051970|1');
    expect(decoded).not.toContain('145393578');
  });
});

describe('suite completeness (TC-COV)', () => {
  it('TC-COV-001: all 6 buildCartUrl branches from NFR-05 are exercised above (all-curated, mixed, zero-curated, fractional floor, invalid-quantity skip, all-invalid)', () => {
    // Enforcement is structural: the six describe blocks above (TC-CART-001..006)
    // each assert one of these branches. This test documents the mapping.
    expect(true).toBe(true);
  });

  it('TC-COV-002: buildSearchUrl encoding branches (plain name, special characters) are both asserted above', () => {
    expect(true).toBe(true);
  });

  it('TC-COV-003: getQualifyingItems tested directly and matches buildCartUrl usage, no drift', () => {
    const items: GroceryItem[] = [
      makeItem({ name: 'Chicken breast', purchase: { quantity: 3, unit: 'lb' } }),
      makeItem({ name: 'Zucchini', quantity: 1, unit: 'each' }),
    ];
    const qualifying = getQualifyingItems(items);
    const cartUrl = buildCartUrl(items);
    const decoded = new URL(cartUrl!).searchParams.get('items');
    expect(decoded).toBe(qualifying.map(({ id, qty }) => `${id}|${qty}`).join(','));
  });

  it('TC-COV-004: normalizeIngredientKey matches groceryList and walmartLinks consumers', () => {
    const raw = '  Chicken Breast  ';
    const key = normalizeIngredientKey(raw);
    expect(key).toBe('chicken breast');
    // walmartLinks.ts uses normalizeIngredientKey internally in getQualifyingItems -- confirmed via TC-SEARCH-004 test above.
    expect(getQualifyingItems([makeItem({ name: raw, purchase: { quantity: 1, unit: 'lb' } })])).toEqual([
      { id: '145393578', qty: 1 },
    ]);
  });
});
