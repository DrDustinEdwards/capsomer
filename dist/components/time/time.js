// Times in words: relative in rows, exact in the viewer's zone with UTC beside it. The pure functions
// take the zone so they can be checked anywhere.
import { fromDateTimeLocal, toDateTimeLocal } from "../field/field.js";
import { dayKey } from "@dustinedwards/site-runtime/time";
import { DAY, HOUR, MIN, SEC, two } from "./time-duration.js";
export { SEC, MIN, HOUR, DAY, two, timecode, duration, span, until } from "./time-duration.js";
export const REFRESH_MS = 30 * SEC;
// A server timestamp with no zone (D1's datetime('now'), "YYYY-MM-DD HH:MM:SS", or the
// same with a T) is UTC, because every timestamp the Worker writes is; Date.parse would
// read it as local time. An ISO string with a zone passes through.
const ZONELESS = /^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}(:\d{2}(\.\d+)?)?$/;
export function parse(iso) {
    const s = iso.trim();
    return Date.parse(ZONELESS.test(s) ? `${s.replace(" ", "T")}Z` : s);
}
// The words come from Intl.RelativeTimeFormat, not from strings kept here.
const RTF = new Intl.RelativeTimeFormat("en-US", { numeric: "auto" });
// A time as a number of milliseconds: a number, a Date, or a server timestamp (a zoneless one is
// UTC). NaN for nothing, an empty string or a value that is not a time.
export function toMs(at) {
    if (at === null || at === undefined || at === "")
        return Number.NaN;
    return typeof at === "number" ? at : at instanceof Date ? at.getTime() : parse(at);
}
// The same, null where toMs gives NaN, for a caller that tests for "no time" with `== null`.
export function toMsOrNull(at) {
    const t = toMs(at);
    return Number.isFinite(t) ? t : null;
}
// Whole calendar days from `t` to `now` in the zone: 1 is yesterday, -1 tomorrow.
export function calendarDays(t, now, zone) {
    const at = (x) => {
        const [y = 0, m = 1, d = 1] = dayKey(x, zone).split("-").map(Number);
        return Date.UTC(y, m - 1, d);
    };
    return Math.round((at(now) - at(t)) / DAY);
}
// "September 12", or with the year when it is not this one.
export function day(t, now = Date.now(), zone) {
    const year = (x) => new Intl.DateTimeFormat("en-US", { timeZone: zone, year: "numeric" }).format(x);
    return new Intl.DateTimeFormat("en-US", {
        timeZone: zone,
        day: "numeric",
        month: "long",
        year: year(t) === year(now) ? undefined : "numeric",
    }).format(t);
}
// Relative, spelled out ("5 minutes ago", "yesterday", "in 3 hours"). Minutes and hours round down,
// so "1 hour ago" means at least an hour.
export function relative(t, now = Date.now(), zone, options = {}) {
    const d = now - t;
    const a = Math.abs(d);
    const ahead = d < 0;
    if (!Number.isFinite(d))
        return "";
    const days = calendarDays(t, now, zone);
    if (options.granularity === "day") {
        if (Math.abs(days) < 30)
            return RTF.format(-days, "day");
        return RTF.format(-Math.trunc(days / 30), "month");
    }
    const say = (n, unit) => RTF.format(ahead ? n : -n, unit);
    if (a < 10 * SEC)
        return "just now";
    if (a < MIN)
        return ahead ? "in less than a minute" : "less than a minute ago";
    if (a < HOUR)
        return say(Math.floor(a / MIN), "minute");
    if (a < DAY)
        return say(Math.floor(a / HOUR), "hour");
    if (days === 0)
        return say(Math.floor(a / HOUR), "hour");
    if (Math.abs(days) < 7)
        return RTF.format(-days, "day");
    return day(t, now, zone);
}
export function utc(t) {
    return `${new Date(t).toISOString().replace("T", " ").slice(0, 16)}Z`;
}
const DATE_FORMATS = new Map();
function cachedFormat(key, make) {
    let f = DATE_FORMATS.get(key);
    if (!f)
        DATE_FORMATS.set(key, (f = make()));
    return f;
}
// A date, American English, from a number, a Date or a timestamp string. Null for a value that is
// not a time, so the caller says what goes in its place.
export function formatDate(at, options = {}) {
    const t = toMs(at);
    if (!Number.isFinite(t))
        return null;
    const { style = "long", time = false, zoneName: named = false, zone: z = "UTC", year } = options;
    const zone = z === "viewer" ? undefined : z;
    const dayOnly = style === "monthDay" || style === "monthYear" || style === "weekday";
    const timed = style === "time" || (time && !dayOnly);
    const key = `${style}|${timed}|${zone ?? ""}|${year}`;
    const f = cachedFormat(key, () => year !== undefined &&
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
                        }));
    // Some engines put a narrow no-break space before AM and PM; a plain space reads and copies the same everywhere.
    const text = f.format(t).replaceAll("\u202f", " ");
    return timed && named ? `${text} ${zoneName(t, zone)}` : text;
}
// A meeting's dates: "May 1, 2026", "May 1, 2026 to May 2, 2026", or null with no dates. One date
// when both are the same moment.
export function dateRange(start, end, options = {}) {
    const a = toMs(start);
    const b = toMs(end);
    const from = formatDate(a, options);
    const to = formatDate(b, options);
    if (from && to)
        return a === b || from === to ? from : `${from} to ${to}`;
    return from ?? to;
}
function parts(t, zone) {
    const f = new Intl.DateTimeFormat("en-US", {
        timeZone: zone,
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
    });
    const out = {};
    for (const p of f.formatToParts(t))
        out[p.type] = p.value;
    return out;
}
const zoneWord = (locale, t, zone) => new Intl.DateTimeFormat(locale, { timeZone: zone, timeZoneName: "short" })
    .formatToParts(t)
    .find((p) => p.type === "timeZoneName")?.value ?? "";
// The zone's short name as an American reader knows it: "CST", "CDT", "EST", "PDT".
// en-US has names only for the American zones and writes "GMT+1" for the rest, so a zone it
// has no name for takes the British one when there is one ("BST", "CEST"), else the offset.
export function zoneName(t, zone) {
    const us = zoneWord("en-US", t, zone);
    if (!/^(GMT|UTC)[+-]/.test(us))
        return us;
    const gb = zoneWord("en-GB", t, zone);
    return /^(GMT|UTC)[+-]/.test(gb) || gb === "" ? us : gb;
}
function isUtc(zone) {
    const z = new Intl.DateTimeFormat("en-US", { timeZone: zone }).resolvedOptions().timeZone;
    return z === "UTC" || z === "Etc/UTC" || z === "Etc/GMT" || z === "GMT";
}
// What a time that cannot be read says, so a row never shows nothing where a time belongs.
export const UNREADABLE = "an unreadable time";
// Exact, in two parts so the UTC part can be kept whole on a line: the local time, then "(1:02 PM UTC)".
// UTC's date is added when it differs; a viewer in UTC sees one time.
export function exactParts(t, zone) {
    if (!Number.isFinite(t))
        return { local: UNREADABLE, utc: null };
    const u = parts(t, "UTC");
    const uDate = `${u.month} ${u.day}, ${u.year}`;
    const uTime = `${u.hour}:${u.minute} ${u.dayPeriod} UTC`;
    if (isUtc(zone))
        return { local: `${uDate}, ${uTime}`, utc: null };
    const l = parts(t, zone);
    const lDate = `${l.month} ${l.day}, ${l.year}`;
    return {
        local: `${lDate}, ${l.hour}:${l.minute} ${l.dayPeriod} ${zoneName(t, zone)}`,
        utc: `(${lDate === uDate ? uTime : `${uDate}, ${uTime}`})`,
    };
}
export function exact(t, zone) {
    const p = exactParts(t, zone);
    return p.utc ? `${p.local} ${p.utc}` : p.local;
}
export function text(t, format, now = Date.now(), zone) {
    if (!Number.isFinite(t))
        return UNREADABLE;
    if (format === "date")
        return formatDate(t, { zone: zone ?? "UTC" }) ?? UNREADABLE;
    return format === "exact" ? exact(t, zone) : relative(t, now, zone);
}
// The page's "now" for relative times when the browser's clock and the server's disagree: the browser's
// clock moved by the skew measured when the data arrived, never earlier than the newest server time
// read. Pass it as a React `now`, or give setClock a function that returns it.
export function serverNow(clientNow, skew, newestServerRead) {
    return Math.max(clientNow + skew, newestServerRead);
}
let clock = () => Date.now();
// Replaces the clock the plain behavior module reads (default Date.now), and redraws. null restores it.
export function setClock(fn) {
    clock = fn ?? (() => Date.now());
    for (const el of live)
        if (el.isConnected)
            draw(el);
}
// "now" for an element: a frozen data-cap-now on it or an ancestor (specimens, tests,
// printed reports), else the clock.
export function nowFor(el) {
    const fixed = el.closest("[data-cap-now]")?.dataset.capNow;
    return fixed ? { now: parse(fixed), frozen: true } : { now: clock(), frozen: false };
}
function drawExact(el, t) {
    const p = exactParts(t);
    const whole = p.utc ? `${p.local} ${p.utc}` : p.local;
    const hasSpan = el.querySelector(".cap-time-utc") !== null;
    if (el.textContent === whole && hasSpan === (p.utc !== null))
        return;
    el.textContent = p.utc ? `${p.local} ` : p.local;
    if (!p.utc)
        return;
    const span = document.createElement("span");
    span.className = "cap-time-utc";
    span.textContent = p.utc;
    el.append(span);
}
export function draw(el) {
    const iso = el.getAttribute("datetime");
    if (!iso)
        return;
    const { now } = nowFor(el);
    const t = parse(iso);
    if (el.dataset.format === "exact")
        return drawExact(el, t);
    const next = text(t, el.dataset.format === "date" ? "date" : "relative", now);
    if (el.textContent !== next)
        el.textContent = next;
}
const live = new Set();
let timer;
function tick() {
    for (const el of live) {
        if (el.isConnected)
            draw(el);
        else
            live.delete(el);
    }
    if (live.size === 0) {
        window.clearInterval(timer);
        timer = undefined;
    }
}
// Attaches to every [data-cap="time"] under root not yet attached and keeps relative times fresh with
// one shared timer. Returns a function that detaches.
export function enhance(root = document) {
    const mine = [];
    for (const el of root.querySelectorAll("[data-cap='time']:not([data-cap-ready])")) {
        el.dataset.capReady = "";
        draw(el);
        if (el.dataset.format !== "exact" && el.dataset.format !== "date" && !nowFor(el).frozen) {
            live.add(el);
            mine.push(el);
        }
    }
    if (live.size > 0 && timer === undefined)
        timer = window.setInterval(tick, REFRESH_MS);
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
export function knownZone(zone) {
    if (!zone)
        return "UTC";
    try {
        new Intl.DateTimeFormat("en-US", { timeZone: zone });
        return zone;
    }
    catch {
        return "UTC";
    }
}
export const LATER_HOUR = 8;
// When Later brings something back: `hour` on the next calendar day in the zone (UTC when unknown), as
// an ISO instant. The wall-clock time is corrected by the zone's offset twice, so a change to or from
// summer time overnight still lands on the hour.
export function laterUntil(now, zone, hour = LATER_HOUR) {
    const z = knownZone(zone);
    // Tomorrow's date on the zone's wall clock, then that hour there (fromDateTimeLocal settles the
    // offset on the right side of a clock change).
    const [y, m, d] = toDateTimeLocal(new Date(now), z).slice(0, 10).split("-").map(Number);
    const next = new Date(Date.UTC(y, m - 1, d + 1)).toISOString().slice(0, 10);
    return fromDateTimeLocal(`${next}T${two(hour)}:00`, z).toISOString();
}
