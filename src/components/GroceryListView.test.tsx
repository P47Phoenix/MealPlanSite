import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within, fireEvent } from '@testing-library/react';
import GroceryListView from './GroceryListView';
import type { MealCard, Ingredient } from '../data/schema';
import { buildCartUrl, buildSearchUrl, getQualifyingItems } from '../lib/walmartLinks';
import { buildGroceryList } from '../lib/groceryList';

/**
 * This suite tests the Walmart cart button/coverage UI *behavior*, not the
 * real curated data set. Only `eggs` has a live-verified walmartItemId in
 * production data (see src/data/purchaseUnits.ts); 'chicken breast' is
 * mocked here with a synthetic test-only ID so these UI tests don't depend
 * on which ingredients happen to be curated in production at any given time.
 */
vi.mock('../data/purchaseUnits', () => ({
  PURCHASE_UNITS: {
    'chicken breast': { unitLabel: 'lb', packageSize: 454, packageUnit: 'g', walmartItemId: '145393578' },
    eggs: { unitLabel: 'dozen', packageSize: 12, packageUnit: 'each', walmartItemId: '145051970' },
  },
}));

function ingredient(overrides: Partial<Ingredient> = {}): Ingredient {
  return {
    name: 'Chicken breast',
    quantity: 1,
    unit: 'lb',
    section: 'protein',
    ...overrides,
  };
}

function makeCard(overrides: Partial<MealCard> = {}): MealCard {
  return {
    id: 'salmon-bowl',
    name: 'Salmon Quinoa Bowl',
    mealType: 'dinner',
    tags: ['high-protein', 'gluten-free', 'seafood', 'mediterranean', 'low-sodium'],
    prepTimeMinutes: 10,
    cookTimeMinutes: 15,
    ingredients: [ingredient()],
    steps: ['Step.'],
    nutrition: {
      calories: { value: 500, confidence: 'estimated' },
      proteinG: { value: 40, confidence: 'estimated' },
      sodiumMg: { value: 300, confidence: 'estimated' },
      satFatG: { value: 2, confidence: 'estimated' },
      carbsG: { value: 40, confidence: 'estimated' },
    },
    cooksNotes: null,
    ...overrides,
  };
}

// "Chicken breast" has a curated walmartItemId in purchaseUnits.ts.
// "Quinoa" and "Soy sauce" do not — used as uncurated ingredients.
const CURATED_CARD = makeCard({
  id: 'chicken-card',
  name: 'Chicken Card',
  // packageUnit for 'chicken breast' in purchaseUnits.ts is 'g', so the
  // ingredient quantity/unit must match it exactly (454 g == 1 lb) for
  // computePurchaseQuantity() to resolve a purchase quantity. See BUG-01.
  ingredients: [ingredient({ name: 'Chicken breast', quantity: 454, unit: 'g', section: 'protein' })],
});

const UNCURATED_CARD = makeCard({
  id: 'quinoa-card',
  name: 'Quinoa Card',
  ingredients: [ingredient({ name: 'Quinoa', quantity: 1, unit: 'cup', section: 'grains' })],
});

const MIXED_CARDS = [CURATED_CARD, UNCURATED_CARD];

function renderView(props: Partial<React.ComponentProps<typeof GroceryListView>> = {}) {
  return render(<GroceryListView selectedCards={[]} onClose={() => {}} {...props} />);
}

beforeEach(() => {
  vi.stubGlobal('navigator', { ...navigator, clipboard: { writeText: vi.fn().mockResolvedValue(undefined) } });
});

describe('GroceryListView — Walmart cart button (TC-GLV)', () => {
  it('TC-GLV-001/002: shows the button with correct markup when at least one curated item qualifies', () => {
    renderView({ selectedCards: MIXED_CARDS });
    const link = screen.getByRole('link', { name: /add all to walmart cart/i });
    expect(link).toHaveClass('copy-link-button');
    expect(link).toHaveClass('walmart-cart-button');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    expect(link).toHaveAttribute('aria-label', 'Add all to Walmart cart (opens in new tab)');
    expect(link).toHaveAttribute('aria-describedby', 'walmart-coverage-count');
  });

  it('TC-GLV-003: coverage count text accurately reports curated-of-total items', () => {
    renderView({ selectedCards: MIXED_CARDS });
    const groceryList = buildGroceryList(MIXED_CARDS);
    const allItems = Object.values(groceryList).flat();
    const curated = getQualifyingItems(allItems).length;
    const total = allItems.length;

    const coverage = document.getElementById('walmart-coverage-count');
    expect(coverage).toHaveTextContent(`${curated} of ${total} items`);
    // Sanity: with one curated + one uncurated ingredient, expect 1 of 2.
    expect(coverage).toHaveTextContent('1 of 2 items');
  });

  it('TC-GLV-004: button (and coverage text) hidden when zero curated items qualify though M>0', () => {
    renderView({ selectedCards: [UNCURATED_CARD] });
    expect(screen.queryByRole('link', { name: /add all to walmart cart/i })).not.toBeInTheDocument();
    expect(document.getElementById('walmart-coverage-count')).toBeNull();
  });

  it('TC-GLV-N01/N02: button and coverage text both absent when the grocery list is empty (M=0)', () => {
    renderView({ selectedCards: [] });
    expect(screen.queryByRole('link', { name: /add all to walmart cart/i })).not.toBeInTheDocument();
    expect(document.getElementById('walmart-coverage-count')).toBeNull();
  });

  it('TC-GLV-005: link href is exactly the buildCartUrl output for the current grocery list', () => {
    renderView({ selectedCards: MIXED_CARDS });
    const groceryList = buildGroceryList(MIXED_CARDS);
    const allItems = Object.values(groceryList).flat();
    const expectedUrl = buildCartUrl(allItems);

    const link = screen.getByRole('link', { name: /add all to walmart cart/i });
    expect(expectedUrl).toBeDefined();
    expect(link).toHaveAttribute('href', expectedUrl);
  });

  it('TC-GLV-006: coverage numerator derives from getQualifyingItems(...).length, not a separate filter', () => {
    // Two curated cards -> two curated ingredients + the uncurated quinoa item.
    const secondCurated = makeCard({
      id: 'eggs-card',
      name: 'Eggs Card',
      ingredients: [ingredient({ name: 'Eggs', quantity: 12, unit: 'each', section: 'dairy' })],
    });
    const cards = [CURATED_CARD, secondCurated, UNCURATED_CARD];
    renderView({ selectedCards: cards });

    const groceryList = buildGroceryList(cards);
    const allItems = Object.values(groceryList).flat();
    const expectedCurated = getQualifyingItems(allItems).length;

    const coverage = document.getElementById('walmart-coverage-count');
    expect(coverage).toHaveTextContent(`${expectedCurated} of ${allItems.length} items`);
  });

  it('TC-GLV-007: button renders without any affiliate-approval gating (no flag/config required)', () => {
    // No affiliate-approval prop/config exists on the component; rendering
    // with curated items alone is sufficient for the button to appear.
    renderView({ selectedCards: MIXED_CARDS });
    expect(screen.getByRole('link', { name: /add all to walmart cart/i })).toBeInTheDocument();
  });

  it('TC-GLV-008: recomputes when groceryList (selectedCards) changes, not merely on re-render', () => {
    const { rerender } = renderView({ selectedCards: [UNCURATED_CARD] });
    expect(screen.queryByRole('link', { name: /add all to walmart cart/i })).not.toBeInTheDocument();

    rerender(<GroceryListView selectedCards={MIXED_CARDS} onClose={() => {}} />);
    expect(screen.getByRole('link', { name: /add all to walmart cart/i })).toBeInTheDocument();
    expect(document.getElementById('walmart-coverage-count')).toHaveTextContent('1 of 2 items');
  });
});

describe('GroceryListView — per-item Walmart search links (TC-SL)', () => {
  it('TC-SL-001/002: search link is present on both curated and uncurated item lines', () => {
    renderView({ selectedCards: MIXED_CARDS });
    const searchLinks = screen.getAllByRole('link', { name: /^search for/i });
    // One curated (chicken breast) + one uncurated (quinoa) = 2 search links.
    expect(searchLinks).toHaveLength(2);
  });

  it('TC-SL-003: search link present in every rendered section', () => {
    renderView({ selectedCards: MIXED_CARDS });
    const proteinSection = screen.getByText('Protein').closest('.grocery-section')!;
    const grainsSection = screen.getByText('Grains').closest('.grocery-section')!;
    expect(within(proteinSection as HTMLElement).getByRole('link', { name: /^search for/i })).toBeInTheDocument();
    expect(within(grainsSection as HTMLElement).getByRole('link', { name: /^search for/i })).toBeInTheDocument();
  });

  it('TC-SL-004: search link href matches buildSearchUrl regardless of curated status', () => {
    renderView({ selectedCards: MIXED_CARDS });
    const chickenLink = screen.getByRole('link', { name: /search for chicken breast/i });
    const quinoaLink = screen.getByRole('link', { name: /search for quinoa/i });
    expect(chickenLink).toHaveAttribute('href', buildSearchUrl('Chicken breast'));
    expect(quinoaLink).toHaveAttribute('href', buildSearchUrl('Quinoa'));
  });

  it('TC-SL-004b: search link href is unaffected by a stale/delisted walmartItemId — it always points at buildSearchUrl', () => {
    // "Soy sauce" has no walmartItemId (uncurated); confirm its search link
    // still resolves to the generic search URL, independent of catalog status.
    const staleCard = makeCard({
      id: 'soy-card',
      name: 'Soy Card',
      ingredients: [ingredient({ name: 'Soy sauce', quantity: 1, unit: 'tbsp', section: 'pantry' })],
    });
    renderView({ selectedCards: [staleCard] });
    const link = screen.getByRole('link', { name: /search for soy sauce/i });
    expect(link).toHaveAttribute('href', buildSearchUrl('Soy sauce'));
  });

  it('TC-SL-N01: search link href is correctly percent-encoded for an item name with special characters', () => {
    // "greek yogurt (2%)" contains parentheses and a percent sign that must
    // be percent-encoded exactly as buildSearchUrl would encode them.
    const specialCharCard = makeCard({
      id: 'yogurt-card',
      name: 'Yogurt Card',
      ingredients: [ingredient({ name: 'greek yogurt (2%)', quantity: 1, unit: 'cup', section: 'dairy' })],
    });
    renderView({ selectedCards: [specialCharCard] });
    const link = screen.getByRole('link', { name: /search for greek yogurt \(2%\)/i });
    expect(link).toHaveAttribute('href', buildSearchUrl('greek yogurt (2%)'));
  });

  it('TC-SL-005: showSourceRecipes expansion does not duplicate the search link', () => {
    renderView({ selectedCards: MIXED_CARDS });
    const checkbox = screen.getByRole('checkbox', { name: /show source recipes/i });
    fireEvent.click(checkbox);
    // Still exactly one search link per item after expansion.
    const chickenLinks = screen.getAllByRole('link', { name: /search for chicken breast/i });
    expect(chickenLinks).toHaveLength(1);
    const quinoaLinks = screen.getAllByRole('link', { name: /search for quinoa/i });
    expect(quinoaLinks).toHaveLength(1);
  });
});
