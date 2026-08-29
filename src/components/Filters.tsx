import { useEffect, useState } from 'react';
import { TAG_GROUPS, TAGS_IN_GROUP_ORDER, type TagId } from '../data/tags';
import type { FacetCounts } from '../lib/search';
import TagChip from './TagChip';

interface Props {
  activeTags: TagId[];
  onToggleTag: (tag: TagId) => void;
  facets: FacetCounts;
}

function useIsNarrow(maxWidth = 480): boolean {
  const query = `(max-width: ${maxWidth}px)`;
  const [narrow, setNarrow] = useState(() =>
    typeof window !== 'undefined' && typeof window.matchMedia === 'function'
      ? window.matchMedia(query).matches
      : false,
  );
  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
    const mql = window.matchMedia(query);
    const handler = (e: MediaQueryListEvent) => setNarrow(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, [query]);
  return narrow;
}

export default function Filters({ activeTags, onToggleTag, facets }: Props) {
  const narrow = useIsNarrow();

  const groups = (
    <fieldset className="filter-panel">
      <legend className="filter-panel__legend">Filter by attribute</legend>
      {TAG_GROUPS.map((g) => (
        <div
          key={g.id}
          role="group"
          aria-labelledby={`tg-${g.id}`}
          className={`filter-panel__group filter-panel__group--${g.id}`}
        >
          <span id={`tg-${g.id}`} className="filter-panel__group-label">
            {g.label}
          </span>
          <div className="filter-panel__chips">
            {TAGS_IN_GROUP_ORDER[g.id].map((tagId) => (
              <TagChip
                key={tagId}
                tagId={tagId}
                variant="filter"
                active={activeTags.includes(tagId)}
                count={facets.tags[tagId]}
                disabled={facets.tags[tagId] === 0}
                onToggle={onToggleTag}
              />
            ))}
          </div>
        </div>
      ))}
    </fieldset>
  );

  if (!narrow) return groups;

  return (
    <details className="filter-panel__details" open={activeTags.length > 0 || undefined}>
      <summary className="filter-panel__summary">
        Filters{activeTags.length > 0 ? ` (${activeTags.length} active)` : ''}
      </summary>
      {groups}
    </details>
  );
}
