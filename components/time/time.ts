// Times in words. Relative in rows ("5 minutes ago", never "5m"), exact in the viewer's
// zone with UTC beside it. Ported from the Capsid Portal's dashboard/src/lib/format.ts
// (`ms`, `ago`, `utc`), spelled out. The pure functions take the zone so they can be
// checked anywhere; in a page the zone is the viewer's.

export const SEC = 1000;
export const MIN = 60 * SEC;
export const HOUR = 60 * MIN;
export const DAY = 24 * HOUR;

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

function plural(n: number, unit: string): string {
  return `${n} ${unit}${n === 1 ? "" : "s"}`;
}

const dayKey = (zone?: string) => new Intl.DateTimeFormat("en-CA", { timeZone: zone, year: "numeric", month: "2-digit", day: "2-digit" });

// Whole calendar days from `t` to `now` in the zone: 1 is yesterday, -1 tomorrow.
export function calendarDays(t: number, now: number, zone?: string): number {
  const f = dayKey(zone);
  const at = (x: number) => {
    const [y = 0, m = 1, d = 1] = f.format(x).split("-").map(Number);
    return Date.UTC(y, m - 1, d);
  };
  return Math.round((at(now) - at(t)) / DAY);
}

// "12 September", or "12 September 2025" when the year is not this one.
export function day(t: number, now: number = Date.now(), zone?: string): string {
  const year = (x: number) => new Intl.DateTimeFormat("en-GB", { timeZone: zone, year: "numeric" }).format(x);
  return new Intl.DateTimeFormat("en-GB", { timeZone: zone, day: "numeric", month: "long", year: year(t) === year(now) ? undefined : "numeric" }).format(t);
}

// Relative, spelled out: "just now", "less than a minute ago", "5 minutes ago",
// "3 hours ago", "yesterday", "4 days ago", "12 September"; and ahead, "in 3 hours",
// "tomorrow". Minutes and hours are whole and round down, so "1 hour ago" means at least
// an hour.
export function relative(t: number, now: number = Date.now(), zone?: string): string {
  const d = now - t;
  const a = Math.abs(d);
  const ahead = d < 0;
  const say = (s: string) => (ahead ? `in ${s}` : `${s} ago`);
  if (!Number.isFinite(d)) return "";
  if (a < 10 * SEC) return "just now";
  if (a < MIN) return say("less than a minute");
  if (a < HOUR) return say(plural(Math.floor(a / MIN), "minute"));
  if (a < DAY) return say(plural(Math.floor(a / HOUR), "hour"));
  const days = calendarDays(t, now, zone);
  if (days === 0) return say(plural(Math.floor(a / HOUR), "hour"));
  if (days === 1) return "yesterday";
  if (days === -1) return "tomorrow";
  if (Math.abs(days) < 7) return say(plural(Math.abs(days), "day"));
  return day(t, now, zone);
}

// The Portal's compact UTC form, for logs and ids: "2026-09-30 13:02Z".
export function utc(t: number): string {
  return `${new Date(t).toISOString().replace("T", " ").slice(0, 16)}Z`;
}

function parts(t: number, zone: string | undefined, withZone: boolean): Record<string, string> {
  const f = new Intl.DateTimeFormat("en-GB", {
    timeZone: zone,
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZoneName: withZone ? "short" : undefined,
  });
  const out: Record<string, string> = {};
  for (const p of f.formatToParts(t)) out[p.type] = p.value;
  return out;
}

function isUtc(zone?: string): boolean {
  const z = new Intl.DateTimeFormat("en-GB", { timeZone: zone }).resolvedOptions().timeZone;
  return z === "UTC" || z === "Etc/UTC" || z === "Etc/GMT" || z === "GMT";
}

// Exact, in the viewer's zone with UTC beside it: "30 September 2026, 14:02 BST (13:02 UTC)".
// UTC's date is added when it differs from the local one; a viewer in UTC sees one time.
export function exact(t: number, zone?: string): string {
  if (!Number.isFinite(t)) return "";
  const u = parts(t, "UTC", false);
  const uDate = `${u.day} ${u.month} ${u.year}`;
  const uTime = `${u.hour}:${u.minute} UTC`;
  if (isUtc(zone)) return `${uDate}, ${uTime}`;
  const l = parts(t, zone, true);
  const lDate = `${l.day} ${l.month} ${l.year}`;
  return `${lDate}, ${l.hour}:${l.minute} ${l.timeZoneName} (${lDate === uDate ? uTime : `${uDate}, ${uTime}`})`;
}

export type TimeFormat = "relative" | "exact";

// The text a <time class="cap-time"> shows.
export function text(t: number, format: TimeFormat, now: number = Date.now(), zone?: string): string {
  return format === "exact" ? exact(t, zone) : relative(t, now, zone);
}

// "now" for an element: a frozen data-cap-now on it or an ancestor (specimens, tests,
// printed reports), else the clock.
function nowFor(el: Element): { now: number; frozen: boolean } {
  const fixed = el.closest<HTMLElement>("[data-cap-now]")?.dataset.capNow;
  return fixed ? { now: parse(fixed), frozen: true } : { now: Date.now(), frozen: false };
}

export function draw(el: HTMLElement): void {
  const iso = el.getAttribute("datetime");
  if (!iso) return;
  const { now } = nowFor(el);
  const format: TimeFormat = el.dataset.format === "exact" ? "exact" : "relative";
  const next = text(parse(iso), format, now);
  if (next && el.textContent !== next) el.textContent = next;
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
    if (el.dataset.format !== "exact" && !nowFor(el).frozen) {
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
