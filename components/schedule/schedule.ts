// The schedule's pure logic: sessions into days, a day's overlapping sessions into parallel
// tracks, the days a nav offers, and the words for a day and a time slot. No DOM: a server
// renders a program with it, a printed program uses it, and the React wrapper draws from it.
// The subject (what a session is, where it is stored) stays in the app; it hands over each
// item's times through an accessor.

import { dayKey } from "@dustinedwards/site-runtime/time";
import { plural } from "@drdustinedwards/site-helpers/text";
import { DAY, formatDate, toMsOrNull, zoneName } from "../time/time.ts";

// The day key of items that have no date yet. Sorts after every real day.
export const NO_DATE = "no-date";

// One item's place in time, as the app reads it from its own record.
export interface ScheduleTimes {
  // Start and end, in milliseconds, a Date, or an ISO string. Either may be missing.
  start?: number | Date | string | null;
  end?: number | Date | string | null;
  // The day, "yyyy-mm-dd", for an item with a date but no time yet. Wins over the start's day.
  day?: string | null;
  // The room or track name; parallel tracks are ordered by it.
  track?: string | null;
  // The app's own order, for ties.
  order?: number | null;
}

// One time slot: one item on its own, or several that overlap, run as parallel tracks.
export interface ScheduleSlot<T> {
  // The earliest start and the latest end of the slot's items (null when they have none).
  start: number | null;
  end: number | null;
  parallel: boolean;
  items: T[];
}

export interface ScheduleDay<T> {
  // "yyyy-mm-dd" in the schedule's zone, or NO_DATE.
  key: string;
  slots: ScheduleSlot<T>[];
}

const isKey = (k: string) => /^\d{4}-\d{2}-\d{2}$/.test(k);

// Real days first, in order, then NO_DATE.
function byDay(a: string, b: string): number {
  if (a === b) return 0;
  if (a === NO_DATE) return 1;
  if (b === NO_DATE) return -1;
  return a < b ? -1 : 1;
}

// Group items by day, then each day into slots. Items whose [start, end) overlap run in
// parallel and share a slot; an item with no time stands alone, after the timed ones. Within a
// day items go by start, then the app's order; parallel tracks go by track name, then order.
export function groupByDay<T>(
  items: readonly T[],
  timesOf: (item: T) => ScheduleTimes,
  zone = "UTC",
): ScheduleDay<T>[] {
  interface Row {
    item: T;
    start: number | null;
    end: number | null;
    track: string;
    order: number;
  }
  const days = new Map<string, Row[]>();
  for (const item of items) {
    const t = timesOf(item);
    const start = toMsOrNull(t.start);
    const end = toMsOrNull(t.end);
    const day = t.day && isKey(t.day) ? t.day : null;
    const key = day ?? (start !== null ? dayKey(start, zone) : NO_DATE);
    const row = { item, start, end, track: t.track ?? "", order: t.order ?? 0 };
    const list = days.get(key);
    if (list) list.push(row);
    else days.set(key, [row]);
  }

  return [...days.keys()].sort(byDay).map((key) => {
    const rows = (days.get(key) ?? []).sort(
      (a, b) =>
        (a.start ?? Number.POSITIVE_INFINITY) - (b.start ?? Number.POSITIVE_INFINITY) ||
        a.order - b.order,
    );
    const groups: Row[][] = [];
    let current: Row[] | null = null;
    let groupEnd = Number.NEGATIVE_INFINITY;
    for (const r of rows) {
      const end = r.end ?? r.start;
      if (current && r.start !== null && r.start < groupEnd) {
        current.push(r);
        if (end !== null && end > groupEnd) groupEnd = end;
      } else {
        current = [r];
        groups.push(current);
        groupEnd = end ?? Number.NEGATIVE_INFINITY;
      }
    }
    const slots = groups.map((g): ScheduleSlot<T> => {
      const parallel = g.length > 1;
      if (parallel) g.sort((a, b) => a.track.localeCompare(b.track) || a.order - b.order);
      const starts = g.map((r) => r.start).filter((x): x is number => x !== null);
      const ends = g.map((r) => r.end ?? r.start).filter((x): x is number => x !== null);
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
export function dayRange(
  from: number | Date | string | null | undefined,
  to: number | Date | string | null | undefined,
  zone = "UTC",
): string[] {
  const a = toMsOrNull(from);
  if (a === null) return [];
  const b = toMsOrNull(to) ?? a;
  const start = Date.parse(`${dayKey(a, zone)}T00:00:00Z`);
  const end = Date.parse(`${dayKey(b, zone)}T00:00:00Z`);
  const out: string[] = [];
  for (let t = start; t <= end; t += DAY) out.push(new Date(t).toISOString().slice(0, 10));
  return out;
}

// The days a day nav offers: the days that hold items, the days of the range, and one more
// (a day a person just added), in order, with NO_DATE last when any item has no date.
export function dayKeys(
  days: readonly { key: string }[],
  range: readonly string[] = [],
  extra?: string | null,
): string[] {
  const keys = new Set<string>(range.filter(isKey));
  for (const d of days) keys.add(d.key);
  if (extra && isKey(extra)) keys.add(extra);
  return [...keys].sort(byDay);
}

// The day to show: the one asked for when the nav offers it, else the first, else none.
export function pickDay(keys: readonly string[], wanted?: string | null): string | null {
  return wanted && keys.includes(wanted) ? wanted : (keys[0] ?? null);
}

// "Saturday, March 6", with the year when asked: "Saturday, March 6, 2027". A day key is a
// calendar date, so it is read in UTC and never moves by the viewer's zone.
export function dayLabel(
  key: string,
  { year = false, noDate = "No date set" }: { year?: boolean; noDate?: string } = {},
): string {
  if (key === NO_DATE) return noDate;
  const t = Date.parse(`${key}T00:00:00Z`);
  if (!Number.isFinite(t)) return key;
  return formatDate(t, { style: "weekday", year }) as string;
}

// A slot's time in words: "9:00 AM to 10:30 AM", "From 9:00 AM", "Until 10:30 AM", or
// `none` when it has no time.
// A slot's time as words and the moments they name: "9:00 AM to 10:30 AM", "From 9:00 AM",
// "Until 5:00 PM" or `none`. slotLabel joins them; the React schedule puts each moment in a <time>.
export type SlotPart = string | { at: number; text: string };
export function slotParts(
  start: number | null,
  end: number | null,
  zone = "UTC",
  none = "No time set",
): SlotPart[] {
  // "9:00 AM", on the American 12-hour clock, in the schedule's zone.
  const clock = (at: number) => ({ at, text: formatDate(at, { style: "time", zone }) ?? "" });
  if (start !== null && end !== null && end > start) return [clock(start), " to ", clock(end)];
  if (start !== null) return ["From ", clock(start)];
  if (end !== null) return ["Until ", clock(end)];
  return [none];
}

export function slotLabel(
  start: number | null,
  end: number | null,
  zone = "UTC",
  none = "No time set",
): string {
  return slotParts(start, end, zone, none)
    .map((p) => (typeof p === "string" ? p : p.text))
    .join("");
}

// The line that says once which zone the times are in: "Times are in CDT." The zone's name at
// the first item's moment, so a meeting across a clock change still names the right one.
export function zoneLine(at: number | null, zone = "UTC"): string {
  return `Times are in ${zoneName(at ?? Date.now(), zone)}.`;
}

// "3 parallel tracks".
export function tracksLabel(n: number): string {
  return plural(n, "parallel track");
}
