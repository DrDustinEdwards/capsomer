export interface SpinnerProps {
  // What is loading, in a word or two: "Loading", "Saving".
  label?: string;
  // The word is for screen readers only while the arc turns (inside a button that
  // already says what it does). Under reduced motion the word always shows.
  hideLabel?: boolean;
  size?: "sm" | "lg";
  // "page": centred in the space it is given, with its word under it, for a whole page or
  // panel that has nothing else to show yet. It is a status region.
  layout?: "page";
}

const Arc = () => (
  <svg className="cap-spinner-arc" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
    <circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.25" />
    <path fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" d="M8 2a6 6 0 0 1 6 6" />
  </svg>
);

export function Spinner({ label = "Loading", hideLabel, size, layout }: SpinnerProps) {
  return (
    <span className="cap-spinner" data-label={hideLabel ? "hidden" : undefined} data-size={size} data-layout={layout} role={layout === "page" ? "status" : undefined}>
      <Arc />
      <span className="cap-spinner-label">{label}</span>
    </span>
  );
}

export interface SkeletonProps {
  lines?: number;
  label?: string;
}

// Grey lines standing in for a page's content: busy, and "Loading" for a screen reader.
export function Skeleton({ lines = 3, label = "Loading" }: SkeletonProps) {
  return (
    <div className="cap-skeleton" aria-busy="true">
      <span className="cap-sr-only">{label}</span>
      {Array.from({ length: lines }, (_, i) => (
        <span className="cap-skeleton-line" aria-hidden="true" key={i} />
      ))}
    </div>
  );
}

export interface SkeletonBlockProps {
  shape?: "block" | "circle" | "card";
}

// One shape on its own (shadcn's Skeleton): an avatar, a card. Decorative: put it inside a
// busy region that says "Loading".
export function SkeletonBlock({ shape = "block" }: SkeletonBlockProps) {
  return <span className="cap-skeleton-block" data-shape={shape === "block" ? undefined : shape} aria-hidden="true" />;
}
