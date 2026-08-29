import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import SearchBox from './SearchBox';

describe('SearchBox', () => {
  it('associates the label with the input', () => {
    render(<SearchBox value="" onChange={() => {}} />);
    const input = screen.getByLabelText('Search meals');
    expect(input).toHaveAttribute('type', 'search');
    expect(screen.getByRole('search')).toBeInTheDocument();
  });

  it('only shows the clear button when there is a value', () => {
    const { rerender } = render(<SearchBox value="" onChange={() => {}} />);
    expect(screen.queryByRole('button', { name: 'Clear search' })).toBeNull();
    rerender(<SearchBox value="salmon" onChange={() => {}} />);
    expect(screen.getByRole('button', { name: 'Clear search' })).toBeInTheDocument();
  });

  it('clears on Escape and keeps focus on the input', () => {
    const onChange = vi.fn();
    render(<SearchBox value="salmon" onChange={onChange} />);
    const input = screen.getByLabelText('Search meals');
    input.focus();
    fireEvent.keyDown(input, { key: 'Escape' });
    expect(onChange).toHaveBeenCalledWith('');
    expect(document.activeElement).toBe(input);
  });

  it('calls onChange as the user types', () => {
    const onChange = vi.fn();
    render(<SearchBox value="" onChange={onChange} />);
    fireEvent.change(screen.getByLabelText('Search meals'), { target: { value: 'egg' } });
    expect(onChange).toHaveBeenCalledWith('egg');
  });
});
