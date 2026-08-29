import { useEffect, useMemo, useRef, useState } from 'react';
import { MEAL_CARDS } from './data/cards';
import type { MealType } from './data/schema';
import type { TagId } from './data/tags';
import { buildHaystackMap, filterCards, facetCounts } from './lib/search';
import { decodeState, stateToUrl } from './lib/shareState';
import MealCardTile from './components/MealCardTile';
import Filters from './components/Filters';
import SearchBox from './components/SearchBox';
import MealTypeTabs from './components/MealTypeTabs';
import ActiveFilters from './components/ActiveFilters';
import ResultCount from './components/ResultCount';
import EmptyState from './components/EmptyState';
import DetailView from './components/DetailView';
import GroceryListView from './components/GroceryListView';

type View = 'browse' | 'detail';

const PANEL_ID = 'meal-grid-panel';

const VALID_IDS = new Set(MEAL_CARDS.map((c) => c.id));

export default function App() {
  const initialRef = useRef<ReturnType<typeof decodeState> | null>(null);
  if (initialRef.current === null) {
    initialRef.current = decodeState(window.location.search, VALID_IDS);
  }
  const initial = initialRef.current;

  const [view, setView] = useState<View>(initial.view ?? 'browse');
  const [activeCardId, setActiveCardId] = useState<string | null>(initial.activeCardId ?? null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(initial.selectedIds ?? new Set());
  const [query, setQuery] = useState(initial.query ?? '');
  const [mealType, setMealType] = useState<MealType | 'all'>(initial.mealType ?? 'all');
  const [activeTags, setActiveTags] = useState<TagId[]>(initial.activeTags ?? []);
  const [groceryOpen, setGroceryOpen] = useState(initial.groceryOpen ?? false);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const url = stateToUrl({
      query,
      mealType,
      activeTags,
      selectedIds,
      view,
      activeCardId,
      groceryOpen,
    });
    window.history.replaceState(null, '', url);
  }, [query, mealType, activeTags, selectedIds, view, activeCardId, groceryOpen]);

  const haystack = useMemo(() => buildHaystackMap(MEAL_CARDS), []);
  const criteria = useMemo(() => ({ query, mealType, tags: activeTags }), [query, mealType, activeTags]);

  const filteredCards = useMemo(
    () => filterCards(MEAL_CARDS, criteria, haystack),
    [criteria, haystack],
  );
  const facets = useMemo(() => facetCounts(MEAL_CARDS, criteria, haystack), [criteria, haystack]);

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

  function toggleTag(tag: TagId) {
    setActiveTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  }

  function clearAll() {
    setQuery('');
    setActiveTags([]);
    setMealType('all');
    searchRef.current?.focus();
  }

  function showAllMealTypes() {
    setMealType('all');
    // Land the user on the control that changed.
    requestAnimationFrame(() => document.getElementById('tab-all')?.focus());
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
            <SearchBox ref={searchRef} value={query} onChange={setQuery} />
            <Filters activeTags={activeTags} onToggleTag={toggleTag} facets={facets} />
            <div className="results-bar">
              <ResultCount shown={filteredCards.length} total={MEAL_CARDS.length} />
              <ActiveFilters
                query={query}
                mealType={mealType}
                activeTags={activeTags}
                onRemoveTag={toggleTag}
                onClearQuery={() => setQuery('')}
                onClearMealType={() => setMealType('all')}
                onClearAll={clearAll}
              />
            </div>
            <MealTypeTabs value={mealType} onChange={setMealType} counts={facets.mealType} panelId={PANEL_ID} />
            <div role="tabpanel" id={PANEL_ID} aria-labelledby={`tab-${mealType}`} className="meal-grid-panel">
              {filteredCards.length > 0 ? (
                <ul className="meal-card-grid">
                  {filteredCards.map((card) => (
                    <MealCardTile
                      key={card.id}
                      card={card}
                      selected={selectedIds.has(card.id)}
                      highlightTags={activeTags}
                      onToggleSelect={toggleSelect}
                      onOpenDetail={openDetail}
                    />
                  ))}
                </ul>
              ) : (
                <EmptyState
                  query={query}
                  mealType={mealType}
                  activeTags={activeTags}
                  allCount={facets.mealType.all}
                  onShowAllMealTypes={showAllMealTypes}
                  onClearAll={clearAll}
                />
              )}
            </div>
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
