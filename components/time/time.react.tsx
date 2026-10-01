import { useEffect, useState } from "react";
import { REFRESH_MS, parse, text, type TimeFormat } from "./time.ts";

export interface TimeProps {
  // Milliseconds, a Date, or a server timestamp (a zoneless one is read as UTC).
  at: number | Date | string;
  // Relative in rows; exact (viewer's zone and UTC) in a detail.
  format?: TimeFormat;
  // A fixed "now", for a report or a test. Without it the text refreshes every 30 s.
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
  // The server's words can differ from the browser's (its clock, its zone); the browser's
  // win without a warning.
  return (
    <time className="cap-time" dateTime={iso} data-format={format === "exact" ? "exact" : undefined} suppressHydrationWarning>
      {text(t, format, now ?? clock)}
    </time>
  );
}
