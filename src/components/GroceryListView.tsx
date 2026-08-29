import { useMemo, useState } from 'react';
import type { MealCard } from '../data/schema';
import { buildGroceryList, type GroceryItem } from '../lib/groceryList';
import {
  getGroceryDisplayMode,
  setGroceryDisplayMode,
  getShowSourceRecipes,
  setShowSourceRecipes,
  type GroceryDisplayMode,
} from '../lib/preferences';

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

const SECTION_ORDER = ['produce', 'protein', 'dairy', 'grains', 'bakery', 'pantry', 'other'];

function formatItemLine(item: GroceryItem, displayMode: GroceryDisplayMode): string {
  if (item.purchase) {
    let line = `${item.purchase.quantity} ${item.purchase.unit} ${item.name}`;
    if (displayMode === 'purchase+raw') {
      line += ` (recipe total: ${item.quantity} ${item.unit})`;
    }
    return line;
  }
  return `${item.quantity} ${item.unit} ${item.name}`;
}

export default function GroceryListView({ selectedCards, onClose }: Props) {
  const [copied, setCopied] = useState(false);
  const [listCopied, setListCopied] = useState(false);
  const [displayMode, setDisplayMode] = useState<GroceryDisplayMode>(getGroceryDisplayMode);
  const [showSourceRecipes, setShowSourceRecipesState] = useState<boolean>(getShowSourceRecipes);
  const groceryList = useMemo(() => buildGroceryList(selectedCards), [selectedCards]);

  function copyLink() {
    navigator.clipboard
      .writeText(window.location.href)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(() => {});
  }

  function handleDisplayModeChange(mode: GroceryDisplayMode) {
    setDisplayMode(mode);
    setGroceryDisplayMode(mode);
  }

  function handleShowSourceRecipesChange(show: boolean) {
    setShowSourceRecipesState(show);
    setShowSourceRecipes(show);
  }

  function copyListAsText() {
    const text = SECTION_ORDER.filter((section) => groceryList[section as keyof typeof groceryList]?.length > 0)
      .map((section) => {
        const items = groceryList[section as keyof typeof groceryList];
        const header = (SECTION_LABELS[section] ?? section).toUpperCase();
        const lines = items.map((item) => formatItemLine(item, displayMode));
        return [header, ...lines].join('\n');
      })
      .join('\n\n');

    navigator.clipboard
      .writeText(text)
      .then(() => {
        setListCopied(true);
        setTimeout(() => setListCopied(false), 2000);
      })
      .catch(() => {});
  }

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
        <button type="button" className="copy-link-button" onClick={copyLink}>
          Copy link
        </button>
        <span aria-live="polite" className="copy-confirmation">
          {copied ? 'Link copied!' : ''}
        </span>
        <button type="button" className="copy-link-button" onClick={copyListAsText}>
          Copy list as text
        </button>
        <span aria-live="polite" className="copy-confirmation">
          {listCopied ? 'List copied!' : ''}
        </span>
        <button type="button" className="close-button" onClick={onClose} aria-label="Close grocery list">
          ✕
        </button>
      </div>

      {selectedCards.length > 0 && (
        <div className="grocery-panel__controls">
          <label>
            Display:{' '}
            <select
              value={displayMode}
              onChange={(e) => handleDisplayModeChange(e.target.value as GroceryDisplayMode)}
            >
              <option value="purchase">Purchase quantities</option>
              <option value="purchase+raw">Purchase + recipe totals</option>
            </select>
          </label>
          <label>
            <input
              type="checkbox"
              checked={showSourceRecipes}
              onChange={(e) => handleShowSourceRecipesChange(e.target.checked)}
            />{' '}
            Show source recipes
          </label>
        </div>
      )}

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
                    <li key={`${section}-${item.name}-${item.unit}`}>
                      {item.purchase ? (
                        <>
                          {item.purchase.quantity} {item.purchase.unit} {item.name}
                          {displayMode === 'purchase+raw' && (
                            <span className="target-note">
                              {' '}
                              (recipe total: {item.quantity} {item.unit})
                            </span>
                          )}
                        </>
                      ) : (
                        <>
                          {item.quantity} {item.unit} {item.name}
                        </>
                      )}
                      {showSourceRecipes && item.sourceCards.length > 0 && (
                        <ul className="grocery-source-list">
                          {item.sourceCards.map((sourceName) => (
                            <li key={sourceName} className="target-note">
                              {sourceName}
                            </li>
                          ))}
                        </ul>
                      )}
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
