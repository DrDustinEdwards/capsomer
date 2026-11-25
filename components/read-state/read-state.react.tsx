import type { ReactNode } from "react";
import { Banner } from "../banner/banner.react.tsx";
import { Empty } from "../empty/empty.react.tsx";
import { Spinner } from "../skeleton/skeleton.react.tsx";
import { Status } from "../status/status.react.tsx";
import { Time } from "../time/time.react.tsx";

// A read's states, said the same way in every app: reading, failed, nothing read yet, and read but empty. No data is a state, never a zero.

export interface ReadStateProps {
  what: string;
  loading: boolean;
  error?: string | null;
  hasData: boolean;
  // Why there is nothing yet, when no read has answered: "devkit's live workflow has not published one."
  empty?: ReactNode;
  onRetry?: () => void;
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
        <Status tone="nodata">No data</Status>
        {empty ? <> {empty}</> : null}
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
  at?: number | Date | string;
  reading: boolean;
  onRead: () => void;
  now?: number;
}

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

// One source of a page with several. "empty" is a read that found nothing; "nodata" nothing to say yet; "error" not read.
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
