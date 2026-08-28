import { useMemo, useState } from 'react';
import { MEAL_CARDS } from './data/cards';
import type { MealType } from './data/schema';
import MealCardTile from './components/MealCardTile';
import Filters from './components/Filters';
import DetailView from './components/DetailView';
import GroceryListView from './components/GroceryListView';

type View = 'browse' | 'detail';

export default function App() {
  const [view, setView] = useState<View>('browse');
  const [activeCardId, setActiveCardId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [mealType, setMealType] = useState<MealType | 'all'>('all');
  const [activeTags, setActiveTags] = useState<string[]>([]);
  const [groceryOpen, setGroceryOpen] = useState(false);

  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    for (const card of MEAL_CARDS) {
      for (const tag of card.tags) tagSet.add(tag);
    }
    return Array.from(tagSet).sort();
  }, []);

  const filteredCards = useMemo(() => {
    return MEAL_CARDS.filter((card) => {
      if (mealType !== 'all' && card.mealType !== mealType) return false;
      if (activeTags.length > 0 && !activeTags.every((t) => card.tags.includes(t))) return false;
      return true;
    });
  }, [mealType, activeTags]);

  const selectedCards = useMemo(
    () => MEAL_CARDS.filter((card) => selectedIds.has(card.id)),
    [selectedIds],
  );

  const activeCard = useMemo(
    () => (activeCardId ? MEAL_CARDS.find((c) => c.id === activeCardId) ?? null : null),
    [activeCardId],
  );

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleTag(tag: string) {
    setActiveTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  }

  function openDetail(id: string) {
    setActiveCardId(id);
    setView('detail');
  }

  function backToBrowse() {
    setView('browse');
    setActiveCardId(null);
  }

  return (
    <div className="app">
      <header className="app__header">
        <h1>Meal Card Planner</h1>
        <button
          type="button"
          className="cart-button"
          onClick={() => setGroceryOpen(true)}
          aria-label={`Open grocery list, ${selectedIds.size} card(s) selected`}
        >
          🛒 Grocery list <span className="cart-button__count">{selectedIds.size}</span>
        </button>
      </header>

      <main>
        {view === 'browse' && (
          <>
            <Filters
              mealType={mealType}
              onMealTypeChange={setMealType}
              allTags={allTags}
              activeTags={activeTags}
              onToggleTag={toggleTag}
            />
            <ul className="meal-card-grid">
              {filteredCards.map((card) => (
                <MealCardTile
                  key={card.id}
                  card={card}
                  selected={selectedIds.has(card.id)}
                  onToggleSelect={toggleSelect}
                  onOpenDetail={openDetail}
                />
              ))}
            </ul>
            {filteredCards.length === 0 && <p>No meal cards match the current filters.</p>}
          </>
        )}

        {view === 'detail' && activeCard && (
          <DetailView
            card={activeCard}
            selected={selectedIds.has(activeCard.id)}
            onToggleSelect={toggleSelect}
            onBack={backToBrowse}
          />
        )}
      </main>

      {groceryOpen && (
        <GroceryListView selectedCards={selectedCards} onClose={() => setGroceryOpen(false)} />
      )}
    </div>
  );
}
