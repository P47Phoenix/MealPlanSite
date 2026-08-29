import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import MealTypeTabs from './MealTypeTabs';

const counts = { all: 10, breakfast: 3, lunch: 2, dinner: 0, snack: 5 };

describe('MealTypeTabs', () => {
  it('renders a tablist with 5 tabs, one selected with tabIndex 0', () => {
    render(<MealTypeTabs value="all" onChange={() => {}} counts={counts} panelId="p" />);
    expect(screen.getByRole('tablist', { name: 'Meal type' })).toBeInTheDocument();
    const tabs = screen.getAllByRole('tab');
    expect(tabs).toHaveLength(5);
    const selected = tabs.filter((t) => t.getAttribute('aria-selected') === 'true');
    expect(selected).toHaveLength(1);
    expect(selected[0]).toHaveAttribute('id', 'tab-all');
    expect(selected[0]).toHaveAttribute('tabindex', '0');
    expect(tabs.filter((t) => t.getAttribute('tabindex') === '-1')).toHaveLength(4);
    for (const t of tabs) expect(t).toHaveAttribute('aria-controls', 'p');
  });

  it('includes the count in the accessible name', () => {
    render(<MealTypeTabs value="all" onChange={() => {}} counts={counts} panelId="p" />);
    expect(screen.getByRole('tab', { name: /Breakfast, 3 results/ })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Dinner, 0 results/ })).toBeInTheDocument();
  });

  it('uses singular "result" for a count of 1', () => {
    render(<MealTypeTabs value="all" onChange={() => {}} counts={{ ...counts, lunch: 1 }} panelId="p" />);
    expect(screen.getByRole('tab', { name: /Lunch, 1 result$/ })).toBeInTheDocument();
  });

  it('zero-count tab is styled --zero but still enabled and clickable', () => {
    const onChange = vi.fn();
    render(<MealTypeTabs value="all" onChange={onChange} counts={counts} panelId="p" />);
    const dinner = screen.getByRole('tab', { name: /Dinner/ });
    expect(dinner).toHaveClass('meal-tabs__tab--zero');
    expect(dinner).not.toBeDisabled();
    expect(dinner).not.toHaveAttribute('aria-disabled');
    fireEvent.click(dinner);
    expect(onChange).toHaveBeenCalledWith('dinner');
  });

  it('arrow keys move selection and focus, wrapping around', () => {
    const onChange = vi.fn();
    const { rerender } = render(<MealTypeTabs value="all" onChange={onChange} counts={counts} panelId="p" />);
    const all = screen.getByRole('tab', { name: /^All/ });
    all.focus();
    fireEvent.keyDown(all, { key: 'ArrowRight' });
    expect(onChange).toHaveBeenLastCalledWith('breakfast');
    expect(document.activeElement).toBe(screen.getByRole('tab', { name: /Breakfast/ }));

    rerender(<MealTypeTabs value="all" onChange={onChange} counts={counts} panelId="p" />);
    fireEvent.keyDown(all, { key: 'ArrowLeft' });
    expect(onChange).toHaveBeenLastCalledWith('snack');

    fireEvent.keyDown(all, { key: 'End' });
    expect(onChange).toHaveBeenLastCalledWith('snack');
    fireEvent.keyDown(all, { key: 'Home' });
    expect(onChange).toHaveBeenLastCalledWith('all');
  });

  it('ArrowRight reaches a zero-count tab', () => {
    const onChange = vi.fn();
    render(<MealTypeTabs value="lunch" onChange={onChange} counts={counts} panelId="p" />);
    fireEvent.keyDown(screen.getByRole('tab', { name: /Lunch/ }), { key: 'ArrowRight' });
    expect(onChange).toHaveBeenLastCalledWith('dinner');
    expect(document.activeElement).toBe(screen.getByRole('tab', { name: /Dinner/ }));
  });
});
