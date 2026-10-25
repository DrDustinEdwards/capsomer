// Times in words. Relative in rows ("5 minutes ago", never "5m"), exact in the viewer's
// zone with UTC beside it. The pure functions take the zone so they can be checked anywhere; in a page
// the zone is the viewer's.
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
export function parse(iso) {
    const s = iso.trim();
    return Date.parse(ZONELESS.test(s) ? `${s.replace(" ", "T")}Z` : s);
}
function plural(n, unit) {
    return `${n} ${unit}${n === 1 ? "" : "s"}`;
}
const dayKey = (zone) => new Intl.DateTimeFormat("en-CA", { timeZone: zone, year: "numeric", month: "2-digit", day: "2-digit" });
// Whole calendar days from `t` to `now` in the zone: 1 is yesterday, -1 tomorrow.
export function calendarDays(t, now, zone) {
    const f = dayKey(zone);
    const at = (x) => {
        const [y = 0, m = 1, d = 1] = f.format(x).split("-").map(Number);
        return Date.UTC(y, m - 1, d);
    };
    return Math.round((at(now) - at(t)) / DAY);
}
// "12 September", or "12 September 2025" when the year is not this one.
export function day(t, now = Date.now(), zone) {
    const year = (x) => new Intl.DateTimeFormat("en-GB", { timeZone: zone, year: "numeric" }).format(x);
    return new Intl.DateTimeFormat("en-GB", { timeZone: zone, day: "numeric", month: "long", year: year(t) === year(now) ? undefined : "numeric" }).format(t);
}
// Relative, spelled out: "just now", "less than a minute ago", "5 minutes ago",
// "3 hours ago", "yesterday", "4 days ago", "12 September"; and ahead, "in 3 hours",
// "tomorrow". Minutes and hours are whole and round down, so "1 hour ago" means at least
// an hour.
export function relative(t, now = Date.now(), zone) {
    const d = now - t;
    const a = Math.abs(d);
    const ahead = d < 0;
    const say = (s) => (ahead ? `in ${s}` : `${s} ago`);
    if (!Number.isFinite(d))
        return "";
    if (a < 10 * SEC)
        return "just now";
    if (a < MIN)
        return say("less than a minute");
    if (a < HOUR)
        return say(plural(Math.floor(a / MIN), "minute"));
    if (a < DAY)
        return say(plural(Math.floor(a / HOUR), "hour"));
    const days = calendarDays(t, now, zone);
    if (days === 0)
        return say(plural(Math.floor(a / HOUR), "hour"));
    if (days === 1)
        return "yesterday";
    if (days === -1)
        return "tomorrow";
    if (Math.abs(days) < 7)
        return say(plural(Math.abs(days), "day"));
    return day(t, now, zone);
}
// The Portal's compact UTC form, for logs and ids: "2026-09-30 13:02Z".
export function utc(t) {
    return `${new Date(t).toISOString().replace("T", " ").slice(0, 16)}Z`;
}
function parts(t, zone, withZone) {
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
    const out = {};
    for (const p of f.formatToParts(t))
        out[p.type] = p.value;
    return out;
}
function isUtc(zone) {
    const z = new Intl.DateTimeFormat("en-GB", { timeZone: zone }).resolvedOptions().timeZone;
    return z === "UTC" || z === "Etc/UTC" || z === "Etc/GMT" || z === "GMT";
}
// What a time that cannot be read says, in place of a blank or "NaN" (the Portal's
// exactTime does the same): a row never shows nothing where a time belongs.
export const UNREADABLE = "an unreadable time";
// Exact, in the viewer's zone with UTC beside it, in two parts so the UTC part can be kept
// whole on a line (the Portal's `.when .faint { white-space: nowrap }`): the local time, and
// "(13:02 UTC)". UTC's date is added when it differs from the local one; a viewer in UTC sees
// one time and no second part.
export function exactParts(t, zone) {
    if (!Number.isFinite(t))
        return { local: UNREADABLE, utc: null };
    const u = parts(t, "UTC", false);
    const uDate = `${u.day} ${u.month} ${u.year}`;
    const uTime = `${u.hour}:${u.minute} UTC`;
    if (isUtc(zone))
        return { local: `${uDate}, ${uTime}`, utc: null };
    const l = parts(t, zone, true);
    const lDate = `${l.day} ${l.month} ${l.year}`;
    return { local: `${lDate}, ${l.hour}:${l.minute} ${l.timeZoneName}`, utc: `(${lDate === uDate ? uTime : `${uDate}, ${uTime}`})` };
}
// "30 September 2026, 14:02 BST (13:02 UTC)".
export function exact(t, zone) {
    const p = exactParts(t, zone);
    return p.utc ? `${p.local} ${p.utc}` : p.local;
}
// The text a <time class="cap-time"> shows.
export function text(t, format, now = Date.now(), zone) {
    if (!Number.isFinite(t))
        return UNREADABLE;
    return format === "exact" ? exact(t, zone) : relative(t, now, zone);
}
// The page's "now" for relative times when the browser's clock and the server's disagree:
// the browser's clock moved onto the server's by the skew measured when the data arrived,
// and never earlier than the newest time a server read reported. Otherwise a row written
// after the page's last tick, or on a server whose clock runs ahead of the browser's, reads
// "in less than a minute" for something that has just happened. From the Portal's
// lib/format.ts (portalNow). Pass it as a React `now`, or give setClock a function that
// returns it.
export function serverNow(clientNow, skew, newestServerRead) {
    return Math.max(clientNow + skew, newestServerRead);
}
let clock = () => Date.now();
// Replaces the clock the plain behaviour module reads (the default is Date.now), and
// redraws. setClock(null) puts it back.
export function setClock(fn) {
    clock = fn ?? (() => Date.now());
    for (const el of live)
        if (el.isConnected)
            draw(el);
}
// "now" for an element: a frozen data-cap-now on it or an ancestor (specimens, tests,
// printed reports), else the clock.
function nowFor(el) {
    const fixed = el.closest("[data-cap-now]")?.dataset.capNow;
    return fixed ? { now: parse(fixed), frozen: true } : { now: clock(), frozen: false };
}
// Writes an exact time as its local part, then its UTC part in a span of its own.
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
    const next = text(t, "relative", now);
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
// Attaches to every [data-cap="time"] under root not yet attached: writes its text, and
// keeps relative times fresh every 30 seconds with one shared timer. Returns a function
// that detaches.
export function enhance(root = document) {
    const mine = [];
    for (const el of root.querySelectorAll("[data-cap='time']:not([data-cap-ready])")) {
        el.dataset.capReady = "";
        draw(el);
        if (el.dataset.format !== "exact" && !nowFor(el).frozen) {
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
