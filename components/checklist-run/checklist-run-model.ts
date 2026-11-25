// The pure half of a checklist run: steps done, a note on each, timers and the scale chosen. A run lives in the browser
// (localStorage) and never reaches a server. Nothing here touches the DOM, a clock or storage; the browser module passes `now`.
// A timer's remaining time is computed from when it ends, not counted down, so a sleeping phone or a reload still knows.

import { parseVersioned } from "../state-hooks/state-hooks.ts";
import { DAY, HOUR, MIN, SEC, timecode } from "../time/time.ts";

export const RUN_VERSION = 1;

const UNIT_MS: Readonly<Record<string, number>> = Object.freeze({
  second: SEC,
  seconds: SEC,
  sec: SEC,
  s: SEC,
  minute: MIN,
  minutes: MIN,
  min: MIN,
  hour: HOUR,
  hours: HOUR,
  h: HOUR,
  day: DAY,
  days: DAY,
});

export interface StepTimer {
  label: string;
  text: string;
  min: number | null;
  max: number | null;
  unit: string;
}
export interface TimerState {
  state: "running" | "paused" | "done";
  endsAt: number | null;
  remainingMs: number;
  totalMs: number;
}
export interface StepState {
  done: boolean;
  doneAt: number | null;
  note: string;
}
export interface Run {
  v: number;
  path: string;
  version: string;
  title: string;
  scale: number | null;
  startedAt: number;
  finishedAt: number | null;
  note: string;
  steps: Record<string, StepState>;
  timers: Record<string, TimerState>;
}
export interface StepInfo {
  key?: string;
  number: number | string;
  section?: string;
  text: string;
}

// A timer's length in milliseconds: the longer end of a range ("5 to 10 minutes" runs 10), because
// a timer that rings early is the mistake that costs the work. Null when it has no usable number.
export function timerMs(timer: StepTimer): number | null {
  const unit = UNIT_MS[String(timer.unit).toLowerCase()];
  const amount = timer.max ?? timer.min;
  if (unit === undefined || amount === null || !Number.isFinite(amount) || amount <= 0) return null;
  return Math.round(amount * unit);
}

export const timerKey = (step: number | string, index: number): string => `${step}.${index}`;

export function newRun(
  checklist: { path: string; version: string; title: string; scale: number | null },
  now: number,
): Run {
  return {
    v: RUN_VERSION,
    path: checklist.path,
    version: checklist.version,
    title: checklist.title,
    scale: checklist.scale,
    startedAt: now,
    finishedAt: null,
    note: "",
    steps: {},
    timers: {},
  };
}

const stepOf = (run: Run, step: number | string): StepState =>
  run.steps[String(step)] ?? { done: false, doneAt: null, note: "" };

export function toggleDone(run: Run, step: number | string, now: number): Run {
  const current = stepOf(run, step);
  return {
    ...run,
    steps: {
      ...run.steps,
      [String(step)]: { ...current, done: !current.done, doneAt: current.done ? null : now },
    },
  };
}

export function setNote(run: Run, step: number | string, note: string): Run {
  return {
    ...run,
    steps: { ...run.steps, [String(step)]: { ...stepOf(run, step), note: note.slice(0, 2000) } },
  };
}

export const setRunNote = (run: Run, note: string): Run => ({ ...run, note: note.slice(0, 4000) });
export const setScale = (run: Run, scale: number | null): Run => ({ ...run, scale });
export const finishRun = (run: Run, now: number): Run => ({
  ...run,
  finishedAt: run.finishedAt ?? now,
});

export function startTimer(run: Run, key: string, ms: number, now: number): Run {
  const current = run.timers[key];
  const remainingMs = current && current.state === "paused" ? current.remainingMs : ms;
  return {
    ...run,
    timers: {
      ...run.timers,
      [key]: { state: "running", endsAt: now + remainingMs, remainingMs, totalMs: ms },
    },
  };
}

export function pauseTimer(run: Run, key: string, now: number): Run {
  const current = run.timers[key];
  if (!current || current.state !== "running" || current.endsAt === null) return run;
  return {
    ...run,
    timers: {
      ...run.timers,
      [key]: {
        ...current,
        state: "paused",
        endsAt: null,
        remainingMs: Math.max(0, current.endsAt - now),
      },
    },
  };
}

export function resetTimer(run: Run, key: string): Run {
  const { [key]: _gone, ...rest } = run.timers;
  return { ...run, timers: rest };
}

export function timerRemaining(run: Run, key: string, now: number): number | null {
  const t = run.timers[key];
  if (!t) return null;
  if (t.state === "done") return 0;
  if (t.state === "paused") return t.remainingMs;
  return Math.max(0, (t.endsAt ?? now) - now);
}

export function tickTimers(run: Run, now: number): { run: Run; rang: string[] } {
  const rang: string[] = [];
  const timers: Record<string, TimerState> = { ...run.timers };
  for (const [key, t] of Object.entries(run.timers)) {
    if (t.state === "running" && t.endsAt !== null && t.endsAt <= now) {
      timers[key] = { ...t, state: "done", endsAt: null, remainingMs: 0 };
      rang.push(key);
    }
  }
  return rang.length === 0 ? { run, rang } : { run: { ...run, timers }, rang };
}

export const clock = (ms: number): string => timecode(Math.ceil(Math.max(0, ms) / SEC) * SEC);

export function runProgress(
  run: Run,
  steps: Array<number | string>,
): { done: number; total: number } {
  const done = steps.filter((n) => run.steps[String(n)]?.done).length;
  return { done, total: steps.length };
}

// The step one-at-a-time shows: the one the person chose, while it is still a step of the
// checklist; else the first not yet done; else the last, so a finished run still shows a step.
export function shownStep(run: Run, keys: string[], chosen: string | null): string | null {
  if (chosen && keys.includes(chosen)) return chosen;
  return keys.find((key) => !run.steps[key]?.done) ?? keys[keys.length - 1] ?? null;
}

export function stepBeside(keys: string[], key: string, by: -1 | 1): string | null {
  const at = keys.indexOf(key);
  return at === -1 ? null : (keys[at + by] ?? null);
}

export const when = (ms: number | null): string => (ms === null ? "" : new Date(ms).toISOString());

export interface RunRecord {
  record: string;
  format: number;
  checklist: { path: string; title: string; version: string };
  scale: number | null;
  startedAt: string;
  finishedAt: string;
  note: string;
  steps: Array<{
    step: number | string;
    section: string;
    text: string;
    done: boolean;
    doneAt: string;
    note: string;
  }>;
}

// The saved record as a plain object (the JSON download), with the checklist's identity so it says which version it followed.
export function runRecord(run: Run, steps: StepInfo[], name = "checklist run"): RunRecord {
  return {
    record: name,
    format: RUN_VERSION,
    checklist: { path: run.path, title: run.title, version: run.version },
    scale: run.scale,
    startedAt: when(run.startedAt),
    finishedAt: when(run.finishedAt),
    note: run.note,
    steps: steps.map((s) => {
      const st = stepOf(run, s.key ?? s.number);
      return {
        step: s.number,
        section: s.section ?? "",
        text: s.text,
        done: st.done,
        doneAt: when(st.doneAt),
        note: st.note,
      };
    }),
  };
}

// The same record as Markdown for a notebook or an email. `label` names what was run.
export function runMarkdown(run: Run, steps: StepInfo[], label = "Checklist"): string {
  const lines = [`# Run: ${run.title}`, ""];
  lines.push(`${label}: ${run.path}${run.version ? `, version ${run.version}` : ""}`);
  if (run.scale !== null) lines.push(`Scale: ${run.scale}`);
  lines.push(`Started: ${when(run.startedAt)}`);
  if (run.finishedAt !== null) lines.push(`Finished: ${when(run.finishedAt)}`);
  if (run.note.trim()) lines.push("", run.note.trim());
  lines.push("", "## Steps", "");
  let section = "";
  for (const s of steps) {
    if ((s.section ?? "") !== section) {
      section = s.section ?? "";
      if (section) lines.push("", `### ${section}`, "");
    }
    const st = stepOf(run, s.key ?? s.number);
    lines.push(
      `- [${st.done ? "x" : " "}] ${s.number}. ${s.text.replace(/\s+/g, " ").trim()}${st.done && st.doneAt ? ` (${when(st.doneAt)})` : ""}`,
    );
    if (st.note.trim()) lines.push(`  - Note: ${st.note.trim().replace(/\n+/g, " ")}`);
  }
  return `${lines.join("\n")}\n`;
}

// Parses a stored run, or returns null: values from another format are ignored, never trusted.
export function parseRun(raw: unknown): Run | null {
  return parseVersioned(typeof raw === "string" ? raw : null, RUN_VERSION, runOf);
}

function runOf(value: Record<string, unknown>): Run | null {
  // typeof null is "object", so a null `steps` must be refused by name.
  const plainObject = (x: unknown) => x !== null && typeof x === "object" && !Array.isArray(x);
  if (
    typeof value.path !== "string" ||
    typeof value.startedAt !== "number" ||
    !plainObject(value.steps) ||
    !plainObject(value.timers)
  )
    return null;
  return {
    v: RUN_VERSION,
    path: value.path,
    version: typeof value.version === "string" ? value.version : "",
    title: typeof value.title === "string" ? value.title : "",
    scale: typeof value.scale === "number" ? value.scale : null,
    startedAt: value.startedAt,
    finishedAt: typeof value.finishedAt === "number" ? value.finishedAt : null,
    note: typeof value.note === "string" ? value.note : "",
    steps: value.steps as Record<string, StepState>,
    timers: value.timers as Record<string, TimerState>,
  };
}
