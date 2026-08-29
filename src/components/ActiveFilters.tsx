import { TAG_REGISTRY, type TagId } from '../data/tags';
import type { MealType } from '../data/schema';

interface Props {
  query: string;
  mealType: MealType | 'all';
  activeTags: TagId[];
  onRemoveTag: (tag: TagId) => void;
  onClearQuery: () => void;
  onClearMealType: () => void;
  onClearAll: () => void;
}

const MEAL_LABELS: Record<MealType, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snack: 'Snack',
};

export default function ActiveFilters({
  query,
  mealType,
  activeTags,
  onRemoveTag,
  onClearQuery,
  onClearMealType,
  onClearAll,
}: Props) {
  const hasQuery = query.trim() !== '';
  const hasMeal = mealType !== 'all';
  if (!hasQuery && !hasMeal && activeTags.length === 0) return null;

  return (
    <div className="active-filters">
      <span className="active-filters__label">Active:</span>
      <ul className="active-filters__list" aria-label="Active filters">
        {hasQuery && (
          <li>
            <button
              type="button"
              className="active-filters__chip active-filters__chip--query"
              onClick={onClearQuery}
              aria-label={`Remove search “${query.trim()}”`}
            >
              “{query.trim()}” <span aria-hidden="true">✕</span>
            </button>
          </li>
        )}
        {hasMeal && (
          <li>
            <button
              type="button"
              className={`active-filters__chip active-filters__chip--meal active-filters__chip--${mealType}`}
              onClick={onClearMealType}
              aria-label={`Remove meal type ${MEAL_LABELS[mealType]}`}
            >
              {MEAL_LABELS[mealType]} <span aria-hidden="true">✕</span>
            </button>
          </li>
        )}
        {activeTags.map((tag) => (
          <li key={tag}>
            <button
              type="button"
              className={`active-filters__chip tag-chip tag-chip--${TAG_REGISTRY[tag].group} tag-chip--active`}
              onClick={() => onRemoveTag(tag)}
              aria-label={`Remove ${TAG_REGISTRY[tag].label} filter`}
            >
              {TAG_REGISTRY[tag].label} <span aria-hidden="true">✕</span>
            </button>
          </li>
        ))}
      </ul>
      <button type="button" className="active-filters__clear" onClick={onClearAll}>
        Clear all
      </button>
    </div>
  );
}
