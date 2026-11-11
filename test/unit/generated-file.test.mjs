// The generated file's lifecycle: a live run holds the lock, a dead one frees it and reads as a
// failure, a regenerate keeps the earlier file downloadable, and a change to the data makes a
// ready file stale.
import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LOCK_MS,
  STALLED_REASON,
  fileState,
  mayStart,
} from "../../components/generated-file/generated-file.ts";

const NOW = Date.parse("2027-02-20T15:00:00Z");
const MADE = "2027-02-19T21:04:00Z";

test("fileState: nothing run is none, and may start", () => {
  for (const rec of [null, undefined, {}, { status: null }]) {
    const v = fileState(rec, NOW);
    assert.equal(v.state, "none");
    assert.equal(v.canStart, true);
    assert.equal(v.hasFile, false);
  }
});

test("fileState: a run holds the lock until it is older than the lock, then reads as failed", () => {
  const fresh = { status: "generating", startedAt: NOW - LOCK_MS + 1000 };
  assert.equal(fileState(fresh, NOW).state, "generating");
  assert.equal(mayStart(fresh, NOW), false);
  const dead = { status: "generating", startedAt: NOW - LOCK_MS };
  const v = fileState(dead, NOW);
  assert.deepEqual(
    [v.state, v.stalled, v.reason, v.canStart],
    ["failed", true, STALLED_REASON, true],
  );
  // No start time: the run cannot be aged and keeps the lock.
  assert.equal(mayStart({ status: "generating" }, NOW), false);
});

test("fileState: a regenerate or a failed run keeps the earlier file", () => {
  assert.equal(
    fileState({ status: "generating", startedAt: NOW, generatedAt: MADE }, NOW).hasFile,
    true,
  );
  const failed = fileState({ status: "failed", generatedAt: MADE, reason: "Out of time." }, NOW);
  assert.deepEqual([failed.state, failed.hasFile, failed.reason], ["failed", true, "Out of time."]);
});

test("fileState: ready until the data changes after it was made", () => {
  const ready = { status: "ready", generatedAt: MADE, bytes: 10 };
  assert.equal(fileState(ready, NOW).state, "ready");
  assert.equal(fileState({ ...ready, changedAt: "2027-02-19T20:00:00Z" }, NOW).state, "ready");
  assert.equal(fileState({ ...ready, changedAt: "2027-02-20T10:30:00Z" }, NOW).state, "stale");
});
