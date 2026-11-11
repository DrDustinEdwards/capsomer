import type { ReactNode } from "react";
import { Banner } from "../banner/banner.react.tsx";
import { Empty } from "../empty/empty.react.tsx";
import { Spinner } from "../skeleton/skeleton.react.tsx";
import { Status } from "../status/status.react.tsx";
import { Time } from "../time/time.react.tsx";

// A read's states, said the same way in every app: reading, failed, nothing read yet, and a read
// that worked but found nothing. No data is a state, never a zero (patterns.md, "No data").

export interface ReadStateProps {
  // What is being read, in words: "the queue", "the scoreboard".
  what: string;
  // A read is under way.
  loading: boolean;
  // The last read's error, in words, if it failed.
  error?: string | null;
  // There is an answer to show (the last good read, or this one).
  hasData: boolean;
  // Why there is nothing yet, when no read has answered: "devkit's live workflow has not published one."
  empty?: ReactNode;
  // Try the read again (the failed state's button).
  onRetry?: () => void;
  // The answer, drawn once there is one.
  children: ReactNode;
}

export function ReadState({
  what,
  loading,
  error,
  hasData,
  empty,
  onRetry,
  children,
}: ReadStateProps) {
  if (!hasData && loading)
    return (
      <div className="cap-read-state" data-state="reading">
        <Spinner layout="page" label={`Reading ${what}`} />
      </div>
    );
  if (!hasData && error)
    return (
      <Empty
        kind="failed"
        title={`Could not read ${what}`}
        action={
          onRetry ? (
            <button type="button" className="cap-btn" onClick={onRetry}>
              Try again
            </button>
          ) : undefined
        }
      >
        {error}
      </Empty>
    );
  if (!hasData)
    return (
      <p className="cap-read-state" data-state="nothing-yet">
        <Status tone="nodata">No data</Status> {empty ?? "No read yet."}
      </p>
    );
  return (
    <>
      {error ? (
        <Banner tone="warn">
          Could not read {what} again: {error}. Showing the last answer.
        </Banner>
      ) : null}
      {children}
    </>
  );
}

export interface ReadAgainProps {
  // When the answer on screen was read.
  at?: number | Date | string;
  // A read is under way.
  reading: boolean;
  onRead: () => void;
  // A fixed now, for a report or a test.
  now?: number;
}

// The source line's "read 5 minutes ago · Read again": how old the answer is, and the one way to
// read it again. Goes in a panel's `src`.
export function ReadAgain({ at, reading, onRead, now }: ReadAgainProps) {
  return (
    <span className="cap-read-again">
      {at !== undefined ? (
        <span>
          Read <Time at={at} now={now} />
        </span>
      ) : null}
      <button
        type="button"
        className="cap-btn"
        data-size="sm"
        aria-busy={reading || undefined}
        disabled={reading}
        onClick={onRead}
      >
        {reading ? "Reading again" : "Read again"}
      </button>
    </span>
  );
}

// One source of a page with several: its answer, or why it has none. "empty" is a read that worked
// and found nothing; "nodata" a source with nothing to say yet; "error" a source that was not read.
export type SourceResult<T> =
  | { ok: true; data: T }
  | { ok: false; kind: "empty" | "nodata" | "error"; reason: string };

export interface SourceStateProps<T> {
  src: SourceResult<T>;
  children: (data: T) => ReactNode;
}

export function SourceState<T>({ src, children }: SourceStateProps<T>) {
  if (src.ok) return <>{children(src.data)}</>;
  if (src.kind === "empty")
    return (
      <p className="cap-read-state" data-state="empty">
        {src.reason}
      </p>
    );
  return (
    <p className="cap-read-state" data-state={src.kind}>
      <Status tone={src.kind === "error" ? "warn" : "nodata"}>
        {src.kind === "error" ? "Not read" : "No data"}
      </Status>{" "}
      {src.reason}
    </p>
  );
}
