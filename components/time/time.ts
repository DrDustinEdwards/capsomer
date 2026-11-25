// Times in words. Relative in rows ("5 minutes ago", never "5m"), exact in the viewer's
// zone with UTC beside it. The pure functions take the zone so they can be checked anywhere; in a page
// the zone is the viewer's.

import { fromDateTimeLocal, toDateTimeLocal } from "../field/field.ts";
import { dayKey } from "@dustinedwards/site-runtime/time";
import { DAY, HOUR, MIN, SEC, two } from "./time-duration.ts";
export { SEC, MIN, HOUR, DAY, two, timecode, duration, span, until } from "./time-duration.ts";
export type { DurationStyle, DurationOptions } from "./time-duration.ts";

// How often enhance() and the React wrapper redraw relative times.
export const REFRESH_MS = 30 * SEC;

// A server timestamp with no zone (D1's datetime('now'), "YYYY-MM-DD HH:MM:SS", or the
// same with a T) is UTC, because every timestamp the Worker writes is; Date.parse would
// read it as local time. An ISO string with a zone passes through.
const ZONELESS = /^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}(:\d{2}(\.\d+)?)?$/;

export function parse(iso: string): number {
  const s = iso.trim();
  return Date.parse(ZONELESS.test(s) ? `${s.replace(" ", "T")}Z` : s);
}

// "in 3 hours", "5 minutes ago", and with numeric: "auto", "yesterday" and "tomorrow", "today", "last
// month": the words come from the platform's Intl.RelativeTimeFormat, not from strings kept here
// (MDN: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/RelativeTimeFormat).
const RTF = new Intl.RelativeTimeFormat("en-US", { numeric: "auto" });

// A time as a number of milliseconds: a number, a Date, or a server timestamp (a zoneless one is
// UTC). NaN for nothing, an empty string or a value that is not a time.
export function toMs(at: number | Date | string | null | undefined): number {
  if (at === null || at === undefined || at === "") return Number.NaN;
  return typeof at === "number" ? at : at instanceof Date ? at.getTime() : parse(at);
}

// The same, null where toMs gives NaN, for a caller that tests for "no time" with `== null`.
export function toMsOrNull(at: number | Date | string | null | undefined): number | null {
  const t = toMs(at);
  return Number.isFinite(t) ? t : null;
}

// Whole calendar days from `t` to `now` in the zone: 1 is yesterday, -1 tomorrow.
export function calendarDays(t: number, now: number, zone?: string): number {
  const at = (x: number) => {
    const [y = 0, m = 1, d = 1] = dayKey(x, zone).split("-").map(Number);
    return Date.UTC(y, m - 1, d);
  };
  return Math.round((at(now) - at(t)) / DAY);
}

// "September 12", or "September 12, 2025" when the year is not this one: American English,
// the family's.
export function day(t: number, now: number = Date.now(), zone?: string): string {
  const year = (x: number) =>
    new Intl.DateTimeFormat("en-US", { timeZone: zone, year: "numeric" }).format(x);
  return new Intl.DateTimeFormat("en-US", {
    timeZone: zone,
    day: "numeric",
    month: "long",
    year: year(t) === year(now) ? undefined : "numeric",
  }).format(t);
}

export interface RelativeOptions {
  // "auto": minutes and hours, then calendar days. "day": calendar days only, then months
  // ("today", "yesterday", "3 days ago", "2 months ago"), for a row that says which day, not how
  // long ago to the minute.
  granularity?: "auto" | "day";
}

// Relative, spelled out: "just now", "less than a minute ago", "5 minutes ago",
// "3 hours ago", "yesterday", "4 days ago", "September 12"; and ahead, "in 3 hours",
// "tomorrow". Minutes and hours are whole and round down, so "1 hour ago" means at least
// an hour. The unit words are Intl.RelativeTimeFormat's.
export function relative(
  t: number,
  now: number = Date.now(),
  zone?: string,
  options: RelativeOptions = {},
): string {
  const d = now - t;
  const a = Math.abs(d);
  const ahead = d < 0;
  if (!Number.isFinite(d)) return "";
  const days = calendarDays(t, now, zone);
  if (options.granularity === "day") {
    if (Math.abs(days) < 30) return RTF.format(-days, "day");
    return RTF.format(-Math.trunc(days / 30), "month");
  }
  const say = (n: number, unit: "minute" | "hour" | "day") => RTF.format(ahead ? n : -n, unit);
  if (a < 10 * SEC) return "just now";
  if (a < MIN) return ahead ? "in less than a minute" : "less than a minute ago";
  if (a < HOUR) return say(Math.floor(a / MIN), "minute");
  if (a < DAY) return say(Math.floor(a / HOUR), "hour");
  if (days === 0) return say(Math.floor(a / HOUR), "hour");
  if (Math.abs(days) < 7) return RTF.format(-days, "day");
  return day(t, now, zone);
}

// The Portal's compact UTC form, for logs and ids: "2026-09-30 13:02Z".
export function utc(t: number): string {
  return `${new Date(t).toISOString().replace("T", " ").slice(0, 16)}Z`;
}

// Dates with no "ago": a long date, a medium one, a month and day, with or without the time.

export type DateStyle = "long" | "medium" | "monthDay" | "monthYear" | "weekday" | "time";

export interface FormatDateOptions {
  // "long": "September 12, 2026". "medium": "Sep 12, 2026". "monthDay": "Sep 12", for a chart's
  // axis or a window short enough that the year is noise. "monthYear": "September 2026", a group's heading. "weekday": "Saturday, September 12", a
  // meeting's day heading. "time": the time of day alone, "3:04 PM" (with `zoneName`, "3:04 PM UTC").
  // Default "long".
  style?: DateStyle;
  // Add the time of day: "Sep 12, 2026, 3:04 PM". Ignored for "monthDay", "monthYear" and "weekday".
  time?: boolean;
  // Name the zone after a time: "Sep 12, 2026, 3:04 PM UTC". Only with `time`.
  zoneName?: boolean;
  // Show the year (true) or leave it out (false) whatever the style does by default: "Sep 12, 2026"
  // for a date in another year than today's and "Sep 12" for one in this year; "Saturday,
  // September 12, 2026" for a meeting's day heading. Not for "time" or "monthYear".
  year?: boolean;
  // An IANA zone, or "viewer" for the reader's own. Default "UTC": a page that is rendered on a
  // server and hydrated in the browser needs the same text on both sides, and a server cannot
  // know the viewer's zone (a local zone makes a hydration mismatch).
  zone?: string;
}

const DATE_FORMATS = new Map<string, Intl.DateTimeFormat>();
function cachedFormat(key: string, make: () => Intl.DateTimeFormat): Intl.DateTimeFormat {
  let f = DATE_FORMATS.get(key);
  if (!f) DATE_FORMATS.set(key, (f = make()));
  return f;
}

// A date, American English (the family's), from a number, a Date or a timestamp string. Null for a
// value that is not a time ("Invalid Date" is never shown; the caller says what goes in its place).
// Intl.DateTimeFormat does the words: dateStyle and timeStyle (MDN:
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat/DateTimeFormat).
export function formatDate(
  at: number | Date | string | null | undefined,
  options: FormatDateOptions = {},
): string | null {
  const t = toMs(at);
  if (!Number.isFinite(t)) return null;
  const { style = "long", time = false, zoneName: named = false, zone: z = "UTC", year } = options;
  const zone = z === "viewer" ? undefined : z;
  const dayOnly = style === "monthDay" || style === "monthYear" || style === "weekday";
  const timed = style === "time" || (time && !dayOnly);
  const key = `${style}|${timed}|${zone ?? ""}|${year}`;
  const f = cachedFormat(key, () =>
    year !== undefined &&
    (style === "long" || style === "medium" || style === "monthDay" || style === "weekday")
      ? new Intl.DateTimeFormat("en-US", {
          timeZone: zone,
          weekday: style === "weekday" ? "long" : undefined,
          month: style === "long" || style === "weekday" ? "long" : "short",
          day: "numeric",
          year: year ? "numeric" : undefined,
          hour: timed ? "numeric" : undefined,
          minute: timed ? "2-digit" : undefined,
        })
      : style === "monthDay"
        ? new Intl.DateTimeFormat("en-US", { timeZone: zone, month: "short", day: "numeric" })
        : style === "monthYear"
          ? new Intl.DateTimeFormat("en-US", { timeZone: zone, month: "long", year: "numeric" })
          : style === "weekday"
            ? new Intl.DateTimeFormat("en-US", {
                timeZone: zone,
                weekday: "long",
                month: "long",
                day: "numeric",
              })
            : style === "time"
              ? new Intl.DateTimeFormat("en-US", {
                  timeZone: zone,
                  hour: "numeric",
                  minute: "2-digit",
                })
              : new Intl.DateTimeFormat("en-US", {
                  timeZone: zone,
                  dateStyle: style,
                  timeStyle: time ? "short" : undefined,
                }),
  );
  // Some engines put a narrow no-break space before AM and PM; a plain space reads and copies the same everywhere.
  const text = f.format(t).replaceAll("\u202f", " ");
  return timed && named ? `${text} ${zoneName(t, zone)}` : text;
}

// A meeting's dates: "May 1, 2026", "May 1, 2026 to May 2, 2026", or null with no dates. One date
// when both are the same moment.
export function dateRange(
  start: number | Date | string | null | undefined,
  end: number | Date | string | null | undefined,
  options: Pick<FormatDateOptions, "style" | "zone"> = {},
): string | null {
  const a = toMs(start);
  const b = toMs(end);
  const from = formatDate(a, options);
  const to = formatDate(b, options);
  if (from && to) return a === b || from === to ? from : `${from} to ${to}`;
  return from ?? to;
}

function parts(t: number, zone: string | undefined): Record<string, string> {
  const f = new Intl.DateTimeFormat("en-US", {
    timeZone: zone,
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
  const out: Record<string, string> = {};
  for (const p of f.formatToParts(t)) out[p.type] = p.value;
  return out;
}

const zoneWord = (locale: string, t: number, zone?: string) =>
  new Intl.DateTimeFormat(locale, { timeZone: zone, timeZoneName: "short" })
    .formatToParts(t)
    .find((p) => p.type === "timeZoneName")?.value ?? "";

// The zone's short name as an American reader knows it: "CST", "CDT", "EST", "PDT".
// en-US has names only for the American zones and writes "GMT+1" for the rest, so a zone it
// has no name for takes the British one when there is one ("BST", "CEST"), else the offset.
export function zoneName(t: number, zone?: string): string {
  const us = zoneWord("en-US", t, zone);
  if (!/^(GMT|UTC)[+-]/.test(us)) return us;
  const gb = zoneWord("en-GB", t, zone);
  return /^(GMT|UTC)[+-]/.test(gb) || gb === "" ? us : gb;
}

function isUtc(zone?: string): boolean {
  const z = new Intl.DateTimeFormat("en-US", { timeZone: zone }).resolvedOptions().timeZone;
  return z === "UTC" || z === "Etc/UTC" || z === "Etc/GMT" || z === "GMT";
}

// What a time that cannot be read says, in place of a blank or "NaN" (the Portal's
// exactTime does the same): a row never shows nothing where a time belongs.
export const UNREADABLE = "an unreadable time";

// Exact, in the viewer's zone with UTC beside it, in two parts so the UTC part can be kept
// whole on a line (the Portal's `.when .faint { white-space: nowrap }`): the local time, and
// "(1:02 PM UTC)". UTC's date is added when it differs from the local one; a viewer in UTC sees
// one time and no second part.
export function exactParts(t: number, zone?: string): { local: string; utc: string | null } {
  if (!Number.isFinite(t)) return { local: UNREADABLE, utc: null };
  const u = parts(t, "UTC");
  const uDate = `${u.month} ${u.day}, ${u.year}`;
  const uTime = `${u.hour}:${u.minute} ${u.dayPeriod} UTC`;
  if (isUtc(zone)) return { local: `${uDate}, ${uTime}`, utc: null };
  const l = parts(t, zone);
  const lDate = `${l.month} ${l.day}, ${l.year}`;
  return {
    local: `${lDate}, ${l.hour}:${l.minute} ${l.dayPeriod} ${zoneName(t, zone)}`,
    utc: `(${lDate === uDate ? uTime : `${uDate}, ${uTime}`})`,
  };
}

// "November 3, 2026, 8:00 AM CST (2:00 PM UTC)".
export function exact(t: number, zone?: string): string {
  const p = exactParts(t, zone);
  return p.utc ? `${p.local} ${p.utc}` : p.local;
}

// "relative": 5 minutes ago. "exact": the viewer's zone, then UTC. "date": a long date with no time
// of day, in UTC ("September 12, 2026"), for a publication date or a deadline.
export type TimeFormat = "relative" | "exact" | "date";

// The text a <time class="cap-time"> shows.
export function text(
  t: number,
  format: TimeFormat,
  now: number = Date.now(),
  zone?: string,
): string {
  if (!Number.isFinite(t)) return UNREADABLE;
  if (format === "date") return formatDate(t, { zone: zone ?? "UTC" }) ?? UNREADABLE;
  return format === "exact" ? exact(t, zone) : relative(t, now, zone);
}

// The page's "now" for relative times when the browser's clock and the server's disagree:
// the browser's clock moved onto the server's by the skew measured when the data arrived,
// and never earlier than the newest time a server read reported. Otherwise a row written
// after the page's last tick, or on a server whose clock runs ahead of the browser's, reads
// "in less than a minute" for something that has just happened. From the Portal's
// lib/format.ts (portalNow). Pass it as a React `now`, or give setClock a function that
// returns it.
export function serverNow(clientNow: number, skew: number, newestServerRead: number): number {
  return Math.max(clientNow + skew, newestServerRead);
}

let clock: () => number = () => Date.now();

// Replaces the clock the plain behavior module reads (the default is Date.now), and
// redraws. setClock(null) puts it back.
export function setClock(fn: (() => number) | null): void {
  clock = fn ?? (() => Date.now());
  for (const el of live) if (el.isConnected) draw(el);
}

// "now" for an element: a frozen data-cap-now on it or an ancestor (specimens, tests,
// printed reports), else the clock.
export function nowFor(el: Element): { now: number; frozen: boolean } {
  const fixed = el.closest<HTMLElement>("[data-cap-now]")?.dataset.capNow;
  return fixed ? { now: parse(fixed), frozen: true } : { now: clock(), frozen: false };
}

// Writes an exact time as its local part, then its UTC part in a span of its own.
function drawExact(el: HTMLElement, t: number): void {
  const p = exactParts(t);
  const whole = p.utc ? `${p.local} ${p.utc}` : p.local;
  const hasSpan = el.querySelector(".cap-time-utc") !== null;
  if (el.textContent === whole && hasSpan === (p.utc !== null)) return;
  el.textContent = p.utc ? `${p.local} ` : p.local;
  if (!p.utc) return;
  const span = document.createElement("span");
  span.className = "cap-time-utc";
  span.textContent = p.utc;
  el.append(span);
}

export function draw(el: HTMLElement): void {
  const iso = el.getAttribute("datetime");
  if (!iso) return;
  const { now } = nowFor(el);
  const t = parse(iso);
  if (el.dataset.format === "exact") return drawExact(el, t);
  const next = text(t, el.dataset.format === "date" ? "date" : "relative", now);
  if (el.textContent !== next) el.textContent = next;
}

const live = new Set<HTMLElement>();
let timer: number | undefined;

function tick(): void {
  for (const el of live) {
    if (el.isConnected) draw(el);
    else live.delete(el);
  }
  if (live.size === 0) {
    window.clearInterval(timer);
    timer = undefined;
  }
}

// Attaches to every [data-cap="time"] under root not yet attached: writes its text, and
// keeps relative times fresh every 30 seconds with one shared timer. Returns a function
// that detaches.
export function enhance(root: ParentNode = document): () => void {
  const mine: HTMLElement[] = [];
  for (const el of root.querySelectorAll<HTMLElement>("[data-cap='time']:not([data-cap-ready])")) {
    el.dataset.capReady = "";
    draw(el);
    if (el.dataset.format !== "exact" && el.dataset.format !== "date" && !nowFor(el).frozen) {
      live.add(el);
      mine.push(el);
    }
  }
  if (live.size > 0 && timer === undefined) timer = window.setInterval(tick, REFRESH_MS);
  return () => {
    for (const el of mine) {
      live.delete(el);
      delete el.dataset.capReady;
    }
    if (live.size === 0 && timer !== undefined) {
      window.clearInterval(timer);
      timer = undefined;
    }
  };
}

// A zone name the browser's Intl knows, else "UTC": a zone from a form or from Cloudflare's
// request.cf.timezone can be missing or unknown, and Intl throws on an unknown one. From Carrel
// (lib/writing/progress.ts).
export function knownZone(zone: string | null | undefined): string {
  if (!zone) return "UTC";
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: zone });
    return zone;
  } catch {
    return "UTC";
  }
}

// The hour of the morning a thing set aside with Later comes back.
export const LATER_HOUR = 8;

// When Later brings something back: `hour` (8 am) on the next calendar day in the person's
// zone (UTC when the zone is unknown), as an ISO instant. The wall-clock time is found by
// correcting a first guess by the zone's offset, twice, so a change to or from summer time
// overnight still lands on 8 am. From Carrel's Home (lib/desk.server.ts, laterUntil).
export function laterUntil(
  now: Date | number,
  zone: string | null | undefined,
  hour: number = LATER_HOUR,
): string {
  const z = knownZone(zone);
  // Tomorrow's date on the zone's wall clock, then that hour there (fromDateTimeLocal settles the
  // offset on the right side of a clock change).
  const [y, m, d] = toDateTimeLocal(new Date(now), z).slice(0, 10).split("-").map(Number);
  const next = new Date(Date.UTC(y!, m! - 1, d! + 1)).toISOString().slice(0, 10);
  return fromDateTimeLocal(`${next}T${two(hour)}:00`, z)!.toISOString();
}
