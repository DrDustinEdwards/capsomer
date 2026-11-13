// The schedule dialog's pure part: an instant as a datetime-local value in a zone (across a
// daylight saving change), and what a chosen value means. Sample times only.
import assert from "node:assert/strict";
import { test } from "node:test";
import { checkSchedule, localValue } from "../../components/schedule-dialog/schedule-dialog.ts";

test("localValue: the wall-clock time in the zone, minutes only, midnight as 00", () => {
  assert.equal(localValue("2026-11-12T15:30:45Z", "UTC"), "2026-11-12T15:30");
  assert.equal(localValue("2026-11-12T15:30:00Z", "America/Chicago"), "2026-11-12T09:30");
  assert.equal(localValue("2026-07-12T15:30:00Z", "America/Chicago"), "2026-07-12T10:30");
  assert.equal(localValue("2026-11-12T00:05:00Z", "UTC"), "2026-11-12T00:05");
  assert.equal(localValue("not a time"), "");
});

test("checkSchedule: no time, a past time and a future time, measured at the time chosen", () => {
  const now = Date.parse("2026-11-12T12:00:00Z");
  assert.deepEqual(checkSchedule("", now), { at: null, problem: "Choose a time first." });
  assert.equal(
    checkSchedule(localValue(now - 60_000), now).problem,
    "Choose a time in the future.",
  );
  const later = checkSchedule(localValue(now + 3_600_000), now);
  assert.equal(later.problem, null);
  assert.equal(later.at?.getTime(), now + 3_600_000);
});
