import { TAG_REGISTRY, TAG_GROUPS, type TagId } from '../data/tags';

interface Props {
  tagId: TagId;
  variant: 'filter' | 'display';
  active?: boolean;
  count?: number;
  /** Filter variant only: no results would remain if toggled on. Stays focusable; click is a no-op. */
  disabled?: boolean;
  onToggle?: (tagId: TagId) => void;
}

export default function TagChip({ tagId, variant, active = false, count, disabled = false, onToggle }: Props) {
  const def = TAG_REGISTRY[tagId];
  const groupLabel = TAG_GROUPS.find((g) => g.id === def.group)!.label;
  // An active chip is never disabled — the user must always be able to remove it.
  const isDisabled = disabled && !active;
  const className = [
    'tag-chip',
    `tag-chip--${def.group}`,
    active ? 'tag-chip--active' : '',
    isDisabled ? 'tag-chip--disabled' : '',
  ]
    .filter(Boolean)
    .join(' ');

  if (variant === 'display') {
    return (
      <span className={className}>
        <span className="visually-hidden">{`${groupLabel}: `}</span>
        <span className="tag-chip__label">{def.label}</span>
      </span>
    );
  }

  // Group prefix + count go into the accessible name so the group is never
  // colour-only and screen readers hear e.g. "Cuisine: Seafood, 14 results".
  const name =
    count === undefined
      ? `${groupLabel}: ${def.label}`
      : `${groupLabel}: ${def.label}, ${count} ${count === 1 ? 'result' : 'results'}`;

  return (
    <button
      type="button"
      className={className}
      aria-label={name}
      aria-pressed={active}
      aria-disabled={isDisabled || undefined}
      onClick={() => {
        if (isDisabled) return;
        onToggle?.(tagId);
      }}
    >
      <span className="tag-chip__label">{def.label}</span>
      {count !== undefined && (
        <span className="tag-chip__count" aria-hidden="true">
          {count}
        </span>
      )}
    </button>
  );
}
