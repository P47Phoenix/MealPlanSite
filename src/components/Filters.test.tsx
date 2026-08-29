import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import Filters from './Filters';
import { TAG_IDS, type TagId } from '../data/tags';
import type { FacetCounts } from '../lib/search';

function facets(overrides: Partial<Record<TagId, number>> = {}): FacetCounts {
  const tags = {} as Record<TagId, number>;
  for (const t of TAG_IDS) tags[t] = 5;
  Object.assign(tags, overrides);
  return { mealType: { all: 5, breakfast: 1, lunch: 1, dinner: 2, snack: 1 }, tags };
}

describe('Filters', () => {
  it('renders three named groups', () => {
    render(<Filters activeTags={[]} onToggleTag={() => {}} facets={facets()} />);
    expect(screen.getByRole('group', { name: 'Dietary' })).toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'Cuisine' })).toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'Prep' })).toBeInTheDocument();
    expect(screen.getByText('Filter by attribute')).toBeInTheDocument();
  });

  it('puts the right chips in the right groups with counts', () => {
    render(<Filters activeTags={[]} onToggleTag={() => {}} facets={facets({ seafood: 7 })} />);
    const cuisine = screen.getByRole('group', { name: 'Cuisine' });
    const seafood = within(cuisine).getByRole('button', { name: /Cuisine: Seafood, 7 results/ });
    expect(seafood).toHaveAttribute('aria-pressed', 'false');
    expect(within(screen.getByRole('group', { name: 'Dietary' })).queryByRole('button', { name: /Seafood/ })).toBeNull();
  });

  it('marks active chips pressed and calls onToggleTag', () => {
    const onToggle = vi.fn();
    render(<Filters activeTags={['vegetarian']} onToggleTag={onToggle} facets={facets()} />);
    const veg = screen.getByRole('button', { name: /Vegetarian/ });
    expect(veg).toHaveAttribute('aria-pressed', 'true');
    expect(veg).toHaveClass('tag-chip--active');
    fireEvent.click(veg);
    expect(onToggle).toHaveBeenCalledWith('vegetarian');
  });

  it('a count-0 chip is aria-disabled and does not toggle', () => {
    const onToggle = vi.fn();
    render(<Filters activeTags={[]} onToggleTag={onToggle} facets={facets({ 'bedtime-snack': 0 })} />);
    const chip = screen.getByRole('button', { name: /Bedtime snack/ });
    expect(chip).toHaveAttribute('aria-disabled', 'true');
    expect(chip).not.toBeDisabled();
    fireEvent.click(chip);
    expect(onToggle).not.toHaveBeenCalled();
  });

  it('an active chip is never disabled even at count 0', () => {
    const onToggle = vi.fn();
    render(<Filters activeTags={['low-fat']} onToggleTag={onToggle} facets={facets({ 'low-fat': 0 })} />);
    const chip = screen.getByRole('button', { name: /Low fat/ });
    expect(chip).not.toHaveAttribute('aria-disabled');
    fireEvent.click(chip);
    expect(onToggle).toHaveBeenCalledWith('low-fat');
  });
});
