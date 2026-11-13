// The schedule dialog's pure part: what a chosen datetime-local value means. Sample times only.
import assert from "node:assert/strict";
import { test } from "node:test";
import { toDateTimeLocal } from "../../components/field/field.ts";
import { checkSchedule } from "../../components/schedule-dialog/schedule-dialog.ts";

// The value the dialog's field holds: the instant on this machine's own wall clock.
const here = (at) =>
  toDateTimeLocal(new Date(at), Intl.DateTimeFormat().resolvedOptions().timeZone);

test("checkSchedule: no time, a past time and a future time, measured at the time chosen", () => {
  const now = Date.parse("2026-11-12T12:00:00Z");
  assert.deepEqual(checkSchedule("", now), { at: null, problem: "Choose a time first." });
  assert.equal(checkSchedule(here(now - 60_000), now).problem, "Choose a time in the future.");
  const later = checkSchedule(here(now + 3_600_000), now);
  assert.equal(later.problem, null);
  assert.equal(later.at?.getTime(), now + 3_600_000);
});
