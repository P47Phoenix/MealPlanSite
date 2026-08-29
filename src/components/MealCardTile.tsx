import type { MealCard } from '../data/schema';
import { orderTagsForTile, type TagId } from '../data/tags';
import TagChip from './TagChip';

interface Props {
  card: MealCard;
  selected: boolean;
  highlightTags?: TagId[];
  onToggleSelect: (id: string) => void;
  onOpenDetail: (id: string) => void;
}

const MAX_VISIBLE_TAGS = 3;

export default function MealCardTile({
  card,
  selected,
  highlightTags = [],
  onToggleSelect,
  onOpenDetail,
}: Props) {
  const ordered = orderTagsForTile(card.tags, highlightTags);
  const visible = ordered.slice(0, MAX_VISIBLE_TAGS);
  const hidden = ordered.slice(MAX_VISIBLE_TAGS);
  const nameId = `tile-name-${card.id}`;
  const tagsId = `tile-tags-${card.id}`;

  return (
    <li className="meal-card-tile">
      <button
        type="button"
        className="meal-card-tile__body"
        onClick={() => onOpenDetail(card.id)}
        aria-labelledby={nameId}
        aria-describedby={card.tags.length > 0 ? tagsId : undefined}
      >
        <div className="meal-card-tile__header">
          <span className={`meal-type-badge meal-type-badge--${card.mealType}`}>{card.mealType}</span>
          <h3 className="meal-card-tile__name" id={nameId}>
            {card.name}
          </h3>
        </div>
        <p className="meal-card-tile__time">
          Prep {card.prepTimeMinutes} min · Cook {card.cookTimeMinutes} min
        </p>
        <dl className="meal-card-tile__macros">
          <div>
            <dt>Calories</dt>
            <dd>{card.nutrition.calories.value}</dd>
          </div>
          <div>
            <dt>Protein</dt>
            <dd>{card.nutrition.proteinG.value} g</dd>
          </div>
          <div>
            <dt>Sodium</dt>
            <dd>{card.nutrition.sodiumMg.value} mg</dd>
          </div>
          <div>
            <dt>Sat fat</dt>
            <dd>{card.nutrition.satFatG.value} g</dd>
          </div>
        </dl>
        {card.tags.length > 0 && (
          <div className="tag-row" id={tagsId}>
            {visible.map((def, i) => (
              <span key={def.id} className={`tag-row__item tag-row__item--${i + 1}`}>
                <TagChip tagId={def.id} variant="display" active={highlightTags.includes(def.id)} />
              </span>
            ))}
            {hidden.length > 0 && (
              <span className="tag-chip tag-chip--more">
                <span aria-hidden="true">+{hidden.length}</span>
                <span className="visually-hidden">
                  {hidden.length} more: {hidden.map((d) => d.label).join(', ')}
                </span>
              </span>
            )}
          </div>
        )}
      </button>
      <label className="meal-card-tile__select">
        <input
          type="checkbox"
          checked={selected}
          onChange={() => onToggleSelect(card.id)}
          aria-label={`Select ${card.name} for grocery list`}
        />
        <span>{selected ? 'Selected' : 'Select'}</span>
      </label>
    </li>
  );
}
