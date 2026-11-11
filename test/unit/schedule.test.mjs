// The schedule's grouping: overlapping sessions become parallel tracks, a day is the meeting's
// zone's day, undated sessions come last, and a day nav offers every meeting day.
import assert from "node:assert/strict";
import { test } from "node:test";
import {
  NO_DATE,
  dayKeys,
  dayRange,
  groupByDay,
  pickDay,
  slotLabel,
} from "../../components/schedule/schedule.ts";

const s = (id, start, end, extra = {}) => ({ id, start, end, ...extra });
const times = (x) => x;
const ids = (days) => days.map((d) => [d.key, d.slots.map((sl) => sl.items.map((i) => i.id))]);

test("groupByDay: overlap chains into one slot; touching sessions do not; tracks go by name", () => {
  const days = groupByDay(
    [
      s("late", "2027-03-05T16:00:00Z", "2027-03-05T17:00:00Z"),
      s("b", "2027-03-05T14:30:00Z", "2027-03-05T15:30:00Z", { track: "Room A" }),
      s("a", "2027-03-05T14:00:00Z", "2027-03-05T15:00:00Z", { track: "Room B" }),
      // Starts inside b, after a ends: still the same slot, since b runs on.
      s("c", "2027-03-05T15:15:00Z", "2027-03-05T16:00:00Z", { track: "Room C" }),
      s("undated", null, null),
      s("next", "2027-03-06T09:00:00Z", null),
    ],
    times,
  );
  assert.deepEqual(ids(days), [
    ["2027-03-05", [["b", "a", "c"], ["late"]]],
    ["2027-03-06", [["next"]]],
    [NO_DATE, [["undated"]]],
  ]);
  const [first] = days[0].slots;
  assert.equal(first.parallel, true);
  assert.equal(first.start, Date.parse("2027-03-05T14:00:00Z"));
  assert.equal(first.end, Date.parse("2027-03-05T16:00:00Z"));
  assert.equal(days[0].slots[1].parallel, false);
});

test("groupByDay: the day is the meeting zone's, and a dated session with no time keeps its day", () => {
  // 02:00 UTC on March 6 is 8 PM on March 5 in Chicago.
  const days = groupByDay(
    [s("evening", "2027-03-06T02:00:00Z", null), s("dated", null, null, { day: "2027-03-07" })],
    times,
    "America/Chicago",
  );
  assert.deepEqual(ids(days), [
    ["2027-03-05", [["evening"]]],
    ["2027-03-07", [["dated"]]],
  ]);
});

test("dayKeys: the range, the days with sessions and an added day, undated last", () => {
  const range = dayRange("2027-03-05T14:00:00Z", "2027-03-07T01:00:00Z");
  assert.deepEqual(range, ["2027-03-05", "2027-03-06", "2027-03-07"]);
  const keys = dayKeys([{ key: NO_DATE }, { key: "2027-03-09" }], range, "2027-03-01");
  assert.deepEqual(keys, [
    "2027-03-01",
    "2027-03-05",
    "2027-03-06",
    "2027-03-07",
    "2027-03-09",
    NO_DATE,
  ]);
  assert.equal(pickDay(keys, "2027-03-06"), "2027-03-06");
  assert.equal(pickDay(keys, "2030-01-01"), "2027-03-01");
  assert.equal(pickDay([], "2027-03-06"), null);
});

test("slotLabel: a range, an open end, and no time", () => {
  const a = Date.parse("2027-03-05T14:00:00Z");
  const b = Date.parse("2027-03-05T15:30:00Z");
  assert.equal(slotLabel(a, b), "2:00 PM to 3:30 PM");
  assert.equal(slotLabel(a, b, "America/Chicago"), "8:00 AM to 9:30 AM");
  assert.equal(slotLabel(a, null), "From 2:00 PM");
  assert.equal(slotLabel(null, null), "No time set");
});
