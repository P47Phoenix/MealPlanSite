import { describe, it, expect } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import MealCardTile from './MealCardTile';
import type { MealCard } from '../data/schema';

function makeCard(overrides: Partial<MealCard> = {}): MealCard {
  return {
    id: 'salmon-bowl',
    name: 'Salmon Quinoa Bowl',
    mealType: 'dinner',
    tags: ['high-protein', 'gluten-free', 'seafood', 'mediterranean', 'low-sodium'],
    prepTimeMinutes: 10,
    cookTimeMinutes: 15,
    ingredients: [],
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

function renderTile(props: Partial<React.ComponentProps<typeof MealCardTile>> = {}) {
  return render(
    <ul>
      <MealCardTile card={makeCard()} selected={false} onToggleSelect={() => {}} onOpenDetail={() => {}} {...props} />
    </ul>,
  );
}

describe('MealCardTile', () => {
  it('shows at most 3 chips plus a +N overflow with hidden labels', () => {
    renderTile();
    const row = document.querySelector('.tag-row')!;
    expect(row.querySelectorAll('.tag-row__item')).toHaveLength(3);
    const more = within(row as HTMLElement).getByText('+2');
    expect(more.closest('.tag-chip--more')).toHaveTextContent(/2 more:/);
    // Priority order: seafood (2), mediterranean (4), gluten-free (6) visible; low-sodium, high-protein hidden
    expect(row.textContent).toMatch(/Seafood.*Mediterranean.*Gluten-free/);
    expect(more.closest('.tag-chip--more')!.textContent).toMatch(/Low sodium, High protein/);
  });

  it('puts highlighted tags first and marks them active', () => {
    renderTile({ highlightTags: ['high-protein'] });
    const first = document.querySelector('.tag-row__item--1 .tag-chip')!;
    expect(first).toHaveTextContent('High protein');
    expect(first).toHaveClass('tag-chip--active');
  });

  it('uses the card name as the accessible name and tags as the description', () => {
    renderTile();
    const btn = screen.getByRole('button', { name: 'Salmon Quinoa Bowl' });
    expect(btn).toHaveAccessibleDescription(/Seafood/);
    expect(btn).toHaveAccessibleDescription(/Gluten-free/);
  });

  it('omits the tag row when a card has no tags', () => {
    renderTile({ card: makeCard({ tags: [] }) });
    expect(document.querySelector('.tag-row')).toBeNull();
    expect(screen.getByRole('button', { name: 'Salmon Quinoa Bowl' })).not.toHaveAttribute('aria-describedby');
  });
});
