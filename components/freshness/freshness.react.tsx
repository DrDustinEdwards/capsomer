import type { ReactNode } from "react";
import { Glyph } from "../status/status.react.tsx";
import { RING_R, ringDash } from "./freshness.ts";

export interface FreshnessProps {
  // How old the data is, already in words ("2 minutes ago"), set in bold.
  updated?: ReactNode;
  // A second clause after "·", dropped first when the line is short ("sites from pass 4 min ago").
  more?: ReactNode;
  // The share (0 to 1) of the interval left until the next read; leave out for no ring.
  share?: number;
  // The data is older than it should be: the line turns to warning, led by the warning glyph and
  // `staleLabel` ("Stale"), so the state is never color alone.
  stale?: boolean;
  staleLabel?: ReactNode;
  // The full times, for the title (hover) text.
  title?: string;
  // While there is nothing to show yet ("Reading the feed..."): a polite status line instead.
  pending?: ReactNode;
}

// The HTML contract in freshness.md.
export function Freshness({
  updated,
  more,
  share,
  stale,
  staleLabel = "Stale",
  title,
  pending,
}: FreshnessProps) {
  if (pending)
    return (
      <div className="cap-fresh" role="status" aria-live="polite">
        <span className="cap-fresh-text">{pending}</span>
      </div>
    );
  return (
    <div className="cap-fresh" data-stale={stale ? "" : undefined} title={title}>
      {share === undefined ? null : <FreshRing share={share} />}
      {stale ? (
        <span className="cap-fresh-stale">
          <Glyph name="warn" />
          {staleLabel}
        </span>
      ) : null}
      <span className="cap-fresh-text">
        Updated <b>{updated}</b>
      </span>
      {more ? <span className="cap-fresh-more">· {more}</span> : null}
    </div>
  );
}

// The countdown to the next read. Decorative: the words beside it say when the data was read.
export function FreshRing({ share }: { share: number }) {
  return (
    <svg className="cap-fresh-ring" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
      <circle
        className="cap-fresh-ring-track"
        cx="8"
        cy="8"
        r={RING_R}
        fill="none"
        strokeWidth="2"
      />
      <circle
        className="cap-fresh-ring-left"
        cx="8"
        cy="8"
        r={RING_R}
        fill="none"
        strokeWidth="2"
        strokeDasharray={ringDash(share)}
        transform="rotate(-90 8 8)"
        strokeLinecap="round"
      />
    </svg>
  );
}
