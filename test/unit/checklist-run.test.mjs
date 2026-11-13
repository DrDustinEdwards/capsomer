// A checklist run's model: timers count to the moment they end (so a reload or a sleeping phone
// still knows what is left) and ring once; a range runs its longer end; two steps sharing a number
// are two steps; a stored value is parsed, never trusted. No clock, storage or DOM: `now` is passed in.
import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RUN_VERSION,
  clock,
  newRun,
  parseRun,
  pauseTimer,
  runMarkdown,
  runProgress,
  runRecord,
  shownStep,
  startTimer,
  stepBeside,
  tickTimers,
  timerMs,
  timerRemaining,
  toggleDone,
  setNote,
} from "../../components/checklist-run/checklist-run-model.ts";

const T0 = Date.UTC(2026, 9, 3, 15, 0, 0);
const checklist = { path: "/sample/field-day", version: "3", title: "Field day", scale: 5 };
const STEPS = [
  { key: "a.1", number: 1, section: "Before you go", text: "Pack the notebook." },
  { key: "a.2", number: 2, section: "Before you go", text: "Charge the camera.\n   Pack it." },
  { key: "b.1", number: 1, section: "At the plot", text: "Photograph every marker." },
];
const KEYS = STEPS.map((s) => s.key);

test("timerMs: the longer end of a range, in the timer's own unit, so it never rings early", () => {
  const t = (min, max, unit) => timerMs({ label: "", text: "", min, max, unit });
  assert.equal(t(5, 10, "minutes"), 600_000);
  assert.equal(t(30, null, "sec"), 30_000);
  assert.equal(t(1, 1, "day"), 86_400_000);
  assert.equal(t(null, null, "minutes"), null);
  assert.equal(t(0, 0, "minutes"), null);
  assert.equal(t(5, 5, "furlongs"), null);
});

test("a timer counts to its end, pauses with what is left, and rings once", () => {
  let run = startTimer(newRun(checklist, T0), "a.2.0", 300_000, T0);
  assert.equal(timerRemaining(run, "a.2.0", T0 + 120_000), 180_000);
  assert.equal(timerRemaining(run, "a.2.0", T0 + 999_000), 0, "never negative");
  assert.equal(
    timerRemaining(parseRun(JSON.stringify(run)), "a.2.0", T0 + 240_000),
    60_000,
    "after a reload",
  );
  run = pauseTimer(run, "a.2.0", T0 + 100_000);
  assert.equal(
    timerRemaining(run, "a.2.0", T0 + 900_000),
    200_000,
    "a paused timer does not run down",
  );
  run = startTimer(run, "a.2.0", 300_000, T0 + 1_000_000);
  assert.equal(timerRemaining(run, "a.2.0", T0 + 1_050_000), 150_000, "resumed from what was left");
  const early = tickTimers(run, T0 + 1_100_000);
  assert.equal(early.run, run, "nothing rang, the same run comes back");
  const later = tickTimers(run, T0 + 1_201_000);
  assert.deepEqual(later.rang, ["a.2.0"]);
  assert.deepEqual(
    tickTimers(later.run, T0 + 1_300_000).rang,
    [],
    "a done timer does not ring again",
  );
  assert.equal(clock(125_000), "2:05");
  assert.equal(clock(5_400_000), "1:30:00");
  assert.equal(clock(999), "0:01", "rounds up, so 0:00 means done");
});

test("two steps that share a number are two steps, in progress and in the record", () => {
  let run = toggleDone(newRun(checklist, T0), "a.1", T0 + 60_000);
  run = setNote(run, "a.2", "line one\nline two");
  assert.equal(run.steps["b.1"], undefined);
  assert.deepEqual(runProgress(toggleDone(run, "nowhere.9", T0), KEYS), { done: 1, total: 3 });
  assert.deepEqual(
    runRecord(run, STEPS).steps.map((s) => [s.section, s.step, s.done]),
    [
      ["Before you go", 1, true],
      ["Before you go", 2, false],
      ["At the plot", 1, false],
    ],
  );
  const md = runMarkdown(run, STEPS, "Protocol");
  assert.match(md, /Protocol: \/sample\/field-day, version 3\n/);
  assert.match(md, /- \[x\] 1\. Pack the notebook\. \(2026-10-03T15:01:00\.000Z\)\n/);
  assert.match(md, /- \[ \] 2\. Charge the camera\. Pack it\.\n {2}- Note: line one line two\n/);
  assert.match(md, /### At the plot\n\n- \[ \] 1\. Photograph every marker\.\n/);
});

test("parseRun accepts only what the model wrote", () => {
  const run = toggleDone(newRun(checklist, T0), "a.1", T0);
  assert.deepEqual(parseRun(JSON.stringify(run)), run);
  assert.equal(parseRun(null), null);
  assert.equal(parseRun("not json"), null);
  assert.equal(parseRun(JSON.stringify({ ...run, v: RUN_VERSION + 1 })), null);
  assert.equal(parseRun(JSON.stringify({ ...run, steps: null })), null);
  const tidy = parseRun(JSON.stringify({ ...run, title: 5, scale: "x", finishedAt: "no" }));
  assert.deepEqual([tidy.title, tidy.scale, tidy.finishedAt], ["", null, null]);
});

test("one step at a time shows the chosen step, else the first not done, else the last", () => {
  let run = newRun(checklist, 0);
  assert.equal(shownStep(run, KEYS, null), "a.1");
  run = toggleDone(run, "a.1", 1);
  assert.equal(shownStep(run, KEYS, null), "a.2");
  assert.equal(shownStep(run, KEYS, "b.1"), "b.1");
  assert.equal(shownStep(run, KEYS, "gone.9"), "a.2");
  for (const key of ["a.2", "b.1"]) run = toggleDone(run, key, 2);
  assert.equal(shownStep(run, KEYS, null), "b.1", "every step done: the last");
  assert.equal(stepBeside(KEYS, "a.2", 1), "b.1");
  assert.equal(stepBeside(KEYS, "a.1", -1), null);
});
