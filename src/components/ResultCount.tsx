import { useEffect, useState } from 'react';

interface Props {
  shown: number;
  total: number;
  /** Idle delay before the live region updates, so typing doesn't chatter. */
  announceDelayMs?: number;
}

export default function ResultCount({ shown, total, announceDelayMs = 500 }: Props) {
  const text = `Showing ${shown} of ${total} meals`;
  const [announced, setAnnounced] = useState(text);

  useEffect(() => {
    const id = window.setTimeout(() => setAnnounced(text), announceDelayMs);
    return () => window.clearTimeout(id);
  }, [text, announceDelayMs]);

  return (
    <>
      <p id="result-count" className="result-count">
        {text}
      </p>
      <div role="status" aria-live="polite" aria-atomic="true" className="visually-hidden">
        {announced}
      </div>
    </>
  );
}
