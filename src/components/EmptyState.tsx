import type { MealType } from '../data/schema';
import { TAG_REGISTRY, type TagId } from '../data/tags';

interface Props {
  query: string;
  mealType: MealType | 'all';
  activeTags: TagId[];
  /** Grand total under the current query + tags across all meal types. */
  allCount: number;
  onShowAllMealTypes: () => void;
  onClearAll: () => void;
}

const PLURAL: Record<MealType | 'all', string> = {
  all: 'meals',
  breakfast: 'breakfasts',
  lunch: 'lunches',
  dinner: 'dinners',
  snack: 'snacks',
};

export default function EmptyState({
  query,
  mealType,
  activeTags,
  allCount,
  onShowAllMealTypes,
  onClearAll,
}: Props) {
  const q = query.trim();
  const tagLabels = activeTags.map((t) => TAG_REGISTRY[t].label);
  const showAll = mealType !== 'all' && allCount > 0;

  return (
    <div className="empty-state">
      <h2 className="empty-state__title">
        No {PLURAL[mealType]} match
        {q && <> “{q}”</>}
        {tagLabels.length > 0 && (
          <>
            {q ? ' with ' : ' '}
            {tagLabels.join(', ')}
          </>
        )}
        {!q && tagLabels.length === 0 && ' the current filters'}.
      </h2>
      <ul className="empty-state__hints">
        {q && <li>Check the spelling of your search</li>}
        {activeTags.length > 0 && <li>Try fewer attributes</li>}
        {mealType !== 'all' && <li>Try another meal type</li>}
      </ul>
      <div className="empty-state__actions">
        {showAll && (
          <button type="button" className="empty-state__button empty-state__button--primary" onClick={onShowAllMealTypes}>
            Show all meal types ({allCount})
          </button>
        )}
        <button type="button" className="empty-state__button" onClick={onClearAll}>
          Clear search &amp; filters
        </button>
      </div>
    </div>
  );
}
