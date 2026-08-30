import { describe, it, expect } from 'vitest';
import { PURCHASE_UNITS, type PurchaseUnitEntry } from './purchaseUnits';

/**
 * Staples with a walmartItemId confirmed real via live spot-check. All 8
 * priority staples are now live-verified: `eggs` from an earlier verified
 * spike, and the remaining 7 (chicken breast, olive oil, garlic, onion,
 * brown rice, canned tuna, greek yogurt) corrected via live browser
 * navigation during UAT. See PURCHASE_UNITS doc comment / story-1.md for
 * details.
 */
const VERIFIED_STAPLES = [
  'chicken breast',
  'eggs',
  'olive oil',
  'garlic',
  'onion',
  'brown rice',
  'canned tuna',
  'greek yogurt',
];

/** All 8 priority staples, regardless of whether they currently carry a
 * curated walmartItemId. Used to assert the entries themselves still exist
 * with valid non-ID fields even after an ID is pulled. */
const PRIORITY_STAPLES = [
  'chicken breast',
  'eggs',
  'olive oil',
  'garlic',
  'onion',
  'brown rice',
  'canned tuna',
  'greek yogurt',
];

/** Normalizes a raw ingredient key the same way grocery-list aggregation does. */
function normalizeKey(key: string): string {
  return key.toLowerCase().trim();
}

/** Runs the walmartItemId format guard against an arbitrary PURCHASE_UNITS-shaped map. */
function findInvalidWalmartIds(units: Record<string, PurchaseUnitEntry>): string[] {
  const offenders: string[] = [];
  for (const [key, entry] of Object.entries(units)) {
    if (entry.walmartItemId === undefined) continue;
    const id = entry.walmartItemId;
    if (id.length === 0 || !/^\d+$/.test(id)) {
      offenders.push(key);
    }
  }
  return offenders;
}

/** Runs the key-collision guard against an arbitrary PURCHASE_UNITS-shaped map. */
function findCollidingKeys(units: Record<string, PurchaseUnitEntry>): string[] {
  const seen = new Map<string, string>();
  const collisions: string[] = [];
  for (const key of Object.keys(units)) {
    const normalized = normalizeKey(key);
    if (seen.has(normalized)) {
      collisions.push(`"${seen.get(normalized)}" vs "${key}" (normalize to "${normalized}")`);
    } else {
      seen.set(normalized, key);
    }
  }
  return collisions;
}

describe('PURCHASE_UNITS data integrity guard', () => {
  it('passes with 0 failures on the real curated data (TC-PU-007)', () => {
    expect(findInvalidWalmartIds(PURCHASE_UNITS)).toEqual([]);
    expect(findCollidingKeys(PURCHASE_UNITS)).toEqual([]);
  });

  it('leaves entries without walmartItemId valid and unaffected (TC-PU-001)', () => {
    const entriesWithoutId = Object.values(PURCHASE_UNITS).filter(
      (entry) => entry.walmartItemId === undefined,
    );
    for (const entry of entriesWithoutId) {
      expect(entry.unitLabel).toBeTruthy();
      expect(entry.packageSize).toBeGreaterThan(0);
      expect(entry.packageUnit).toBeTruthy();
    }
  });

  it('has a defined PURCHASE_UNITS entry for all 8 priority staples (TC-PU-002)', () => {
    for (const staple of PRIORITY_STAPLES) {
      const entry = PURCHASE_UNITS[staple];
      expect(entry, `missing PURCHASE_UNITS entry for "${staple}"`).toBeDefined();
      expect(entry.unitLabel, `"${staple}" missing unitLabel`).toBeTruthy();
      expect(entry.packageSize, `"${staple}" missing packageSize`).toBeGreaterThan(0);
      expect(entry.packageUnit, `"${staple}" missing packageUnit`).toBeTruthy();
    }
  });

  it('has a non-empty, all-digit walmartItemId only for verified staples (TC-PU-002b)', () => {
    for (const staple of VERIFIED_STAPLES) {
      const entry = PURCHASE_UNITS[staple];
      expect(entry, `missing PURCHASE_UNITS entry for "${staple}"`).toBeDefined();
      expect(entry.walmartItemId, `"${staple}" is missing a walmartItemId`).toBeTruthy();
      expect(entry.walmartItemId, `"${staple}" walmartItemId must be all digits`).toMatch(/^\d+$/);
    }
  });

  it('holds additional curated entries beyond the 8 staples to the same standard (TC-PU-003)', () => {
    const extraCurated = Object.entries(PURCHASE_UNITS).filter(
      ([key, entry]) => !PRIORITY_STAPLES.includes(key) && entry.walmartItemId !== undefined,
    );
    for (const [key, entry] of extraCurated) {
      expect(entry.walmartItemId, `"${key}" walmartItemId is empty`).toBeTruthy();
      expect(entry.walmartItemId, `"${key}" walmartItemId must be all digits`).toMatch(/^\d+$/);
    }
  });

  it('fails on an empty walmartItemId (TC-PU-004)', () => {
    const fixture: Record<string, PurchaseUnitEntry> = {
      ...PURCHASE_UNITS,
      garlic: { ...PURCHASE_UNITS.garlic, walmartItemId: '' },
    };
    const offenders = findInvalidWalmartIds(fixture);
    expect(offenders).toContain('garlic');
  });

  it('fails on a non-digit walmartItemId (TC-PU-005)', () => {
    const fixture: Record<string, PurchaseUnitEntry> = {
      ...PURCHASE_UNITS,
      garlic: { ...PURCHASE_UNITS.garlic, walmartItemId: '12A45' },
    };
    const offenders = findInvalidWalmartIds(fixture);
    expect(offenders).toContain('garlic');
  });

  it('fails on whitespace-only walmartItemId (TC-PU-N01)', () => {
    const fixture: Record<string, PurchaseUnitEntry> = {
      ...PURCHASE_UNITS,
      garlic: { ...PURCHASE_UNITS.garlic, walmartItemId: '   ' },
    };
    const offenders = findInvalidWalmartIds(fixture);
    expect(offenders).toContain('garlic');
  });

  it('preserves leading zeros without numeric coercion (TC-PU-N02)', () => {
    const fixture: Record<string, PurchaseUnitEntry> = {
      ...PURCHASE_UNITS,
      garlic: { ...PURCHASE_UNITS.garlic, walmartItemId: '00123' },
    };
    const offenders = findInvalidWalmartIds(fixture);
    expect(offenders).not.toContain('garlic');
    expect(fixture.garlic.walmartItemId).toBe('00123');
  });

  it('fails on a key collision from a trailing-space variant (TC-PU-006)', () => {
    const fixture: Record<string, PurchaseUnitEntry> = {
      ...PURCHASE_UNITS,
      'garlic ': { ...PURCHASE_UNITS.garlic },
    };
    const collisions = findCollidingKeys(fixture);
    expect(collisions.length).toBeGreaterThan(0);
    expect(collisions[0]).toContain('garlic');
  });

  it('fails on a case-only key collision (TC-PU-N03)', () => {
    const fixture: Record<string, PurchaseUnitEntry> = {
      ...PURCHASE_UNITS,
      Eggs: { ...PURCHASE_UNITS.eggs },
    };
    const collisions = findCollidingKeys(fixture);
    expect(collisions.length).toBeGreaterThan(0);
    expect(collisions[0].toLowerCase()).toContain('eggs');
  });
});
