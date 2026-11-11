// laterUntil decides when a row set aside comes back; a wrong hour across a summer-time change
// would bring it back in the night. Correctness only.
import assert from "node:assert/strict";
import { test } from "node:test";
import { knownZone, laterUntil } from "../../components/time/time.ts";

test("laterUntil: 8 am the next day in the person's zone, across a summer-time change", () => {
  // Saturday Nov 1 2026, 10 pm in Chicago (CDT); clocks go back that night.
  assert.equal(
    laterUntil(Date.parse("2026-11-02T03:00:00Z"), "America/Chicago"),
    "2026-11-02T14:00:00.000Z",
  );
  // Late evening in Chicago is already the next day in UTC; the day is the person's.
  assert.equal(
    laterUntil(Date.parse("2026-10-01T04:30:00Z"), "America/Chicago"),
    "2026-10-01T13:00:00.000Z",
  );
  assert.equal(
    laterUntil(new Date("2026-10-01T04:30:00Z"), "Nowhere/Zone"),
    "2026-10-02T08:00:00.000Z",
  );
});

test("knownZone: an unknown or missing zone is UTC", () => {
  assert.equal(knownZone("America/Chicago"), "America/Chicago");
  assert.equal(knownZone("Nowhere/Zone"), "UTC");
  assert.equal(knownZone(undefined), "UTC");
});
