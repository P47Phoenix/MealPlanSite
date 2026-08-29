import { useRef, type KeyboardEvent } from 'react';
import type { MealType } from '../data/schema';

export type TabId = MealType | 'all';

export const TAB_ORDER: TabId[] = ['all', 'breakfast', 'lunch', 'dinner', 'snack'];
const TAB_LABELS: Record<TabId, string> = {
  all: 'All',
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snack: 'Snack',
};

interface Props {
  value: TabId;
  onChange: (value: TabId) => void;
  counts: Record<TabId, number>;
  panelId: string;
}

export default function MealTypeTabs({ value, onChange, counts, panelId }: Props) {
  const refs = useRef<Partial<Record<TabId, HTMLButtonElement | null>>>({});

  function select(next: TabId) {
    onChange(next);
    const el = refs.current[next];
    el?.focus();
    el?.scrollIntoView?.({ inline: 'nearest', block: 'nearest' });
  }

  function handleKey(e: KeyboardEvent<HTMLButtonElement>) {
    const i = TAB_ORDER.indexOf(value);
    let next: TabId | null = null;
    if (e.key === 'ArrowRight') next = TAB_ORDER[(i + 1) % TAB_ORDER.length];
    else if (e.key === 'ArrowLeft') next = TAB_ORDER[(i - 1 + TAB_ORDER.length) % TAB_ORDER.length];
    else if (e.key === 'Home') next = TAB_ORDER[0];
    else if (e.key === 'End') next = TAB_ORDER[TAB_ORDER.length - 1];
    if (next) {
      e.preventDefault();
      select(next);
    }
  }

  return (
    <div role="tablist" aria-label="Meal type" className="meal-tabs">
      {TAB_ORDER.map((id) => {
        const selected = value === id;
        const count = counts[id];
        const className = [
          'meal-tabs__tab',
          `meal-tabs__tab--${id}`,
          selected ? 'meal-tabs__tab--selected' : '',
          count === 0 ? 'meal-tabs__tab--zero' : '',
        ]
          .filter(Boolean)
          .join(' ');
        return (
          <button
            key={id}
            id={`tab-${id}`}
            type="button"
            role="tab"
            aria-selected={selected}
            aria-controls={panelId}
            tabIndex={selected ? 0 : -1}
            aria-label={`${TAB_LABELS[id]}, ${count} ${count === 1 ? 'result' : 'results'}`}
            ref={(el) => {
              refs.current[id] = el;
            }}
            className={className}
            onClick={() => onChange(id)}
            onKeyDown={handleKey}
          >
            {id !== 'all' && <span className="meal-tabs__dot" aria-hidden="true" />}
            <span className="meal-tabs__label">{TAB_LABELS[id]}</span>
            <span className="meal-tabs__count" aria-hidden="true">
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
