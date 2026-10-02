import { useEffect, useState } from "react";
import { REFRESH_MS, exactParts, parse, text, type TimeFormat } from "./time.ts";

export interface TimeProps {
  // Milliseconds, a Date, or a server timestamp (a zoneless one is read as UTC).
  at: number | Date | string;
  // Relative in rows; exact (viewer's zone and UTC) in a detail.
  format?: TimeFormat;
  // A fixed "now", for a report or a test, or the server's now when its clock and the
  // browser's disagree (serverNow). Without it the text refreshes every 30 s.
  now?: number;
}

function toMs(at: TimeProps["at"]): number {
  return typeof at === "number" ? at : at instanceof Date ? at.getTime() : parse(at);
}

// The clock, ticking every 30 seconds while a relative time is shown.
function useClock(enabled: boolean): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!enabled) return;
    setNow(Date.now());
    const t = window.setInterval(() => setNow(Date.now()), REFRESH_MS);
    return () => window.clearInterval(t);
  }, [enabled]);
  return now;
}

export function Time({ at, format = "relative", now }: TimeProps) {
  const t = toMs(at);
  const clock = useClock(format === "relative" && now === undefined);
  const iso = Number.isFinite(t) ? new Date(t).toISOString() : undefined;
  // A time that cannot be read is said in words and is not a <time> (it has no datetime).
  if (!iso) return <span className="cap-time">{text(t, format)}</span>;
  // The server's words can differ from the browser's (its clock, its zone); the browser's
  // win without a warning.
  const p = format === "exact" ? exactParts(t) : null;
  return (
    <time className="cap-time" dateTime={iso} data-format={format === "exact" ? "exact" : undefined} suppressHydrationWarning>
      {p ? (
        <>
          {p.utc ? `${p.local} ` : p.local}
          {p.utc ? <span className="cap-time-utc">{p.utc}</span> : null}
        </>
      ) : (
        text(t, format, now ?? clock)
      )}
    </time>
  );
}
