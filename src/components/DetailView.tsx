import type { MealCard } from '../data/schema';

interface Props {
  card: MealCard;
  selected: boolean;
  onToggleSelect: (id: string) => void;
  onBack: () => void;
}

function NutritionRow({
  label,
  value,
  unit,
  confidence,
}: {
  label: string;
  value: number;
  unit: string;
  confidence: 'verified' | 'estimated';
}) {
  return (
    <tr>
      <th scope="row">{label}</th>
      <td>
        {value} {unit}
      </td>
      <td>
        <span className={`confidence-flag confidence-flag--${confidence}`}>{confidence}</span>
      </td>
    </tr>
  );
}

export default function DetailView({ card, selected, onToggleSelect, onBack }: Props) {
  return (
    <article className="detail-view">
      <button type="button" className="back-button" onClick={onBack}>
        ← Back to browse
      </button>
      <header className="detail-view__header">
        <span className={`meal-type-badge meal-type-badge--${card.mealType}`}>{card.mealType}</span>
        <h2>{card.name}</h2>
        <p className="detail-view__time">
          Prep {card.prepTimeMinutes} min · Cook {card.cookTimeMinutes} min
        </p>
        <ul className="detail-view__tags" aria-label="Tags">
          {card.tags.map((tag) => (
            <li key={tag} className="tag-pill">
              {tag}
            </li>
          ))}
        </ul>
        <button
          type="button"
          role="checkbox"
          aria-checked={selected}
          className={`select-toggle ${selected ? 'select-toggle--active' : ''}`}
          onClick={() => onToggleSelect(card.id)}
        >
          {selected ? '✓ Selected for grocery list' : 'Add to grocery list'}
        </button>
      </header>

      <section aria-labelledby="ingredients-heading">
        <h3 id="ingredients-heading">Ingredients</h3>
        <ul className="ingredients-list">
          {card.ingredients.map((ing) => (
            <li key={`${ing.name}-${ing.unit}`}>
              {ing.quantity} {ing.unit} {ing.name}{' '}
              <span className="ingredient-section">({ing.section})</span>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="steps-heading">
        <h3 id="steps-heading">Steps</h3>
        <ol className="steps-list">
          {card.steps.map((step, i) => (
            <li key={i}>{step}</li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="nutrition-heading">
        <h3 id="nutrition-heading">Nutrition</h3>
        <table className="nutrition-table">
          <thead>
            <tr>
              <th scope="col">Figure</th>
              <th scope="col">Value</th>
              <th scope="col">Confidence</th>
            </tr>
          </thead>
          <tbody>
            <NutritionRow
              label="Calories"
              value={card.nutrition.calories.value}
              unit="kcal"
              confidence={card.nutrition.calories.confidence}
            />
            <NutritionRow
              label="Protein"
              value={card.nutrition.proteinG.value}
              unit="g"
              confidence={card.nutrition.proteinG.confidence}
            />
            <NutritionRow
              label="Sodium"
              value={card.nutrition.sodiumMg.value}
              unit="mg"
              confidence={card.nutrition.sodiumMg.confidence}
            />
            <NutritionRow
              label="Saturated fat"
              value={card.nutrition.satFatG.value}
              unit="g"
              confidence={card.nutrition.satFatG.confidence}
            />
            <NutritionRow
              label="Carbs"
              value={card.nutrition.carbsG.value}
              unit="g"
              confidence={card.nutrition.carbsG.confidence}
            />
          </tbody>
        </table>
      </section>

      {card.cooksNotes && (
        <section aria-labelledby="notes-heading" className="cooks-notes">
          <h3 id="notes-heading">Cook's notes</h3>
          <p>{card.cooksNotes}</p>
        </section>
      )}
    </article>
  );
}
