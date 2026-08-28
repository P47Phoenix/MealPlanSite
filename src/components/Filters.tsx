import type { MealType } from '../data/schema';

interface Props {
  mealType: MealType | 'all';
  onMealTypeChange: (value: MealType | 'all') => void;
  allTags: string[];
  activeTags: string[];
  onToggleTag: (tag: string) => void;
}

const MEAL_TYPES: (MealType | 'all')[] = ['all', 'breakfast', 'lunch', 'dinner', 'snack'];

export default function Filters({ mealType, onMealTypeChange, allTags, activeTags, onToggleTag }: Props) {
  return (
    <fieldset className="filters">
      <legend>Filter meals</legend>
      <div className="filters__group" role="radiogroup" aria-label="Filter by meal type">
        {MEAL_TYPES.map((type) => (
          <button
            key={type}
            type="button"
            role="radio"
            aria-checked={mealType === type}
            className={`filter-chip ${mealType === type ? 'filter-chip--active' : ''}`}
            onClick={() => onMealTypeChange(type)}
          >
            {type}
          </button>
        ))}
      </div>
      <div className="filters__group" aria-label="Filter by dietary tag">
        {allTags.map((tag) => (
          <button
            key={tag}
            type="button"
            aria-pressed={activeTags.includes(tag)}
            className={`filter-chip ${activeTags.includes(tag) ? 'filter-chip--active' : ''} ${
              tag === 'bedtime-snack' ? 'filter-chip--bedtime' : ''
            }`}
            onClick={() => onToggleTag(tag)}
          >
            {tag}
          </button>
        ))}
      </div>
    </fieldset>
  );
}
