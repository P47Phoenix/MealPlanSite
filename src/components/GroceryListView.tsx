import { useMemo } from 'react';
import type { MealCard } from '../data/schema';
import { buildGroceryList } from '../lib/groceryList';

interface Props {
  selectedCards: MealCard[];
  onClose: () => void;
}

const TARGETS = {
  protein: 123,
  sodium: 2000,
  satFat: 13,
};

const SECTION_LABELS: Record<string, string> = {
  produce: 'Produce',
  protein: 'Protein',
  dairy: 'Dairy',
  grains: 'Grains',
  bakery: 'Bakery',
  pantry: 'Pantry',
  other: 'Other',
};

export default function GroceryListView({ selectedCards, onClose }: Props) {
  const groceryList = useMemo(() => buildGroceryList(selectedCards), [selectedCards]);

  const totals = useMemo(() => {
    return selectedCards.reduce(
      (acc, card) => {
        acc.calories += card.nutrition.calories.value;
        acc.protein += card.nutrition.proteinG.value;
        acc.sodium += card.nutrition.sodiumMg.value;
        acc.satFat += card.nutrition.satFatG.value;
        return acc;
      },
      { calories: 0, protein: 0, sodium: 0, satFat: 0 },
    );
  }, [selectedCards]);

  const sectionEntries = Object.entries(groceryList).filter(([, items]) => items.length > 0);

  return (
    <div className="grocery-panel" role="dialog" aria-labelledby="grocery-heading">
      <div className="grocery-panel__header">
        <h2 id="grocery-heading">Grocery list</h2>
        <button type="button" className="close-button" onClick={onClose} aria-label="Close grocery list">
          ✕
        </button>
      </div>

      {selectedCards.length === 0 ? (
        <p>No cards selected yet. Select meal cards from the browse view to build a grocery list.</p>
      ) : (
        <>
          <section aria-labelledby="totals-heading" className="grocery-totals">
            <h3 id="totals-heading">Running totals for {selectedCards.length} selected card(s)</h3>
            <ul>
              <li>
                Calories: {Math.round(totals.calories)} kcal
              </li>
              <li>
                Protein: {totals.protein.toFixed(1)} g{' '}
                <span className="target-note">(target reference: {TARGETS.protein} g)</span>
              </li>
              <li>
                Sodium: {Math.round(totals.sodium)} mg{' '}
                <span className="target-note">(target reference: under {TARGETS.sodium} mg)</span>
              </li>
              <li>
                Saturated fat: {totals.satFat.toFixed(1)} g{' '}
                <span className="target-note">(target reference: {TARGETS.satFat} g)</span>
              </li>
            </ul>
          </section>

          <section aria-labelledby="items-heading">
            <h3 id="items-heading">Items by section</h3>
            {sectionEntries.map(([section, items]) => (
              <div key={section} className="grocery-section">
                <h4>{SECTION_LABELS[section] ?? section}</h4>
                <ul>
                  {items.map((item) => (
                    <li key={item.name}>
                      {item.quantity} {item.unit} {item.name}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </section>
        </>
      )}
    </div>
  );
}
