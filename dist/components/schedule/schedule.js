// The schedule's pure logic: sessions into days, a day's overlapping sessions into parallel
// tracks, the days a nav offers, and the words for a day and a time slot. No DOM: a server
// renders a program with it, a printed program uses it, and the React wrapper draws from it.
// The subject (what a session is, where it is stored) stays in the app; it hands over each
// item's times through an accessor.
import { DAY, dayKey, formatDate, toMsOrNull, zoneName } from "../time/time.js";
// The day key of items that have no date yet. Sorts after every real day.
export const NO_DATE = "no-date";
const isKey = (k) => /^\d{4}-\d{2}-\d{2}$/.test(k);
// Real days first, in order, then NO_DATE.
function byDay(a, b) {
    if (a === b)
        return 0;
    if (a === NO_DATE)
        return 1;
    if (b === NO_DATE)
        return -1;
    return a < b ? -1 : 1;
}
// Group items by day, then each day into slots. Items whose [start, end) overlap run in
// parallel and share a slot; an item with no time stands alone, after the timed ones. Within a
// day items go by start, then the app's order; parallel tracks go by track name, then order.
export function groupByDay(items, timesOf, zone = "UTC") {
    const days = new Map();
    for (const item of items) {
        const t = timesOf(item);
        const start = toMsOrNull(t.start);
        const end = toMsOrNull(t.end);
        const day = t.day && isKey(t.day) ? t.day : null;
        const key = day ?? (start !== null ? dayKey(start, zone) : NO_DATE);
        const row = { item, start, end, track: t.track ?? "", order: t.order ?? 0 };
        const list = days.get(key);
        if (list)
            list.push(row);
        else
            days.set(key, [row]);
    }
    return [...days.keys()].sort(byDay).map((key) => {
        const rows = (days.get(key) ?? []).sort((a, b) => (a.start ?? Number.POSITIVE_INFINITY) - (b.start ?? Number.POSITIVE_INFINITY) ||
            a.order - b.order);
        const groups = [];
        let current = null;
        let groupEnd = Number.NEGATIVE_INFINITY;
        for (const r of rows) {
            const end = r.end ?? r.start;
            if (current && r.start !== null && r.start < groupEnd) {
                current.push(r);
                if (end !== null && end > groupEnd)
                    groupEnd = end;
            }
            else {
                current = [r];
                groups.push(current);
                groupEnd = end ?? Number.NEGATIVE_INFINITY;
            }
        }
        const slots = groups.map((g) => {
            const parallel = g.length > 1;
            if (parallel)
                g.sort((a, b) => a.track.localeCompare(b.track) || a.order - b.order);
            const starts = g.map((r) => r.start).filter((x) => x !== null);
            const ends = g.map((r) => r.end ?? r.start).filter((x) => x !== null);
            return {
                start: starts.length ? Math.min(...starts) : null,
                end: ends.length ? Math.max(...ends) : null,
                parallel,
                items: g.map((r) => r.item),
            };
        });
        return { key, slots };
    });
}
// Every day from one moment to another, both included, in the zone: a meeting's date range,
// so a day with nothing on it yet still gets a tab.
export function dayRange(from, to, zone = "UTC") {
    const a = toMsOrNull(from);
    if (a === null)
        return [];
    const b = toMsOrNull(to) ?? a;
    const start = Date.parse(`${dayKey(a, zone)}T00:00:00Z`);
    const end = Date.parse(`${dayKey(b, zone)}T00:00:00Z`);
    const out = [];
    for (let t = start; t <= end; t += DAY)
        out.push(new Date(t).toISOString().slice(0, 10));
    return out;
}
// The days a day nav offers: the days that hold items, the days of the range, and one more
// (a day a person just added), in order, with NO_DATE last when any item has no date.
export function dayKeys(days, range = [], extra) {
    const keys = new Set(range.filter(isKey));
    for (const d of days)
        keys.add(d.key);
    if (extra && isKey(extra))
        keys.add(extra);
    return [...keys].sort(byDay);
}
// The day to show: the one asked for when the nav offers it, else the first, else none.
export function pickDay(keys, wanted) {
    return wanted && keys.includes(wanted) ? wanted : (keys[0] ?? null);
}
// "Saturday, March 6", with the year when asked: "Saturday, March 6, 2027". A day key is a
// calendar date, so it is read in UTC and never moves by the viewer's zone.
export function dayLabel(key, { year = false, noDate = "No date set" } = {}) {
    if (key === NO_DATE)
        return noDate;
    const t = Date.parse(`${key}T00:00:00Z`);
    if (!Number.isFinite(t))
        return key;
    return formatDate(t, { style: "weekday", year });
}
// A slot's time in words: "9:00 AM to 10:30 AM", "From 9:00 AM", "Until 10:30 AM", or
// `none` when it has no time.
export function slotLabel(start, end, zone = "UTC", none = "No time set") {
    // "9:00 AM", on the American 12-hour clock, in the schedule's zone.
    const clock = (t) => formatDate(t, { style: "time", zone });
    if (start !== null && end !== null && end > start)
        return `${clock(start)} to ${clock(end)}`;
    if (start !== null)
        return `From ${clock(start)}`;
    if (end !== null)
        return `Until ${clock(end)}`;
    return none;
}
// The line that says once which zone the times are in: "Times are in CDT." The zone's name at
// the first item's moment, so a meeting across a clock change still names the right one.
export function zoneLine(at, zone = "UTC") {
    return `Times are in ${zoneName(at ?? Date.now(), zone)}.`;
}
// "3 parallel tracks".
export function tracksLabel(n) {
    return `${n} parallel ${n === 1 ? "track" : "tracks"}`;
}
