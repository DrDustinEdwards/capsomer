// The writing progress math, imported straight from the TypeScript source: the local day, the
// pace a deadline asks for, streaks across days off, and the untyped tally. Moved from Carrel's
// test/writing.test.ts with the code.
import assert from "node:assert/strict";
import { test } from "node:test";
import { dayKey } from "../../components/time/time.ts";
import {
  dayTotals,
  goalFromForm,
  pace,
  streak,
  targetFor,
  untypedTally,
} from "../../components/writing-progress/writing-progress.ts";

const EVERY_DAY = [0, 1, 2, 3, 4, 5, 6];
const WEEKDAYS_ONLY = [1, 2, 3, 4, 5];

test("a save falls on the device's calendar day, and deletions stop at zero unless allowed", () => {
  // 04:30 UTC on 10 October is still 9 October in Chicago and already 10 October in Tokyo.
  assert.equal(dayKey("2026-10-10T04:30:00Z", "America/Chicago"), "2026-10-09");
  assert.equal(dayKey("2026-10-09T15:30:00Z", "Asia/Tokyo"), "2026-10-10");
  const entries = [{ at: "2026-10-10T12:00:00Z", typed: 40, removed: 100 }];
  assert.equal(dayTotals(entries, "UTC", false).get("2026-10-10"), 0);
  assert.equal(dayTotals(entries, "UTC", true).get("2026-10-10"), -60);
});

test("pace spreads what was left this morning over the writing days, and holds still while you write", () => {
  // Saturday 10 October to Friday 16 October 2026: five weekdays; 7,500 written before today.
  const base = {
    projectTarget: 10_000,
    deadline: "2026-10-16",
    today: "2026-10-10",
    writingDays: WEEKDAYS_ONLY,
  };
  const want = { ok: true, perDay: 500, remaining: 2_500, days: 5 };
  assert.deepEqual(pace({ ...base, wordsNow: 7_500, wordsToday: 0 }), want);
  assert.deepEqual(pace({ ...base, wordsNow: 7_800, wordsToday: 300 }), want);
  assert.deepEqual(pace({ ...base, deadline: "2026-10-01", wordsNow: 0, wordsToday: 0 }), {
    ok: false,
    reason: "past",
  });
  assert.deepEqual(pace({ ...base, wordsNow: 10_000, wordsToday: 0 }), {
    ok: false,
    reason: "done",
  });
  // A day off has no target, whatever the goal says.
  const goal = {
    mode: "daily",
    dailyTarget: 500,
    writingDays: WEEKDAYS_ONLY,
    allowNegative: false,
  };
  assert.equal(targetFor(goal, "2026-10-10", { ok: false, reason: "no-target" }), null);
});

test("a missed writing day ends a streak, a day off does not, and today counts once met", () => {
  const totals = (days) => new Map(Object.entries(days));
  const t = totals({ "2026-10-07": 600, "2026-10-08": 500, "2026-10-09": 700, "2026-10-10": 100 });
  assert.equal(streak(t, "2026-10-10", 500, EVERY_DAY), 3);
  assert.equal(streak(new Map([...t, ["2026-10-10", 500]]), "2026-10-10", 500, EVERY_DAY), 4);
  // Friday 9 met, Saturday 10 and Sunday 11 off, Monday 12 met.
  const w = totals({ "2026-10-08": 0, "2026-10-09": 500, "2026-10-12": 500 });
  assert.equal(streak(w, "2026-10-12", 500, WEEKDAYS_ONLY), 2);
  assert.equal(streak(w, "2026-10-12", 500, EVERY_DAY), 1);
  assert.equal(streak(w, "2026-10-12", null, EVERY_DAY), 0);
});

test("a goal from the form: commas allowed, out of range and no writing days refused", () => {
  const form = { mode: "daily", writingDays: ["1", "2"], allowNegative: false };
  assert.deepEqual(goalFromForm({ ...form, dailyTarget: "1,500" }), {
    ok: true,
    goal: { mode: "daily", dailyTarget: 1500, writingDays: [1, 2], allowNegative: false },
  });
  assert.equal(goalFromForm({ ...form, dailyTarget: "" }).goal.dailyTarget, null);
  assert.equal(goalFromForm({ ...form, dailyTarget: "0" }).ok, false);
  assert.equal(goalFromForm({ ...form, dailyTarget: "2.5" }).ok, false);
  assert.equal(goalFromForm({ ...form, dailyTarget: "500", writingDays: [] }).ok, false);
});

test("the untyped tally takes off only what a save that succeeded carried", () => {
  const tally = untypedTally();
  tally.add(30);
  assert.equal(tally.send(), 30);
  tally.add(12); // pasted while the save was on its way
  tally.settled(true);
  assert.equal(tally.pending, 12);
  assert.equal(tally.send(), 12);
  tally.settled(false); // the save failed: the words are still owed
  assert.equal(tally.pending, 12);
  tally.reset();
  assert.equal(tally.pending, 0);
});
