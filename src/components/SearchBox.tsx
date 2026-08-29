import { forwardRef, type KeyboardEvent } from 'react';

interface Props {
  value: string;
  onChange: (value: string) => void;
}

const SearchBox = forwardRef<HTMLInputElement, Props>(function SearchBox({ value, onChange }, ref) {
  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Escape' && value !== '') {
      e.preventDefault();
      onChange('');
      e.currentTarget.focus();
    }
  }

  return (
    <form role="search" className="search-box" onSubmit={(e) => e.preventDefault()}>
      <label htmlFor="meal-search" className="visually-hidden">
        Search meals
      </label>
      <span className="search-box__icon" aria-hidden="true">
        🔍
      </span>
      <input
        ref={ref}
        id="meal-search"
        type="search"
        className="search-box__input"
        placeholder="Search by name, ingredient or tag…"
        autoComplete="off"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        aria-describedby="result-count"
      />
      {value !== '' && (
        <button
          type="button"
          className="search-box__clear"
          aria-label="Clear search"
          onClick={() => {
            onChange('');
            (ref as React.RefObject<HTMLInputElement> | null)?.current?.focus();
          }}
        >
          ✕
        </button>
      )}
    </form>
  );
});

export default SearchBox;
