import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import App from './App';
import { MEAL_CARDS } from './data/cards';
import { filterCards } from './lib/search';

const TOTAL = MEAL_CARDS.length;

function resultText(): string {
  return document.getElementById('result-count')!.textContent ?? '';
}

function tabCount(name: RegExp): number {
  const tab = screen.getByRole('tab', { name });
  return Number(tab.querySelector('.meal-tabs__count')!.textContent);
}

describe('App integration', () => {
  it('shows all cards by default with matching tab counts', () => {
    render(<App />);
    expect(resultText()).toBe(`Showing ${TOTAL} of ${TOTAL} meals`);
    expect(tabCount(/^All/)).toBe(TOTAL);
    expect(tabCount(/Dinner/)).toBe(MEAL_CARDS.filter((c) => c.mealType === 'dinner').length);
  });

  it('typing a query narrows the result count and tab counts', () => {
    render(<App />);
    const input = screen.getByLabelText('Search meals');
    fireEvent.change(input, { target: { value: 'salmon' } });
    const expected = filterCards(MEAL_CARDS, { query: 'salmon', mealType: 'all', tags: [] }).length;
    expect(expected).toBeGreaterThan(0);
    expect(resultText()).toBe(`Showing ${expected} of ${TOTAL} meals`);
    expect(tabCount(/^All/)).toBe(expected);
    expect(
      tabCount(/Breakfast/) + tabCount(/Lunch/) + tabCount(/Dinner/) + tabCount(/Snack/),
    ).toBe(expected);
    expect(screen.getByRole('button', { name: /Remove search “salmon”/ })).toBeInTheDocument();
  });

  it('toggling a tag highlights it on tiles and lists it as active', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /Cuisine: Seafood/ }));
    const expected = filterCards(MEAL_CARDS, { query: '', mealType: 'all', tags: ['seafood'] }).length;
    expect(resultText()).toBe(`Showing ${expected} of ${TOTAL} meals`);
    const firstTile = document.querySelector('.meal-card-tile')!;
    const firstChip = firstTile.querySelector('.tag-row__item--1 .tag-chip')!;
    expect(firstChip).toHaveTextContent('Seafood');
    expect(firstChip).toHaveClass('tag-chip--active');
    expect(screen.getByRole('button', { name: 'Remove Seafood filter' })).toBeInTheDocument();
  });

  it('tabpanel is labelled by the selected tab', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('tab', { name: /Dinner/ }));
    expect(screen.getByRole('tabpanel')).toHaveAttribute('aria-labelledby', 'tab-dinner');
    expect(screen.getByRole('tab', { name: /Dinner/ })).toHaveAttribute('aria-selected', 'true');
  });

  it('tab-aware empty state offers "Show all meal types" and focuses the All tab', () => {
    render(<App />);
    fireEvent.change(screen.getByLabelText('Search meals'), { target: { value: 'salmon' } });
    // Pick a meal type that has no salmon cards in the dataset.
    const types = ['breakfast', 'lunch', 'dinner', 'snack'] as const;
    const zeroType = types.find(
      (t) => filterCards(MEAL_CARDS, { query: 'salmon', mealType: t, tags: [] }).length === 0,
    );
    expect(zeroType).toBeDefined();
    const labels = { breakfast: 'Breakfast', lunch: 'Lunch', dinner: 'Dinner', snack: 'Snack' };
    const plurals = { breakfast: 'breakfasts', lunch: 'lunches', dinner: 'dinners', snack: 'snacks' };
    const tab = screen.getByRole('tab', { name: new RegExp(labels[zeroType!]) });
    expect(tab).toHaveClass('meal-tabs__tab--zero');
    fireEvent.click(tab);
    const panel = screen.getByRole('tabpanel');
    expect(
      within(panel).getByRole('heading', { name: new RegExp(`No ${plurals[zeroType!]} match “salmon”`) }),
    ).toBeInTheDocument();
    const allCount = tabCount(/^All/);
    expect(allCount).toBeGreaterThan(0);
    const showAll = within(panel).getByRole('button', { name: `Show all meal types (${allCount})` });
    fireEvent.click(showAll);
    expect(screen.getByRole('tab', { name: /^All/ })).toHaveAttribute('aria-selected', 'true');
    expect(within(screen.getByRole('tabpanel')).queryByRole("heading", { level: 2 })).toBeNull();
  });

  it('"Clear search & filters" restores every card and focuses the search input', () => {
    render(<App />);
    fireEvent.change(screen.getByLabelText('Search meals'), { target: { value: 'zzzznothing' } });
    expect(resultText()).toBe(`Showing 0 of ${TOTAL} meals`);
    fireEvent.click(screen.getByRole('button', { name: /Clear search & filters/ }));
    expect(resultText()).toBe(`Showing ${TOTAL} of ${TOTAL} meals`);
    expect(document.activeElement).toBe(screen.getByLabelText('Search meals'));
  });
});
