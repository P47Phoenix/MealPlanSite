import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getGroceryDisplayMode,
  setGroceryDisplayMode,
  getShowSourceRecipes,
  setShowSourceRecipes,
} from './preferences';

beforeEach(() => {
  window.localStorage.clear();
});

describe('getGroceryDisplayMode / setGroceryDisplayMode', () => {
  it('defaults to "purchase" when nothing is stored', () => {
    expect(getGroceryDisplayMode()).toBe('purchase');
  });

  it('round-trips a set value', () => {
    setGroceryDisplayMode('purchase+raw');
    expect(getGroceryDisplayMode()).toBe('purchase+raw');
  });

  it('falls back to the default on a garbage stored value', () => {
    window.localStorage.setItem('mealplan.groceryDisplayMode', 'nonsense');
    expect(getGroceryDisplayMode()).toBe('purchase');
  });

  it('does not throw and falls back to the default when localStorage throws', () => {
    const spy = vi.spyOn(window.localStorage.__proto__, 'getItem').mockImplementation(() => {
      throw new Error('storage disabled');
    });
    expect(() => getGroceryDisplayMode()).not.toThrow();
    expect(getGroceryDisplayMode()).toBe('purchase');
    spy.mockRestore();
  });

  it('does not throw when localStorage.setItem throws', () => {
    const spy = vi.spyOn(window.localStorage.__proto__, 'setItem').mockImplementation(() => {
      throw new Error('storage disabled');
    });
    expect(() => setGroceryDisplayMode('purchase+raw')).not.toThrow();
    spy.mockRestore();
  });
});

describe('getShowSourceRecipes / setShowSourceRecipes', () => {
  it('defaults to false when nothing is stored', () => {
    expect(getShowSourceRecipes()).toBe(false);
  });

  it('round-trips a set value', () => {
    setShowSourceRecipes(true);
    expect(getShowSourceRecipes()).toBe(true);
    setShowSourceRecipes(false);
    expect(getShowSourceRecipes()).toBe(false);
  });

  it('falls back to the default on a garbage stored value', () => {
    window.localStorage.setItem('mealplan.showSourceRecipes', 'nonsense');
    expect(getShowSourceRecipes()).toBe(false);
  });

  it('does not throw and falls back to the default when localStorage throws', () => {
    const spy = vi.spyOn(window.localStorage.__proto__, 'getItem').mockImplementation(() => {
      throw new Error('storage disabled');
    });
    expect(() => getShowSourceRecipes()).not.toThrow();
    expect(getShowSourceRecipes()).toBe(false);
    spy.mockRestore();
  });

  it('does not throw when localStorage.setItem throws', () => {
    const spy = vi.spyOn(window.localStorage.__proto__, 'setItem').mockImplementation(() => {
      throw new Error('storage disabled');
    });
    expect(() => setShowSourceRecipes(true)).not.toThrow();
    spy.mockRestore();
  });
});
