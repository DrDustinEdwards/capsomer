// A step's tools in a run: its done box, its note and its timers (checklist-run.ts owns the run and gives each of
// these the host it works through).
import { button, download, el } from "./checklist-run-dom.js";
import { clock, pauseTimer, runProgress, resetTimer, setNote, setRunNote, startTimer, timerKey, timerMs, timerRemaining, toggleDone, } from "./checklist-run-model.js";
function timerBox(host, li, step, index, timer) {
    const key = timerKey(host.keyOf(li), index);
    host.timerStep.set(key, String(step));
    const ms = timerMs(timer);
    const box = el("div", { class: "cap-run-timer", "data-timer": key });
    if (ms === null) {
        box.append(el("span", {}, `${timer.text} (not a timer this page can run)`));
        return box;
    }
    const clockEl = el("span", { class: "cap-run-clock", role: "timer" }, "");
    const act = el("button", {
        type: "button",
        class: "cap-btn",
        "data-variant": "secondary",
        "data-run": "timer",
    });
    const reset = el("button", { type: "button", class: "cap-btn", "data-variant": "quiet", "data-run": "reset" }, "Reset");
    const label = timer.label ? `${timer.label}, ${timer.text}` : timer.text;
    box.draw = () => {
        const run = host.run();
        if (!run)
            return;
        const t = run.timers[key];
        const remaining = timerRemaining(run, key, Date.now());
        box.dataset.state = t?.state ?? "idle";
        clockEl.textContent = clock(remaining ?? ms);
        // The visible words begin the name (WCAG 2.5.3); the step it belongs to follows, unseen.
        act.replaceChildren(!t
            ? `Start ${label}`
            : t.state === "running"
                ? "Pause"
                : t.state === "paused"
                    ? "Resume"
                    : "Done: start again", el("span", { class: "cap-sr-only" }, `(step ${step})`));
        reset.hidden = !t;
    };
    act.addEventListener("click", () => {
        const run = host.run();
        if (!run)
            return;
        const t = run.timers[key];
        host.sound.ensure();
        if (t?.state === "running")
            host.update(pauseTimer(run, key, Date.now()));
        else if (t?.state === "done")
            host.update(startTimer(resetTimer(run, key), key, ms, Date.now()));
        else
            host.update(startTimer(run, key, ms, Date.now()));
        host.redraw();
        host.startTicker();
    });
    reset.addEventListener("click", () => {
        const run = host.run();
        if (run)
            host.update(resetTimer(run, key));
        host.redraw();
    });
    box.append(clockEl, act, reset);
    box.draw();
    return box;
}
export function drawAllTimers(root) {
    for (const box of root.querySelectorAll(".cap-run-timer"))
        box.draw?.();
}
export function buildTools(host, li) {
    const step = Number(li.dataset.step);
    const key = host.keyOf(li);
    const timers = li.dataset.timers ? JSON.parse(li.dataset.timers) : [];
    const done = el("input", { type: "checkbox", id: `cap-run-done-${key}` });
    done.checked = host.run()?.steps[key]?.done === true;
    done.addEventListener("change", () => {
        const run = host.run();
        if (!run)
            return;
        host.update(toggleDone(run, key, Date.now()));
        host.say(done.checked ? `Step ${step} done.` : `Step ${step} not done.`);
    });
    const note = el("textarea", {
        class: "cap-input",
        rows: "2",
        id: `cap-run-note-${key}`,
        maxlength: "2000",
        "aria-label": `Note for step ${step}`,
    });
    note.value = host.run()?.steps[key]?.note ?? "";
    let pending;
    const flush = () => {
        window.clearTimeout(pending);
        const run = host.run();
        if (run)
            host.update(setNote(run, key, note.value));
    };
    host.flushes.push(flush);
    note.addEventListener("input", () => {
        window.clearTimeout(pending);
        pending = window.setTimeout(flush, 400);
    });
    note.addEventListener("blur", flush);
    const tools = el("div", { class: "cap-run-tools" }, el("label", { class: "cap-run-done", for: done.id }, done, el("span", {}, `Step ${step} done`)), ...timers.map((t, i) => timerBox(host, li, step, i, t)), el("details", { class: "cap-run-note" }, el("summary", {}, note.value.trim() ? "Note (written)" : "Add a note"), note));
    const text = li.querySelector(host.stepText);
    if (text)
        text.after(tools);
    else
        li.append(tools);
}
/** A step's record in the run's files: its key, number, section's title and words. */
export function stepRecordsOf(items, textSelector, keyOf) {
    const clean = (text) => text?.replace(/\s+/g, " ").trim() ?? "";
    return items.map((li) => {
        const id = li.closest("section[aria-labelledby]")?.getAttribute("aria-labelledby");
        return {
            key: keyOf(li),
            number: Number(li.dataset.step),
            section: clean(id ? document.getElementById(id)?.textContent : ""),
            text: clean(li.querySelector(textSelector)?.textContent),
        };
    });
}
export function roll(host, items, lit) {
    const blocks = el("ol", { class: "cap-roll cap-run-roll", "aria-hidden": "true" });
    for (const li of items) {
        const state = host.run()?.steps[host.keyOf(li)]?.done ? "done" : li === lit ? "now" : "ahead";
        blocks.append(el("li", { "data-state": state }));
    }
    return blocks;
}
// One step at a time, or every step; a step shown alone is a cue card under a strip naming the checklist.
export function applyView(root, host, items, keys, title, oneAtATime, shownKey) {
    if (oneAtATime && host.run())
        root.dataset.view = "step";
    else
        delete root.dataset.view;
    for (const li of items) {
        const shown = oneAtATime && host.keyOf(li) === shownKey;
        li.classList.toggle("cap-run-step-shown", shown);
        li.classList.toggle("cap-cue", shown);
        li.querySelector(":scope > .cap-cue-strip")?.remove();
        if (shown)
            li.prepend(el("p", { class: "cap-cue-strip", "aria-hidden": "true" }, el("span", {}, title), el("span", {}, `Step ${li.dataset.step}, card ${keys.indexOf(host.keyOf(li)) + 1} of ${keys.length}`)));
    }
}
/** The run record at the end: a count, a note on the whole run, the downloads, Print and Start over. */
export function drawSummary(summary, ids, host, p) {
    const current = host.run();
    if (!current)
        return;
    const slug = p.path.split("/").filter(Boolean).pop() ?? "run";
    const stamp = new Date(current.finishedAt ?? Date.now()).toISOString().slice(0, 10);
    const runNote = el("textarea", {
        class: "cap-input",
        rows: "3",
        id: ids.noteId,
        maxlength: "4000",
    });
    runNote.value = current.note;
    runNote.addEventListener("input", () => {
        const run = host.run();
        if (run)
            host.update(setRunNote(run, runNote.value));
    });
    const { done, total } = runProgress(current, p.stepKeys);
    const save = (name, type, text) => () => {
        const run = host.run();
        if (run)
            download(`${slug}-${stamp}.${name}`, text(run), type);
    };
    summary.replaceChildren(el("h2", { id: ids.headingId }, "Run record"), el("p", {}, `${done} of ${total} steps done${current.scale !== null ? `, at scale ${current.scale}` : ""}. Saved on this device only; nothing was sent anywhere.`), el("label", { for: runNote.id }, "Note on the whole run"), runNote, el("p", { class: "cap-run-actions" }, button("Download as text", "secondary", "download", save("md", "text/markdown", p.markdown)), button("Download as JSON", "secondary", "download", save("json", "application/json", (run) => `${JSON.stringify(p.record(run), null, 2)}\n`)), button("Print", "secondary", "print", () => window.print()), button("Start over", "quiet", "again", p.forget)));
}
