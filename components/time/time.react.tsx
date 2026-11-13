import { useEffect, useState, type ReactNode } from "react";
import { Tooltip } from "../tooltip/tooltip.react.tsx";
import { REFRESH_MS, UNREADABLE, exact, exactParts, text, toMs, type TimeFormat } from "./time.ts";
import { useHydrated } from "../hooks/hooks.react.tsx";

export interface TimeProps {
  // Milliseconds, a Date, or a server timestamp (a zoneless one is read as UTC). Null, undefined
  // or an empty string is no time at all: `empty` says so.
  at: number | Date | string | null | undefined;
  // Relative in rows; exact (viewer's zone and UTC) in a detail; "date" a long date with no time of
  // day, in UTC, so a server and a browser print the same ("September 12, 2026").
  format?: TimeFormat;
  // What to say when there is no time ("never", "Not yet run"). Without it a missing time reads
  // "an unreadable time", as one that cannot be read does.
  empty?: ReactNode;
  // A relative time with its exact time (the viewer's zone, then UTC) in a tooltip on hover and
  // keyboard focus, for a table that has no detail to show it in. The time takes a tab stop, so use
  // it where each row does not already have one. Drawn as spans, so it sits inside a paragraph.
  tip?: boolean;
  // A fixed "now", for a report or a test, or the server's now when its clock and the
  // browser's disagree (serverNow). Without it the text refreshes every 30 s.
  now?: number;
}

// The clock, ticking every 30 seconds while a relative time is shown.
function useClock(enabled: boolean): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!enabled) return;
    // oxlint-disable-next-line react/set-state-in-effect -- the clock restarts from now when a relative time starts showing
    setNow(Date.now());
    const t = window.setInterval(() => setNow(Date.now()), REFRESH_MS);
    return () => window.clearInterval(t);
  }, [enabled]);
  return now;
}

// The exact time in a tooltip beside a time, on hover and keyboard focus. The behavior module
// shows and hides it (Esc hides). The tip is a span, so it is valid inside a <p>.
function TimeTip({ t, hydrated, children }: { t: number; hydrated: boolean; children: ReactNode }) {
  return (
    <Tooltip
      as="span"
      side="inline-end"
      tip={
        // Plain text in the tip's own colors: an exact Time paints itself in --text, the tip's
        // background. The viewer's zone differs from the server's, so the browser's words win.
        <span suppressHydrationWarning>{exact(t, hydrated ? undefined : "UTC")}</span>
      }
    >
      {(trigger) => (
        // oxlint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- the time takes focus so a keyboard reaches its tooltip
        <span {...trigger} tabIndex={0} className="cap-time-tip">
          {children}
        </span>
      )}
    </Tooltip>
  );
}

export function Time({ at, format = "relative", now, empty, tip = false }: TimeProps) {
  const t = toMs(at);
  const clock = useClock(format === "relative" && now === undefined);
  const hydrated = useHydrated();
  const iso = Number.isFinite(t) ? new Date(t).toISOString() : undefined;
  // No time at all says so in the host's words.
  if ((at === null || at === undefined || at === "") && empty !== undefined)
    return (
      <span className="cap-time" data-empty="">
        {empty}
      </span>
    );
  // A time that cannot be read is said in words and is not a <time> (it has no datetime).
  if (!iso) return <span className="cap-time">{UNREADABLE}</span>;
  // The server cannot know the viewer's zone. Until hydration is done the time is drawn in UTC
  // on both sides ("October 2, 2026, 9:12 AM UTC", one text with no UTC part), so the markup the
  // server sent and the browser's first render are the same and React does not throw (#418);
  // then it redraws in the viewer's zone with the UTC part beside it. A relative time's words
  // can still differ by the clock; they are text alone, and the browser's win without a warning.
  const zone = hydrated ? undefined : "UTC";
  const p = format === "exact" ? exactParts(t, zone) : null;
  const el = (
    <time
      className="cap-time"
      dateTime={format === "date" ? iso.slice(0, 10) : iso}
      data-format={format === "relative" ? undefined : format}
      suppressHydrationWarning
    >
      {p ? (
        <>
          {p.utc ? `${p.local} ` : p.local}
          {p.utc ? <span className="cap-time-utc">{p.utc}</span> : null}
        </>
      ) : (
        text(t, format, now ?? clock, format === "date" ? "UTC" : zone)
      )}
    </time>
  );
  return tip && format !== "exact" ? (
    <TimeTip t={t} hydrated={hydrated}>
      {el}
    </TimeTip>
  ) : (
    el
  );
}
