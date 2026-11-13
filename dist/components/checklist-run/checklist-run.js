// A checklist run's browser half: a page that is complete as served (a procedure, a recipe, a
// release list) gains, for a person who starts a run, a checklist over the steps it already has:
// a Done check, a note and the stored timers on each step, the critical steps kept marked, the
// scale changed in place, and a record that downloads or prints. The run lives in this browser
// only (localStorage), and says so when it cannot even do that.
//
// One step at a time (the cook view) is a presentation of the same run: only the step being worked
// shows, as a cue card (manual.css .cap-cue) in large type, and Previous and Next move through the
// steps. The screen is kept on while a run is open. The choice is remembered in this browser.
//
// The server stays the one place amounts are computed: a new scale is fetched as the page at that
// scale and every [data-run-swap] region is swapped in, matched by its name and its place, so
// nothing here knows a unit conversion. If that fetch fails the browser navigates to the scaled
// page, which is what the scale form does with no script. Extracted from dustinedwards.info's run
// mode (app/enhance/run.ts).
import { copyChildren, trustedHtml } from "../trusted-html/trusted-html.js";
import { clock, finishRun, newRun, parseRun, pauseTimer, resetTimer, runMarkdown, runProgress, runRecord, setNote, setRunNote, setScale, shownStep, startTimer, stepBeside, tickTimers, timerKey, timerMs, timerRemaining, toggleDone, } from "./checklist-run-model.js";
const DEFAULTS = {
    noun: "checklist",
    steps: "li[data-step]",
    stepText: "[data-run-text]",
    startSlot: "[data-run-start]",
    scaleForm: "form[data-run-scale]",
    markdownLabel: "Checklist",
    recordName: "checklist run",
};
// Makes `root` (with data-run-path, data-run-version and data-run-title) runnable. Returns a
// function that ends the run view and takes every added control away; the stored run stays.
export function start(root, options = {}) {
    const o = { ...DEFAULTS, ...options };
    const checklist = {
        path: root.dataset.runPath ?? location.pathname,
        version: root.dataset.runVersion ?? "",
        title: root.dataset.runTitle ?? document.title,
    };
    const KEY = o.storageKey ?? `cap.run:${checklist.path}`;
    const stepItems = Array.from(root.querySelectorAll(o.steps));
    if (stepItems.length === 0)
        throw new Error("checklist-run: this page has no steps to run");
    // A step is addressed by its own id, else its section and number: numbering restarts in a
    // section that starts its own list, so the number alone is not unique.
    const stepSection = (li) => li.closest("section[aria-labelledby]")?.getAttribute("aria-labelledby") ?? "";
    const keyOf = (li) => li.id || `${stepSection(li)}.${li.dataset.step}`;
    const stepKeys = stepItems.map(keyOf);
    const timerStep = new Map();
    const scaleForm = root.querySelector(o.scaleForm);
    const scaleField = scaleForm?.querySelector("input[name]") ?? null;
    let run = null;
    const VIEW_KEY = `${KEY}:view`;
    let oneAtATime = (() => {
        try {
            return localStorage.getItem(VIEW_KEY) === "step";
        }
        catch {
            return false;
        }
    })();
    let shownKey = null;
    let storageNote = "";
    let wakeLock = null;
    let audio = null;
    let ticker;
    const el = (tag, props = {}, ...kids) => {
        const node = document.createElement(tag);
        for (const [k, v] of Object.entries(props))
            node.setAttribute(k, v);
        node.append(...kids);
        return node;
    };
    const button = (label, variant, part, onClick) => {
        const b = el("button", { type: "button", class: "cap-btn", "data-variant": variant, "data-run": part }, label);
        b.addEventListener("click", onClick);
        return b;
    };
    const stepText = (li) => li.querySelector(o.stepText)?.textContent?.replace(/\s+/g, " ").trim() ?? "";
    const sectionTitle = (li) => {
        const id = li.closest("section[aria-labelledby]")?.getAttribute("aria-labelledby");
        return (id ? document.getElementById(id)?.textContent : "")?.replace(/\s+/g, " ").trim() ?? "";
    };
    const stepRecords = () => stepItems.map((li) => ({
        key: keyOf(li),
        number: Number(li.dataset.step),
        section: sectionTitle(li),
        text: stepText(li),
    }));
    const cannotSave = (error, why) => `This run cannot be saved on this device (${error instanceof Error ? error.message : why}). Download the record before you leave.`;
    // ------------------------------------------------------------ storage
    function load() {
        try {
            const stored = parseRun(localStorage.getItem(KEY));
            return stored && stored.path === checklist.path ? stored : null;
        }
        catch (error) {
            storageNote = cannotSave(error, "storage is blocked");
            return null;
        }
    }
    function save() {
        if (!run)
            return;
        try {
            localStorage.setItem(KEY, JSON.stringify(run));
            storageNote = "";
        }
        catch (error) {
            storageNote = cannotSave(error, "storage is full");
        }
        renderBar();
    }
    function update(next) {
        run = next;
        save();
    }
    function forget() {
        try {
            localStorage.removeItem(KEY);
        }
        catch {
            // Nothing was saved, so nothing to remove.
        }
        run = null;
        end();
    }
    // ------------------------------------------------------------ the bar and the live regions
    const live = el("div", { class: "cap-sr-only", role: "status", "aria-live": "polite" });
    const alertRegion = el("div", { class: "cap-sr-only", role: "alert" });
    const bar = el("section", { class: "cap-run-bar", "aria-label": "Run", hidden: "" });
    const startButton = el("button", { type: "button", class: "cap-btn cap-run-start", "data-variant": "primary" }, `Run this ${o.noun}`);
    const summary = el("section", {
        class: "cap-run-summary",
        "aria-labelledby": "cap-run-summary-h",
        hidden: "",
    });
    let startNote = null;
    function say(message) {
        live.textContent = "";
        window.setTimeout(() => (live.textContent = message), 30);
    }
    // The run's roll blocks (manual.css .cap-roll), one a step: filled for a step done, lit for the
    // step being worked, faint ahead. Drawn only: the progress line says it in words.
    function roll(lit) {
        const blocks = el("ol", { class: "cap-roll cap-run-roll", "aria-hidden": "true" });
        for (const li of stepItems) {
            const state = run?.steps[keyOf(li)]?.done ? "done" : li === lit ? "now" : "ahead";
            blocks.append(el("li", { "data-state": state }));
        }
        return blocks;
    }
    function renderBar() {
        if (!run)
            return;
        const { done, total } = runProgress(run, stepKeys);
        const current = stepItems.find((li) => !run?.steps[keyOf(li)]?.done);
        const toggle = button(oneAtATime ? "Show every step" : "One step at a time", "secondary", "view", () => setView(!oneAtATime));
        toggle.setAttribute("aria-pressed", String(oneAtATime));
        const finishButton = button("Finish run", "primary", "finish", finish);
        const stopButton = button("Stop", "secondary", "stop", stop);
        if (oneAtATime) {
            shownKey = shownStep(run, stepKeys, shownKey);
            const shown = stepItems[stepKeys.indexOf(shownKey ?? "")];
            const before = shownKey ? stepBeside(stepKeys, shownKey, -1) : null;
            const after = shownKey ? stepBeside(stepKeys, shownKey, 1) : null;
            const prev = button("Previous step", "secondary", "prev", () => before && showStep(before));
            const next = button("Next step", "secondary", "next", () => after && showStep(after));
            if (!before)
                prev.disabled = true;
            if (!after)
                next.disabled = true;
            bar.replaceChildren(el("p", { class: "cap-run-progress" }, `Step ${shown?.dataset.step ?? ""}, ${stepKeys.indexOf(shownKey ?? "") + 1} of ${total}; ${done} done`), roll(shown), prev, next, toggle, finishButton, stopButton);
        }
        else {
            bar.replaceChildren(el("p", { class: "cap-run-progress" }, `${done} of ${total} steps done`), roll(current), current
                ? button(`Go to step ${current.dataset.step}`, "primary", "go", () => focusStep(current))
                : el("span", { class: "cap-run-all" }, "Every step is done."), toggle, finishButton, stopButton);
        }
        applyView();
        if (storageNote)
            bar.append(el("p", { class: "cap-run-warning", role: "note" }, storageNote));
        for (const li of stepItems) {
            if (li === current)
                li.setAttribute("aria-current", "step");
            else
                li.removeAttribute("aria-current");
            li.classList.toggle("cap-run-step-done", run.steps[keyOf(li)]?.done === true);
        }
    }
    // One step at a time, or every step. The step shown alone is a cue card: a dark strip names the
    // checklist and the card over the step.
    function applyView() {
        if (oneAtATime && run)
            root.dataset.view = "step";
        else
            delete root.dataset.view;
        for (const li of stepItems) {
            const shown = oneAtATime && keyOf(li) === shownKey;
            li.classList.toggle("cap-run-step-shown", shown);
            li.classList.toggle("cap-cue", shown);
            li.querySelector(":scope > .cap-cue-strip")?.remove();
            if (shown)
                li.prepend(el("p", { class: "cap-cue-strip", "aria-hidden": "true" }, el("span", {}, checklist.title), el("span", {}, `Step ${li.dataset.step}, card ${stepKeys.indexOf(keyOf(li)) + 1} of ${stepKeys.length}`)));
        }
    }
    function setView(on) {
        oneAtATime = on;
        try {
            if (on)
                localStorage.setItem(VIEW_KEY, "step");
            else
                localStorage.removeItem(VIEW_KEY);
        }
        catch {
            // Not remembered on this device; the view still changes for this visit.
        }
        renderBar();
        const li = run
            ? stepItems[stepKeys.indexOf(shownStep(run, stepKeys, shownKey) ?? "")]
            : undefined;
        if (li)
            focusStep(li);
        say(on ? "One step at a time." : "Every step shown.");
    }
    function showStep(key) {
        shownKey = key;
        renderBar();
        const li = stepItems[stepKeys.indexOf(key)];
        if (li) {
            focusStep(li);
            say(`Step ${li.dataset.step}.`);
        }
    }
    function focusStep(li) {
        li.scrollIntoView({
            block: "center",
            behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
        });
        li.querySelector(".cap-run-done input")?.focus({ preventScroll: true });
    }
    // ------------------------------------------------------------ a step's tools
    function timerBox(li, step, index, timer) {
        const key = timerKey(keyOf(li), index);
        timerStep.set(key, String(step));
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
            if (!run)
                return;
            const t = run.timers[key];
            ensureAudio();
            if (t?.state === "running")
                update(pauseTimer(run, key, Date.now()));
            else if (t?.state === "done")
                update(startTimer(resetTimer(run, key), key, ms, Date.now()));
            else
                update(startTimer(run, key, ms, Date.now()));
            drawAllTimers();
            startTicker();
        });
        reset.addEventListener("click", () => {
            if (run)
                update(resetTimer(run, key));
            drawAllTimers();
        });
        box.append(clockEl, act, reset);
        box.draw();
        return box;
    }
    function drawAllTimers() {
        for (const box of root.querySelectorAll(".cap-run-timer"))
            box.draw?.();
    }
    function buildTools(li) {
        const step = Number(li.dataset.step);
        const key = keyOf(li);
        const timers = li.dataset.timers ? JSON.parse(li.dataset.timers) : [];
        const done = el("input", { type: "checkbox", id: `cap-run-done-${key}` });
        done.checked = run?.steps[key]?.done === true;
        done.addEventListener("change", () => {
            if (!run)
                return;
            update(toggleDone(run, key, Date.now()));
            say(done.checked ? `Step ${step} done.` : `Step ${step} not done.`);
        });
        const note = el("textarea", {
            class: "cap-input",
            rows: "2",
            id: `cap-run-note-${key}`,
            maxlength: "2000",
            "aria-label": `Note for step ${step}`,
        });
        note.value = run?.steps[key]?.note ?? "";
        let pending;
        note.addEventListener("input", () => {
            window.clearTimeout(pending);
            pending = window.setTimeout(() => run && update(setNote(run, key, note.value)), 400);
        });
        note.addEventListener("blur", () => {
            window.clearTimeout(pending);
            if (run)
                update(setNote(run, key, note.value));
        });
        const tools = el("div", { class: "cap-run-tools" }, el("label", { class: "cap-run-done", for: done.id }, done, el("span", {}, `Step ${step} done`)), ...timers.map((t, i) => timerBox(li, step, i, t)), el("details", { class: "cap-run-note" }, el("summary", {}, note.value.trim() ? "Note (written)" : "Add a note"), note));
        const text = li.querySelector(o.stepText);
        if (text)
            text.after(tools);
        else
            li.append(tools);
    }
    function removeTools() {
        for (const tools of root.querySelectorAll(".cap-run-tools"))
            tools.remove();
        for (const li of stepItems) {
            li.removeAttribute("aria-current");
            li.classList.remove("cap-run-step-done");
        }
    }
    // ------------------------------------------------------------ timers ring
    function ensureAudio() {
        try {
            audio ??= new AudioContext();
            if (audio.state === "suspended")
                void audio.resume();
        }
        catch {
            audio = null;
        }
    }
    function beep() {
        if (!audio)
            return;
        const osc = audio.createOscillator();
        const gain = audio.createGain();
        gain.gain.value = 0.15;
        osc.frequency.value = 880;
        osc.connect(gain).connect(audio.destination);
        osc.start();
        osc.stop(audio.currentTime + 0.35);
    }
    function tick() {
        if (!run)
            return;
        const { run: next, rang } = tickTimers(run, Date.now());
        if (rang.length > 0) {
            update(next);
            for (const key of rang) {
                const step = timerStep.get(key) ?? "";
                alertRegion.textContent = `The timer for step ${step} has finished.`;
                document.title = `Timer done, step ${step}: ${checklist.title}`;
                navigator.vibrate?.([220, 100, 220]);
                beep();
            }
        }
        drawAllTimers();
        if (!Object.values(run.timers).some((t) => t.state === "running")) {
            window.clearInterval(ticker);
            ticker = undefined;
        }
    }
    function startTicker() {
        if (ticker === undefined)
            ticker = window.setInterval(tick, 500);
    }
    // ------------------------------------------------------------ the screen stays on
    async function keepAwake() {
        try {
            wakeLock = (await navigator.wakeLock?.request("screen")) ?? null;
        }
        catch {
            // Not every browser lets a page hold the screen. Said, not hidden.
            wakeLock = null;
            bar.append(el("p", { class: "cap-run-warning", role: "note" }, "This browser would not keep the screen on; it may sleep between steps."));
        }
    }
    async function letSleep() {
        try {
            await wakeLock?.release();
        }
        catch {
            // Already released by the browser.
        }
        wakeLock = null;
    }
    const onVisible = () => {
        if (document.visibilityState === "visible" && run && !run.finishedAt) {
            void keepAwake();
            tick();
        }
    };
    document.addEventListener("visibilitychange", onVisible);
    // ------------------------------------------------------------ the scale, changed in place
    async function applyScale(href, focus = false) {
        try {
            const res = await fetch(href, {
                headers: { Accept: "text/html" },
                credentials: "same-origin",
            });
            if (!res.ok)
                throw new Error(`checklist-run: ${href} answered ${res.status}`);
            const doc = new DOMParser().parseFromString(trustedHtml(await res.text()), "text/html");
            // The same checklist on the fetched page: its [data-run-path] root, else its body.
            const next = doc.querySelector(`[data-run-path="${CSS.escape(checklist.path)}"]`) ??
                doc.body;
            const theirs = new Map();
            for (const region of next.querySelectorAll("[data-run-swap]")) {
                const name = region.getAttribute("data-run-swap") ?? "";
                theirs.set(name, [...(theirs.get(name) ?? []), region]);
            }
            const seen = new Map();
            for (const region of root.querySelectorAll("[data-run-swap]")) {
                const name = region.getAttribute("data-run-swap") ?? "";
                const at = seen.get(name) ?? 0;
                seen.set(name, at + 1);
                const match = theirs.get(name)?.[at];
                if (match)
                    copyChildren(region, match);
            }
            const nextField = scaleField
                ? next.querySelector(`input[name="${CSS.escape(scaleField.name)}"]`)
                : null;
            if (nextField && scaleField)
                scaleField.value = nextField.defaultValue;
            history.replaceState(history.state, "", href);
            if (run && nextField)
                update(setScale(run, Number(nextField.defaultValue)));
            if (focus)
                say(`Amounts now for ${nextField?.defaultValue ?? "the new scale"}.`);
        }
        catch (error) {
            console.error(error);
            location.assign(href);
        }
    }
    const onScale = (e) => {
        if (!run || !scaleField || !scaleForm)
            return;
        e.preventDefault();
        // Every field of the form, as its GET would send them.
        const url = new URL(scaleForm.action, location.href);
        for (const [name, value] of new FormData(scaleForm))
            if (typeof value === "string" && value !== "")
                url.searchParams.set(name, value);
        void applyScale(`${url.pathname}${url.search}`, true);
    };
    scaleForm?.addEventListener("submit", onScale);
    // ------------------------------------------------------------ start, finish, stop
    function begin(existing) {
        run =
            existing ??
                newRun({ ...checklist, scale: scaleField ? Number(scaleField.value) : null }, Date.now());
        root.dataset.run = "on";
        startButton.hidden = true;
        startNote?.remove();
        bar.hidden = false;
        summary.hidden = true;
        removeTools();
        for (const li of stepItems)
            buildTools(li);
        save();
        renderBar();
        drawAllTimers();
        if (Object.values(run.timers).some((t) => t.state === "running"))
            startTicker();
        void keepAwake();
        say(existing ? "Run resumed." : "Run started.");
        const stored = run.scale;
        if (stored !== null && scaleField && Number(scaleField.value) !== stored && scaleForm) {
            const url = new URL(scaleForm.action, location.href);
            url.searchParams.set(scaleField.name, String(stored));
            void applyScale(`${url.pathname}${url.search}`);
        }
    }
    function stop() {
        if (bar.querySelector(".cap-run-confirm"))
            return;
        const confirmRow = el("p", { class: "cap-run-confirm", role: "alert" }, "Discard this run and its notes? ", button("Discard it", "danger", "discard", forget), button("Keep going", "secondary", "keep", () => confirmRow.remove()));
        bar.append(confirmRow);
    }
    function end() {
        window.clearInterval(ticker);
        ticker = undefined;
        void letSleep();
        removeTools();
        delete root.dataset.run;
        delete root.dataset.view;
        shownKey = null;
        for (const li of stepItems) {
            li.classList.remove("cap-run-step-shown", "cap-cue");
            li.querySelector(":scope > .cap-cue-strip")?.remove();
        }
        bar.hidden = true;
        summary.hidden = true;
        startButton.hidden = false;
        startButton.textContent = `Run this ${o.noun}`;
    }
    function download(name, text, type) {
        const url = URL.createObjectURL(new Blob([text], { type }));
        const a = el("a", { href: url, download: name });
        document.body.append(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
    }
    function finish() {
        if (!run)
            return;
        update(finishRun(run, Date.now()));
        void letSleep();
        const current = run;
        const slug = checklist.path.split("/").filter(Boolean).pop() ?? "run";
        const stamp = new Date(current.finishedAt ?? Date.now()).toISOString().slice(0, 10);
        const runNote = el("textarea", {
            class: "cap-input",
            rows: "3",
            id: "cap-run-summary-note",
            maxlength: "4000",
        });
        runNote.value = current.note;
        runNote.addEventListener("input", () => run && update(setRunNote(run, runNote.value)));
        const { done, total } = runProgress(current, stepKeys);
        const record = () => run &&
            (o.toRecord
                ? o.toRecord(run, stepRecords(), location.origin)
                : runRecord(run, stepRecords(), o.recordName));
        summary.replaceChildren(el("h2", { id: "cap-run-summary-h" }, "Run record"), el("p", {}, `${done} of ${total} steps done${current.scale !== null ? `, at scale ${current.scale}` : ""}. Saved on this device only; nothing was sent anywhere.`), el("label", { for: runNote.id }, "Note on the whole run"), runNote, el("p", { class: "cap-run-actions" }, button("Download as text", "secondary", "download", () => run &&
            download(`${slug}-${stamp}.md`, runMarkdown(run, stepRecords(), o.markdownLabel), "text/markdown")), button("Download as JSON", "secondary", "download", () => run &&
            download(`${slug}-${stamp}.json`, `${JSON.stringify(record(), null, 2)}\n`, "application/json")), button("Print", "secondary", "print", () => window.print()), button("Start over", "quiet", "again", forget)));
        summary.hidden = false;
        summary.scrollIntoView({ block: "start" });
        say("Run finished. The record is ready to download or print.");
    }
    // ------------------------------------------------------------ mount
    startButton.addEventListener("click", () => begin(load()));
    (root.querySelector(o.startSlot) ?? root).append(startButton);
    root.before(live, alertRegion);
    root.after(bar, summary);
    root.dataset.capReady = "";
    const existing = load();
    if (existing && !existing.finishedAt) {
        const { done, total } = runProgress(existing, stepKeys);
        startButton.textContent = `Resume your run (${done} of ${total} done)`;
    }
    else if (storageNote) {
        startNote = el("span", { class: "cap-run-warning", role: "note" }, storageNote);
        startButton.after(startNote);
    }
    return () => {
        end();
        document.removeEventListener("visibilitychange", onVisible);
        scaleForm?.removeEventListener("submit", onScale);
        for (const node of [live, alertRegion, bar, summary, startButton, startNote])
            node?.remove();
        delete root.dataset.capReady;
    };
}
// Starts every [data-cap="checklist-run"] in `scope`, its noun from data-run-noun.
export function enhance(scope = document, options = {}) {
    const off = [];
    for (const root of scope.querySelectorAll('[data-cap="checklist-run"]:not([data-cap-ready])'))
        off.push(start(root, { noun: root.dataset.runNoun, ...options }));
    return () => off.forEach((f) => f());
}
