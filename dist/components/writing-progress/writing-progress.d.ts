export type SaveEntry = {
    at: string;
    typed: number;
    removed: number;
};
export type Goal = {
    mode: "daily" | "deadline";
    dailyTarget: number | null;
    /** Weekdays that are writing days, 0 Sunday to 6 Saturday. A day off is not counted against pace or streak. */
    writingDays: number[];
    allowNegative: boolean;
};
export declare const DEFAULT_GOAL: Goal;
export declare const WEEKDAYS: readonly ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
/** How far back a streak is followed; the loader sends this many days of saves. */
export declare const STREAK_HORIZON_DAYS = 400;
/** The weekday of a calendar day, 0 Sunday. Computed at noon UTC, which every zone shares as the same date. */
export declare function weekdayOf(day: string): number;
/** Words per local day: typed minus removed, held at zero unless the goal lets a day go negative. */
export declare function dayTotals(entries: SaveEntry[], timeZone: string, allowNegative: boolean): Map<string, number>;
/** Writing days from `from` to `to`, both included. */
export declare function writingDaysBetween(from: string, to: string, writingDays: number[]): number;
export type Pace = {
    ok: true;
    perDay: number;
    remaining: number;
    days: number;
} | {
    ok: false;
    reason: "no-target" | "no-deadline" | "past" | "no-days" | "done";
};
/**
 * The words a day needs to reach the project's target by its deadline: what was left when today
 * began, spread over the writing days from today to the deadline. Today's own words do not lower
 * today's target, so the number holds still while Dustin writes.
 */
export declare function pace(input: {
    projectTarget: number | null;
    deadline: string;
    wordsNow: number;
    wordsToday: number;
    today: string;
    writingDays: number[];
}): Pace;
/** Today's target, or null when there is none; a day off has none whatever the goal says. */
export declare function targetFor(goal: Goal, today: string, paced: Pace): number | null;
/**
 * Days in a row the target was met, counting back from today. Today counts once it is met and does
 * not break the run before then. A day off neither breaks the run nor adds to it, unless the target
 * was met on it anyway. The target is today's: Carrel keeps no history of past targets.
 */
export declare function streak(totals: Map<string, number>, today: string, target: number | null, writingDays: number[]): number;
/** The last `n` days, newest first, each with its words and whether it was a writing day. */
export declare function recentDays(totals: Map<string, number>, today: string, n: number, writingDays: number[]): {
    day: string;
    words: number;
    writingDay: boolean;
}[];
/** "0123456" as stored, to weekday numbers; anything else in the string is dropped. */
export declare function parseWritingDays(stored: string): number[];
/** The most words a day a goal may ask for. */
export declare const MAX_DAILY_TARGET = 100000;
/**
 * A daily target as a person typed it: "1,500", "1 500" and "1500" are the same; empty is no target.
 * Refused when it is not a whole number from 1 to MAX_DAILY_TARGET, with the sentence to show.
 */
export declare function parseDailyTarget(typed: string): {
    ok: true;
    target: number | null;
} | {
    ok: false;
    error: string;
};
/** A goal as a form posted it, checked: the mode, the target, at least one writing day. */
export declare function goalFromForm(input: {
    mode: string;
    dailyTarget: string;
    writingDays: string[];
    allowNegative: boolean;
}): {
    ok: true;
    goal: Goal;
} | {
    ok: false;
    error: string;
};
/** An untyped count a form posted: a whole number of words, 0 for anything else. */
export declare function untypedCount(value: unknown): number;
/**
 * The words pasted or dropped into an editor and not yet reported: they reach the file but were not
 * typed, so the day's count leaves them out. `add` on each paste or drop; `send` when a save posts
 * (the count to send with it); `settled(ok)` when the save is done, which takes what it carried off
 * only if the server has it; `reset` when the text is replaced (a discard, an AI draft taken).
 */
export declare function untypedTally(): {
    add(words: number): void;
    send(): number;
    settled(ok: boolean): void;
    reset(): void;
    readonly pending: number;
};
/** The weekday's name of a calendar day. */
export declare function weekdayName(day: string): string;
/** The pace a deadline asks for, or why there is none, in a sentence. */
export declare function paceLine(paced: Pace, deadline: string): string;
/** The sentence that says what the last days' chart shows, with its numbers. Days newest first. */
export declare function weekSentence(days: ReadonlyArray<{
    day: string;
    words: number;
    writingDay: boolean;
}>, target: number | null): string;
