import type { MealCard } from '../data/schema';

interface Props {
  card: MealCard;
  selected: boolean;
  onToggleSelect: (id: string) => void;
  onOpenDetail: (id: string) => void;
}

export default function MealCardTile({ card, selected, onToggleSelect, onOpenDetail }: Props) {
  return (
    <li className="meal-card-tile">
      <button
        type="button"
        className="meal-card-tile__body"
        onClick={() => onOpenDetail(card.id)}
        aria-label={`View details for ${card.name}`}
      >
        <div className="meal-card-tile__header">
          <span className={`meal-type-badge meal-type-badge--${card.mealType}`}>{card.mealType}</span>
          <h3 className="meal-card-tile__name">{card.name}</h3>
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
      </button>
      <label className="meal-card-tile__select">
        <input
          type="checkbox"
          role="checkbox"
          aria-checked={selected}
          checked={selected}
          onChange={() => onToggleSelect(card.id)}
          aria-label={`Select ${card.name} for grocery list`}
        />
        <span>{selected ? 'Selected' : 'Select'}</span>
      </label>
    </li>
  );
}
