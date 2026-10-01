import type { ReactNode } from "react";
import { Glyph } from "../status/status.react.tsx";

export type EmptyKind = "nothing-yet" | "no-match" | "all-clear" | "failed";

export interface EmptyProps {
  kind: EmptyKind;
  // nothing-yet: "No sites are watched yet". no-match: "No jobs match “Blocked”".
  // failed: "Could not load the queue". all-clear: defaults to "All clear".
  title?: ReactNode;
  // One plain sentence: how to add the first, what the filter hides, what failed.
  children?: ReactNode;
  // nothing-yet: the one way to add the first. no-match: Clear filter. failed: Try again.
  action?: ReactNode;
}

export function Empty({ kind, title, children, action }: EmptyProps) {
  let head: ReactNode;
  if (kind === "all-clear") {
    head = (
      <span className="cap-status" data-tone="ok">
        <Glyph name="ok" />
        {title ?? "All clear"}
      </span>
    );
  } else if (kind === "failed") {
    head = (
      <>
        <Glyph name="crit" />
        {title}
      </>
    );
  } else {
    head = title;
  }
  return (
    <div className="cap-empty" data-kind={kind} role={kind === "failed" ? "alert" : undefined}>
      <p className="cap-empty-title">{head}</p>
      {children ? <p className="cap-empty-text">{children}</p> : null}
      {kind === "all-clear" ? null : action}
    </div>
  );
}

const Arc = () => (
  <svg className="cap-spinner-arc" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
    <circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.25" />
    <path fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" d="M8 2a6 6 0 0 1 6 6" />
  </svg>
);

export interface SpinnerProps {
  // What is loading, in a word or two: "Loading", "Saving".
  label?: string;
  // The word is for screen readers only while the arc turns (inside a button that
  // already says what it does). Under reduced motion the word always shows.
  hideLabel?: boolean;
}

export function Spinner({ label = "Loading", hideLabel }: SpinnerProps) {
  return (
    <span className="cap-spinner" data-label={hideLabel ? "hidden" : undefined}>
      <Arc />
      <span className="cap-spinner-label">{label}</span>
    </span>
  );
}

export interface SkeletonProps {
  lines?: number;
  label?: string;
}

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

export interface WaitProps {
  label: string;
  // Over 10 seconds, say how long: "This usually takes about 30 seconds."
  children: ReactNode;
}

export function Wait({ label, children }: WaitProps) {
  return (
    <div className="cap-empty-wait" aria-busy="true">
      <Spinner label={label} />
      <p className="cap-empty-text">{children}</p>
    </div>
  );
}
