// Times in words: relative in rows, exact in the viewer's zone with UTC beside it. The pure functions
// take the zone so they can be checked anywhere.

import { fromDateTimeLocal, toDateTimeLocal } from "../field/field.ts";
import { dayKey } from "@dustinedwards/site-runtime/time";
import { plural } from "@drdustinedwards/site-helpers/text";

export const SEC = 1000;
export const MIN = 60 * SEC;
export const HOUR = 60 * MIN;
export const DAY = 24 * HOUR;

export const REFRESH_MS = 30 * SEC;

// A server timestamp with no zone (D1's datetime('now'), "YYYY-MM-DD HH:MM:SS", or the
// same with a T) is UTC, because every timestamp the Worker writes is; Date.parse would
// read it as local time. An ISO string with a zone passes through.
const ZONELESS = /^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}(:\d{2}(\.\d+)?)?$/;

export function parse(iso: string): number {
  const s = iso.trim();
  return Date.parse(ZONELESS.test(s) ? `${s.replace(" ", "T")}Z` : s);
}

// The words come from Intl.RelativeTimeFormat, not from strings kept here.
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

// "September 12", or with the year when it is not this one.
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
  // "auto": minutes and hours, then calendar days. "day": calendar days only, then months.
  granularity?: "auto" | "day";
}

// Relative, spelled out ("5 minutes ago", "yesterday", "in 3 hours"). Minutes and hours round down,
// so "1 hour ago" means at least an hour.
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

export function utc(t: number): string {
  return `${new Date(t).toISOString().replace("T", " ").slice(0, 16)}Z`;
}

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

// A date, American English, from a number, a Date or a timestamp string. Null for a value that is
// not a time, so the caller says what goes in its place.
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

// Durations: how long, not when. Milliseconds in, like every function here (`seconds * SEC`).

const whole = (n: number | null | undefined) =>
  Number.isFinite(n) ? Math.max(0, Math.floor(n as number)) : 0;

export const two = (n: number): string => String(n).padStart(2, "0");

// A duration as a player's timecode writes it: "4:05", "1:02:03". With hours: "always", the form
// a feed wants for <itunes:duration>: "00:04:05", "01:02:03". Negative, missing or NaN is zero.
export function timecode(
  ms: number | null | undefined,
  options: { hours?: "auto" | "always" } = {},
): string {
  const total = Math.floor(whole(ms) / SEC);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const sec = two(total % 60);
  if (options.hours === "always") return `${two(h)}:${two(m)}:${sec}`;
  return h ? `${h}:${two(m)}:${sec}` : `${m}:${sec}`;
}

export type DurationStyle = "long" | "short" | "narrow";

export interface DurationOptions {
  // "long": "3 minutes, 12 seconds" (the default: it reads well aloud). "short": "3 min, 12 sec".
  // "narrow": "3m 12s".
  style?: DurationStyle;
  // The largest unit used: "hours" (the default: 90 minutes is "1 hour, 30 minutes") or "days".
  largest?: "hours" | "days";
}

interface DurationFormatLike {
  format(duration: Record<string, number>): string;
}
type DurationFormatCtor = new (
  locale: string,
  options: Record<string, unknown>,
) => DurationFormatLike;

const UNIT_WORDS = {
  days: ["day", "day", "d"],
  hours: ["hour", "hr", "h"],
  minutes: ["minute", "min", "m"],
  seconds: ["second", "sec", "s"],
} as const;
type Unit = keyof typeof UNIT_WORDS;

// Intl.DurationFormat where it exists (Chrome 129, Firefox 136, Safari 18.4); elsewhere the same English
// is written here, so a server and a browser that differ in support print the same text.
function durationWords(parts: Partial<Record<Unit, number>>, style: DurationStyle): string {
  const units = (Object.keys(UNIT_WORDS) as Unit[]).filter((u) => (parts[u] ?? 0) > 0);
  // Nothing at all reads as "0 seconds". DurationFormat leaves out zero units unless told to show one.
  const zero = units.length === 0;
  if (zero) units.push("seconds");
  const ctor = (Intl as unknown as { DurationFormat?: DurationFormatCtor }).DurationFormat;
  if (ctor) {
    try {
      const out: Record<string, number> = {};
      for (const u of units) out[u] = parts[u] ?? 0;
      return new ctor("en-US", zero ? { style, secondsDisplay: "always" } : { style }).format(out);
    } catch {
      /* an engine with a partial implementation: use the fallback */
    }
  }
  const words = units.map((u) => {
    const n = parts[u] ?? 0;
    const [long, short, narrow] = UNIT_WORDS[u];
    if (style === "narrow") return `${n}${narrow}`;
    if (style === "short") return `${n} ${short}${u === "days" && n !== 1 ? "s" : ""}`;
    return plural(n, long);
  });
  return words.join(style === "narrow" ? " " : ", ");
}

function split(ms: number, largest: "hours" | "days"): Partial<Record<Unit, number>> {
  let total = Math.floor(whole(ms) / SEC);
  const out: Partial<Record<Unit, number>> = {};
  if (largest === "days") {
    out.days = Math.floor(total / 86400);
    total %= 86400;
  }
  out.hours = Math.floor(total / 3600);
  out.minutes = Math.floor((total % 3600) / 60);
  out.seconds = total % 60;
  return out;
}

// A duration in words, for a screen reader or a sentence. Zero units are left out.
export function duration(ms: number | null | undefined, options: DurationOptions = {}): string {
  return durationWords(split(whole(ms), options.largest ?? "hours"), options.style ?? "long");
}

// A rough duration to the largest unit, rounded down, for "waiting 3 hours" and "oldest 2 days".
export function span(ms: number | null | undefined): string {
  const a = whole(ms);
  if (a < MIN) return "less than a minute";
  if (a < HOUR) return duration(Math.floor(a / MIN) * MIN);
  if (a < DAY) return duration(Math.floor(a / HOUR) * HOUR);
  return duration(Math.floor(a / DAY) * DAY, { largest: "days" });
}

// How soon something scheduled fires: "due now" once passed, then "in 5 minutes", "in 3 hours, 20
// minutes" (hours carry the minutes, since "in 3 hours" hides up to 59), "in 2 days".
export function until(t: number, now: number = Date.now()): string {
  const d = t - now;
  if (!Number.isFinite(d)) return "";
  if (d <= 0) return "due now";
  if (d < HOUR) return `in ${duration(Math.max(1, Math.round(d / MIN)) * MIN)}`;
  if (d < DAY) {
    let hours = Math.floor(d / HOUR);
    let minutes = Math.round((d - hours * HOUR) / MIN);
    // Rounding the minutes can reach 60: carry it rather than say "3 hours, 60 minutes".
    if (minutes === 60) {
      hours += 1;
      minutes = 0;
    }
    return `in ${duration(hours * HOUR + minutes * MIN)}`;
  }
  return `in ${duration(Math.floor(d / DAY) * DAY, { largest: "days" })}`;
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

// What a time that cannot be read says, so a row never shows nothing where a time belongs.
export const UNREADABLE = "an unreadable time";

// Exact, in two parts so the UTC part can be kept whole on a line: the local time, then "(1:02 PM UTC)".
// UTC's date is added when it differs; a viewer in UTC sees one time.
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

export function exact(t: number, zone?: string): string {
  const p = exactParts(t, zone);
  return p.utc ? `${p.local} ${p.utc}` : p.local;
}

// "relative": 5 minutes ago. "exact": the viewer's zone, then UTC. "date": a long date with no time
// of day, in UTC ("September 12, 2026"), for a publication date or a deadline.
export type TimeFormat = "relative" | "exact" | "date";

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

// The page's "now" for relative times when the browser's clock and the server's disagree: the browser's
// clock moved by the skew measured when the data arrived, never earlier than the newest server time
// read. Pass it as a React `now`, or give setClock a function that returns it.
export function serverNow(clientNow: number, skew: number, newestServerRead: number): number {
  return Math.max(clientNow + skew, newestServerRead);
}

let clock: () => number = () => Date.now();

// Replaces the clock the plain behavior module reads (default Date.now), and redraws. null restores it.
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

// Attaches to every [data-cap="time"] under root not yet attached and keeps relative times fresh with
// one shared timer. Returns a function that detaches.
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

// A zone name the browser's Intl knows, else "UTC": a zone from a form or request.cf.timezone can be
// missing or unknown, and Intl throws on an unknown one.
export function knownZone(zone: string | null | undefined): string {
  if (!zone) return "UTC";
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: zone });
    return zone;
  } catch {
    return "UTC";
  }
}

export const LATER_HOUR = 8;

// When Later brings something back: `hour` on the next calendar day in the zone (UTC when unknown), as
// an ISO instant. The wall-clock time is corrected by the zone's offset twice, so a change to or from
// summer time overnight still lands on the hour.
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
