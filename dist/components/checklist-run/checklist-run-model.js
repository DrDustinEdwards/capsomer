// The pure half of a checklist run: what a run is, how its timers count, and what the saved
// record says. A run is a person working through one checklist once (a lab procedure, a recipe,
// a release list): which steps are done, a note on each, the timers they started, the scale they
// chose. It lives in the browser (localStorage), is downloadable and printable, and never reaches
// a server: nothing here touches the DOM, a clock or storage, so a test runs the same functions.
// The browser module (checklist-run.ts) passes `now` in. Extracted from dustinedwards.info's run
// mode (app/kb/procedures/run.mjs).
//
// A timer's remaining time is computed from the moment it ends, not counted down, so a phone that
// sleeps or a page that reloads mid-incubation still knows how long is left.
import { SEC, timecode } from "../time/time.js";
export const RUN_VERSION = 1;
// Seconds in each unit a timer can use.
const UNIT_SECONDS = Object.freeze({
    second: 1,
    seconds: 1,
    sec: 1,
    s: 1,
    minute: 60,
    minutes: 60,
    min: 60,
    hour: 3600,
    hours: 3600,
    h: 3600,
    day: 86400,
    days: 86400,
});
// A timer's length in milliseconds: the longer end of a range ("5 to 10 minutes" runs 10), because
// a timer that rings early is the mistake that costs the work. Null when it has no usable number.
export function timerMs(timer) {
    const seconds = UNIT_SECONDS[String(timer.unit).toLowerCase()];
    const amount = timer.max ?? timer.min;
    if (seconds === undefined || amount === null || !Number.isFinite(amount) || amount <= 0)
        return null;
    return Math.round(amount * seconds * 1000);
}
// The key a step's nth timer is stored under.
export const timerKey = (step, index) => `${step}.${index}`;
export function newRun(checklist, now) {
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
const stepOf = (run, step) => run.steps[String(step)] ?? { done: false, doneAt: null, note: "" };
export function toggleDone(run, step, now) {
    const current = stepOf(run, step);
    return {
        ...run,
        steps: {
            ...run.steps,
            [String(step)]: { ...current, done: !current.done, doneAt: current.done ? null : now },
        },
    };
}
export function setNote(run, step, note) {
    return {
        ...run,
        steps: { ...run.steps, [String(step)]: { ...stepOf(run, step), note: note.slice(0, 2000) } },
    };
}
export const setRunNote = (run, note) => ({ ...run, note: note.slice(0, 4000) });
export const setScale = (run, scale) => ({ ...run, scale });
export const finishRun = (run, now) => ({
    ...run,
    finishedAt: run.finishedAt ?? now,
});
// Starts a timer, or resumes a paused one from where it stopped.
export function startTimer(run, key, ms, now) {
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
export function pauseTimer(run, key, now) {
    const current = run.timers[key];
    if (!current || current.state !== "running" || current.endsAt === null)
        return run;
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
export function resetTimer(run, key) {
    const { [key]: _gone, ...rest } = run.timers;
    return { ...run, timers: rest };
}
// Milliseconds left on a timer, or null when it has not been started.
export function timerRemaining(run, key, now) {
    const t = run.timers[key];
    if (!t)
        return null;
    if (t.state === "done")
        return 0;
    if (t.state === "paused")
        return t.remainingMs;
    return Math.max(0, (t.endsAt ?? now) - now);
}
// Marks every running timer whose time has come as done, and returns which rang so the page alerts once.
export function tickTimers(run, now) {
    const rang = [];
    const timers = { ...run.timers };
    for (const [key, t] of Object.entries(run.timers)) {
        if (t.state === "running" && t.endsAt !== null && t.endsAt <= now) {
            timers[key] = { ...t, state: "done", endsAt: null, remainingMs: 0 };
            rang.push(key);
        }
    }
    return rang.length === 0 ? { run, rang } : { run: { ...run, timers }, rang };
}
// "2:05", "1:30:00": a countdown as a person reads it at the bench, rounding up so 0:00 means done.
export const clock = (ms) => timecode(Math.ceil(Math.max(0, ms) / SEC) * SEC);
// How far along a run is, over the steps the checklist has (not the steps the run mentions).
export function runProgress(run, steps) {
    const done = steps.filter((n) => run.steps[String(n)]?.done).length;
    return { done, total: steps.length };
}
// The step one-at-a-time shows: the one the person chose, while it is still a step of the
// checklist; else the first not yet done; else the last, so a finished run still shows a step.
export function shownStep(run, keys, chosen) {
    if (chosen && keys.includes(chosen))
        return chosen;
    return keys.find((key) => !run.steps[key]?.done) ?? keys[keys.length - 1] ?? null;
}
// The step before or after `key`, or null at either end.
export function stepBeside(keys, key, by) {
    const at = keys.indexOf(key);
    return at === -1 ? null : (keys[at + by] ?? null);
}
export const when = (ms) => (ms === null ? "" : new Date(ms).toISOString());
// The saved record as a plain object: what a JSON download is. Only what the person entered or
// did, with the checklist's own identity so the record says which version it followed. `name`
// says what kind of record it is (a site's own, such as "example.com run").
export function runRecord(run, steps, name = "checklist run") {
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
// The same record as plain Markdown, for a notebook or an email: a heading, the run's facts, and
// each step as a checked or unchecked line with its note under it. `label` names what was run.
export function runMarkdown(run, steps, label = "Checklist") {
    const lines = [`# Run: ${run.title}`, ""];
    lines.push(`${label}: ${run.path}${run.version ? `, version ${run.version}` : ""}`);
    if (run.scale !== null)
        lines.push(`Scale: ${run.scale}`);
    lines.push(`Started: ${when(run.startedAt)}`);
    if (run.finishedAt !== null)
        lines.push(`Finished: ${when(run.finishedAt)}`);
    if (run.note.trim())
        lines.push("", run.note.trim());
    lines.push("", "## Steps", "");
    let section = "";
    for (const s of steps) {
        if ((s.section ?? "") !== section) {
            section = s.section ?? "";
            if (section)
                lines.push("", `### ${section}`, "");
        }
        const st = stepOf(run, s.key ?? s.number);
        lines.push(`- [${st.done ? "x" : " "}] ${s.number}. ${s.text.replace(/\s+/g, " ").trim()}${st.done && st.doneAt ? ` (${when(st.doneAt)})` : ""}`);
        if (st.note.trim())
            lines.push(`  - Note: ${st.note.trim().replace(/\n+/g, " ")}`);
    }
    return `${lines.join("\n")}\n`;
}
// Parses a stored run, or returns null: a value from another format, or one that is not a run, is
// ignored, never trusted. Only the shapes this module writes are accepted.
export function parseRun(raw) {
    if (typeof raw !== "string")
        return null;
    let value;
    try {
        value = JSON.parse(raw);
    }
    catch {
        return null;
    }
    if (!value || typeof value !== "object" || value.v !== RUN_VERSION)
        return null;
    // typeof null is "object", so a null `steps` must be refused by name.
    const plainObject = (x) => x !== null && typeof x === "object" && !Array.isArray(x);
    if (typeof value.path !== "string" ||
        typeof value.startedAt !== "number" ||
        !plainObject(value.steps) ||
        !plainObject(value.timers))
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
        steps: value.steps,
        timers: value.timers,
    };
}
