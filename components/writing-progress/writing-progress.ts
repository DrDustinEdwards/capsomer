// The writing progress panel's math: daily words, a goal, its streak and a deadline's pace (after
// Dabble, Ulysses and Scrivener). A day is the local calendar day in the device's time zone, so it
// resets at local midnight wherever the writer is; the browser passes its zone in and nothing here
// reads the server's clock zone. Only typed words count: each save's `typed` already leaves out
// pastes, drops, imports and AI drafts taken as the working draft (the untyped tally below is how an
// editor keeps that count). Deletions come off the day, but not below zero unless the goal allows
// it. A target is set by hand or worked out from the project's deadline over the writing days
// chosen, and a streak counts the days that target was met.
//
// Pure functions only: the panel runs them in the browser, a server runs them to check a goal, and
// the tests run them anywhere. Extracted from Carrel (app/lib/writing/progress.ts).

export type SaveEntry = { at: string; typed: number; removed: number };

export type Goal = {
  mode: "daily" | "deadline";
  dailyTarget: number | null;
  /** Weekdays that are writing days, 0 Sunday to 6 Saturday. A day off is not counted against pace or streak. */
  writingDays: number[];
  allowNegative: boolean;
};

export const DEFAULT_GOAL: Goal = {
  mode: "daily",
  dailyTarget: null,
  writingDays: [0, 1, 2, 3, 4, 5, 6],
  allowNegative: false,
};

export const WEEKDAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

/** How far back a streak is followed; the loader sends this many days of saves. */
export const STREAK_HORIZON_DAYS = 400;

import { plural } from "../hooks/hooks.ts";
import { dayKey } from "../time/time.ts";

/** The weekday of a calendar day, 0 Sunday. Computed at noon UTC, which every zone shares as the same date. */
export function weekdayOf(day: string): number {
  return new Date(`${day}T12:00:00Z`).getUTCDay();
}

function addDays(day: string, n: number): string {
  const d = new Date(`${day}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/** Words per local day: typed minus removed, held at zero unless the goal lets a day go negative. */
export function dayTotals(
  entries: SaveEntry[],
  timeZone: string,
  allowNegative: boolean,
): Map<string, number> {
  const raw = new Map<string, number>();
  for (const e of entries) {
    const day = dayKey(e.at, timeZone);
    raw.set(day, (raw.get(day) ?? 0) + e.typed - e.removed);
  }
  if (allowNegative) return raw;
  return new Map([...raw].map(([day, n]) => [day, Math.max(0, n)]));
}

/** Writing days from `from` to `to`, both included. */
export function writingDaysBetween(from: string, to: string, writingDays: number[]): number {
  let n = 0;
  for (let day = from, guard = 0; day <= to && guard < 3700; day = addDays(day, 1), guard++) {
    if (writingDays.includes(weekdayOf(day))) n++;
  }
  return n;
}

export type Pace =
  | { ok: true; perDay: number; remaining: number; days: number }
  | { ok: false; reason: "no-target" | "no-deadline" | "past" | "no-days" | "done" };

/**
 * The words a day needs to reach the project's target by its deadline: what was left when today
 * began, spread over the writing days from today to the deadline. Today's own words do not lower
 * today's target, so the number holds still while Dustin writes.
 */
export function pace(input: {
  projectTarget: number | null;
  deadline: string;
  wordsNow: number;
  wordsToday: number;
  today: string;
  writingDays: number[];
}): Pace {
  if (!input.projectTarget) return { ok: false, reason: "no-target" };
  if (!input.deadline) return { ok: false, reason: "no-deadline" };
  if (input.deadline < input.today) return { ok: false, reason: "past" };
  const remaining = Math.max(
    0,
    input.projectTarget - (input.wordsNow - Math.max(0, input.wordsToday)),
  );
  if (remaining === 0) return { ok: false, reason: "done" };
  const days = writingDaysBetween(input.today, input.deadline, input.writingDays);
  if (days === 0) return { ok: false, reason: "no-days" };
  return { ok: true, perDay: Math.ceil(remaining / days), remaining, days };
}

/** Today's target, or null when there is none; a day off has none whatever the goal says. */
export function targetFor(goal: Goal, today: string, paced: Pace): number | null {
  if (!goal.writingDays.includes(weekdayOf(today))) return null;
  if (goal.mode === "deadline") return paced.ok ? paced.perDay : null;
  return goal.dailyTarget && goal.dailyTarget > 0 ? goal.dailyTarget : null;
}

/**
 * Days in a row the target was met, counting back from today. Today counts once it is met and does
 * not break the run before then. A day off neither breaks the run nor adds to it, unless the target
 * was met on it anyway. The target is today's: Carrel keeps no history of past targets.
 */
export function streak(
  totals: Map<string, number>,
  today: string,
  target: number | null,
  writingDays: number[],
): number {
  if (!target || target <= 0) return 0;
  let run = 0;
  for (let i = 0; i < STREAK_HORIZON_DAYS; i++) {
    const day = addDays(today, -i);
    const met = (totals.get(day) ?? 0) >= target;
    if (met) {
      run++;
      continue;
    }
    if (i === 0) continue;
    if (!writingDays.includes(weekdayOf(day))) continue;
    break;
  }
  return run;
}

/** The last `n` days, newest first, each with its words and whether it was a writing day. */
export function recentDays(
  totals: Map<string, number>,
  today: string,
  n: number,
  writingDays: number[],
) {
  return Array.from({ length: n }, (_, i) => {
    const day = addDays(today, -i);
    return { day, words: totals.get(day) ?? 0, writingDay: writingDays.includes(weekdayOf(day)) };
  });
}

/** "0123456" as stored, to weekday numbers; anything else in the string is dropped. */
export function parseWritingDays(stored: string): number[] {
  return [
    ...new Set(
      stored
        .split("")
        .map(Number)
        .filter((n) => Number.isInteger(n) && n >= 0 && n <= 6),
    ),
  ].sort();
}

/** The most words a day a goal may ask for. */
export const MAX_DAILY_TARGET = 100_000;

/**
 * A daily target as a person typed it: "1,500", "1 500" and "1500" are the same; empty is no target.
 * Refused when it is not a whole number from 1 to MAX_DAILY_TARGET, with the sentence to show.
 */
export function parseDailyTarget(
  typed: string,
): { ok: true; target: number | null } | { ok: false; error: string } {
  const raw = typed.replace(/[,_\s]/g, "");
  if (raw === "") return { ok: true, target: null };
  const n = Number(raw);
  if (!Number.isInteger(n) || n < 1 || n > MAX_DAILY_TARGET)
    return {
      ok: false,
      error: `Give the daily target as a whole number of words from 1 to ${MAX_DAILY_TARGET.toLocaleString("en-US")}, or leave it empty.`,
    };
  return { ok: true, target: n };
}

/** A goal as a form posted it, checked: the mode, the target, at least one writing day. */
export function goalFromForm(input: {
  mode: string;
  dailyTarget: string;
  writingDays: string[];
  allowNegative: boolean;
}): { ok: true; goal: Goal } | { ok: false; error: string } {
  const target = parseDailyTarget(input.dailyTarget);
  if (!target.ok) return target;
  const writingDays = parseWritingDays(input.writingDays.join(""));
  if (writingDays.length === 0) return { ok: false, error: "Choose at least one writing day." };
  return {
    ok: true,
    goal: {
      mode: input.mode === "deadline" ? "deadline" : "daily",
      dailyTarget: target.target,
      writingDays,
      allowNegative: input.allowNegative,
    },
  };
}

/** An untyped count a form posted: a whole number of words, 0 for anything else. */
export function untypedCount(value: unknown): number {
  const n = Number(value ?? 0);
  return Number.isInteger(n) && n > 0 && n < 10_000_000 ? n : 0;
}

/**
 * The words pasted or dropped into an editor and not yet reported: they reach the file but were not
 * typed, so the day's count leaves them out. `add` on each paste or drop; `send` when a save posts
 * (the count to send with it); `settled(ok)` when the save is done, which takes what it carried off
 * only if the server has it; `reset` when the text is replaced (a discard, an AI draft taken).
 */
export function untypedTally() {
  let pending = 0;
  let sent = 0;
  return {
    add(words: number) {
      if (Number.isFinite(words) && words > 0) pending += Math.floor(words);
    },
    send(): number {
      sent = pending;
      return sent;
    },
    settled(ok: boolean) {
      if (ok) pending = Math.max(0, pending - sent);
      sent = 0;
    },
    reset() {
      pending = 0;
      sent = 0;
    },
    get pending() {
      return pending;
    },
  };
}

const n = (value: number) => value.toLocaleString("en-US");

/** The weekday's name of a calendar day. */
export function weekdayName(day: string): string {
  return WEEKDAYS[weekdayOf(day)]!;
}

/** The pace a deadline asks for, or why there is none, in a sentence. */
export function paceLine(paced: Pace, deadline: string): string {
  if (paced.ok)
    return `${n(paced.remaining)} words to go by ${deadline}: ${n(paced.perDay)} a day over ${plural(paced.days, "writing day")}.`;
  switch (paced.reason) {
    case "no-target":
      return "No project target yet, so there is no pace to work out.";
    case "no-deadline":
      return "No deadline yet, so there is no pace to work out.";
    case "past":
      return `The deadline, ${deadline}, has passed.`;
    case "no-days":
      return "No writing days are left before the deadline.";
    case "done":
      return "The project has reached its target.";
  }
}

/** The sentence that says what the last days' chart shows, with its numbers. Days newest first. */
export function weekSentence(
  days: ReadonlyArray<{ day: string; words: number; writingDay: boolean }>,
  target: number | null,
): string {
  if (days.length === 0) return "No days to show.";
  if (target !== null) {
    const writing = days.filter((d) => d.writingDay);
    const met = writing.filter((d) => d.words >= target).length;
    return `The ${n(target)}-word target was met on ${met} of the last ${plural(writing.length, "writing day")}.`;
  }
  const top = days.reduce((a, d) => (d.words > a.words ? d : a), days[0]!);
  const total = days.reduce((sum, d) => sum + d.words, 0);
  return `${n(total)} words typed over the last ${days.length} days${top.words > 0 ? `, the most on ${weekdayName(top.day)} (${n(top.words)})` : ""}.`;
}
