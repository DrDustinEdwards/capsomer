// A checklist run's browser half: a served page gains a Done check, note and timers per step, a scale change in place, and a
// record that downloads or prints. The run lives in this browser only (localStorage). The server stays the one place amounts are
// computed: a new scale is fetched as that page and every [data-run-swap] region swapped in; if the fetch fails the browser navigates.

import { confirm } from "../confirm-dialog/confirm-dialog.ts";
import { readStored, uid, writeStored } from "../hooks/hooks.ts";
import { copyChildren, inertDocument } from "../trusted-html/trusted-html.ts";
import {
  finishRun,
  newRun,
  parseRun,
  runMarkdown,
  runProgress,
  runRecord,
  setScale,
  shownStep,
  stepBeside,
  tickTimers,
  type Run,
  type StepInfo,
} from "./checklist-run-model.ts";
import { reducedMotion } from "../hooks/hooks.ts";
import { beeper, button, el, screenLock } from "./checklist-run-dom.ts";
import {
  applyView,
  buildTools,
  drawAllTimers,
  drawSummary,
  roll,
  stepRecordsOf,
  type RunHost,
} from "./checklist-run-tools.ts";

export interface RunOptions {
  noun?: string;
  // The localStorage key the run is kept under. Default `cap.run:<path>`. A site that already has
  // runs saved keeps its own key so they survive.
  storageKey?: string;
  steps?: string;
  stepText?: string;
  startSlot?: string;
  scaleForm?: string;
  markdownLabel?: string;
  recordName?: string;
  toRecord?: (run: Run, steps: StepInfo[], origin: string) => unknown;
}

const DEFAULTS = {
  noun: "checklist",
  steps: "li[data-step]",
  stepText: "[data-run-text]",
  startSlot: "[data-run-start]",
  scaleForm: "form[data-run-scale]",
  markdownLabel: "Checklist",
  recordName: "checklist run",
};

// Makes `root` (data-run-path, data-run-version, data-run-title) runnable. Returns a function that ends the run view; the stored run stays.
export function start(root: HTMLElement, options: RunOptions = {}): () => void {
  const o = { ...DEFAULTS, ...options };
  const checklist = {
    path: root.dataset.runPath ?? location.pathname,
    version: root.dataset.runVersion ?? "",
    title: root.dataset.runTitle ?? document.title,
  };
  const KEY = o.storageKey ?? `cap.run:${checklist.path}`;
  const stepItems = Array.from(root.querySelectorAll<HTMLElement>(o.steps));
  if (stepItems.length === 0) throw new Error("checklist-run: this page has no steps to run");
  // A step is addressed by its own id, else its section and number (numbering restarts per list).
  const stepSection = (li: HTMLElement) =>
    li.closest("section[aria-labelledby]")?.getAttribute("aria-labelledby") ?? "";
  const keyOf = (li: HTMLElement) => li.id || `${stepSection(li)}.${li.dataset.step}`;
  const stepKeys = stepItems.map(keyOf);
  const timerStep = new Map<string, string>();
  const scaleForm = root.querySelector<HTMLFormElement>(o.scaleForm);
  const scaleField = scaleForm?.querySelector<HTMLInputElement>("input[name]") ?? null;

  let run: Run | null = null;
  const VIEW_KEY = `${KEY}:view`;
  let oneAtATime = readStored(VIEW_KEY) === "step";
  let shownKey: string | null = null;
  let storageNote = "";
  let ticker: number | undefined;

  const stepRecords = () => stepRecordsOf(stepItems, o.stepText, keyOf);
  const cannotSave = (error: unknown, why: string) =>
    `This run cannot be saved on this device (${error instanceof Error ? error.message : why}). Download the record before you leave.`;

  function load(): Run | null {
    try {
      const stored = parseRun(localStorage.getItem(KEY));
      return stored && stored.path === checklist.path ? stored : null;
    } catch (error) {
      storageNote = cannotSave(error, "storage is blocked");
      return null;
    }
  }

  function save() {
    if (!run) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(run));
      storageNote = "";
    } catch (error) {
      storageNote = cannotSave(error, "storage is full");
    }
    renderBar();
  }

  function update(next: Run) {
    run = next;
    save();
  }

  function forget() {
    try {
      localStorage.removeItem(KEY);
    } catch {}
    run = null;
    end();
  }

  const live = el("div", { class: "cap-sr-only", role: "status", "aria-live": "polite" });
  const alertRegion = el("div", { class: "cap-sr-only", role: "alert" });
  const bar = el("section", { class: "cap-run-bar", "aria-label": "Run", hidden: "" });
  const sound = beeper();
  const awake = screenLock(() =>
    bar.append(
      el(
        "p",
        { class: "cap-run-warning", role: "note" },
        "This browser would not keep the screen on; it may sleep between steps.",
      ),
    ),
  );
  const startButton = el(
    "button",
    { type: "button", class: "cap-btn cap-run-start", "data-variant": "primary" },
    `Run this ${o.noun}`,
  );
  const summaryHeadingId = uid("cap-run-summary-h");
  const summaryNoteId = uid("cap-run-summary-note");
  const summary = el("section", {
    class: "cap-run-summary",
    "aria-labelledby": summaryHeadingId,
    hidden: "",
  });
  let startNote: HTMLElement | null = null;

  function say(message: string) {
    live.textContent = "";
    window.setTimeout(() => (live.textContent = message), 30);
  }

  function renderBar() {
    if (!run) return;
    const { done, total } = runProgress(run, stepKeys);
    const current = stepItems.find((li) => !run?.steps[keyOf(li)]?.done);
    const toggle = button(
      oneAtATime ? "Show every step" : "One step at a time",
      "secondary",
      "view",
      () => setView(!oneAtATime),
    );
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
      if (!before) prev.disabled = true;
      if (!after) next.disabled = true;
      bar.replaceChildren(
        el(
          "p",
          { class: "cap-run-progress" },
          `Step ${shown?.dataset.step ?? ""}, ${stepKeys.indexOf(shownKey ?? "") + 1} of ${total}; ${done} done`,
        ),
        roll(host, stepItems, shown),
        prev,
        next,
        toggle,
        finishButton,
        stopButton,
      );
    } else {
      bar.replaceChildren(
        el("p", { class: "cap-run-progress" }, `${done} of ${total} steps done`),
        roll(host, stepItems, current),
        current
          ? button(`Go to step ${current.dataset.step}`, "primary", "go", () => focusStep(current))
          : el("span", { class: "cap-run-all" }, "Every step is done."),
        toggle,
        finishButton,
        stopButton,
      );
    }
    applyView(root, host, stepItems, stepKeys, checklist.title, oneAtATime, shownKey);
    if (storageNote) bar.append(el("p", { class: "cap-run-warning", role: "note" }, storageNote));
    for (const li of stepItems) {
      if (li === current) li.setAttribute("aria-current", "step");
      else li.removeAttribute("aria-current");
      li.classList.toggle("cap-run-step-done", run.steps[keyOf(li)]?.done === true);
    }
  }

  function setView(on: boolean) {
    oneAtATime = on;
    writeStored(VIEW_KEY, on ? "step" : null);
    renderBar();
    const li = run
      ? stepItems[stepKeys.indexOf(shownStep(run, stepKeys, shownKey) ?? "")]
      : undefined;
    if (li) focusStep(li);
    say(on ? "One step at a time." : "Every step shown.");
  }

  function showStep(key: string) {
    shownKey = key;
    renderBar();
    const li = stepItems[stepKeys.indexOf(key)];
    if (li) {
      focusStep(li);
      say(`Step ${li.dataset.step}.`);
    }
  }

  function focusStep(li: HTMLElement) {
    li.scrollIntoView({
      block: "center",
      behavior: reducedMotion() ? "auto" : "smooth",
    });
    li.querySelector<HTMLElement>(".cap-run-done input")?.focus({ preventScroll: true });
  }

  const flushes: Array<() => void> = [];
  const drawAll = () => drawAllTimers(root);
  const host: RunHost = {
    stepText: o.stepText,
    run: () => run,
    update,
    say,
    keyOf,
    timerStep,
    flushes,
    sound,
    redraw: drawAll,
    startTicker,
  };

  function removeTools() {
    for (const tools of root.querySelectorAll(".cap-run-tools")) tools.remove();
    for (const li of stepItems) {
      li.removeAttribute("aria-current");
      li.classList.remove("cap-run-step-done");
    }
  }

  function tick() {
    if (!run) return;
    const { run: next, rang } = tickTimers(run, Date.now());
    if (rang.length > 0) {
      update(next);
      for (const key of rang) {
        const step = timerStep.get(key) ?? "";
        alertRegion.textContent = `The timer for step ${step} has finished.`;
        document.title = `Timer done, step ${step}: ${checklist.title}`;
        navigator.vibrate?.([220, 100, 220]);
        sound.beep();
      }
    }
    drawAll();
    if (!Object.values(run.timers).some((t) => t.state === "running")) {
      window.clearInterval(ticker);
      ticker = undefined;
    }
  }

  function startTicker() {
    if (ticker === undefined) ticker = window.setInterval(tick, 500);
  }

  const onVisible = () => {
    if (document.visibilityState === "visible" && run && !run.finishedAt) {
      void awake.hold();
      tick();
    }
  };
  document.addEventListener("visibilitychange", onVisible);

  async function applyScale(href: string, focus = false) {
    try {
      const res = await fetch(href, {
        headers: { Accept: "text/html" },
        credentials: "same-origin",
      });
      if (!res.ok) throw new Error(`checklist-run: ${href} answered ${res.status}`);
      const doc = inertDocument(await res.text());
      // The same checklist on the fetched page: its [data-run-path] root, else its body.
      const next =
        doc.querySelector<HTMLElement>(`[data-run-path="${CSS.escape(checklist.path)}"]`) ??
        doc.body;
      const theirs = new Map<string, Element[]>();
      for (const region of next.querySelectorAll("[data-run-swap]")) {
        const name = region.getAttribute("data-run-swap") ?? "";
        theirs.set(name, [...(theirs.get(name) ?? []), region]);
      }
      const seen = new Map<string, number>();
      for (const region of root.querySelectorAll("[data-run-swap]")) {
        const name = region.getAttribute("data-run-swap") ?? "";
        const at = seen.get(name) ?? 0;
        seen.set(name, at + 1);
        const match = theirs.get(name)?.[at];
        if (match) copyChildren(region, match);
      }
      const nextField = scaleField
        ? next.querySelector<HTMLInputElement>(`input[name="${CSS.escape(scaleField.name)}"]`)
        : null;
      if (nextField && scaleField) scaleField.value = nextField.defaultValue;
      history.replaceState(history.state, "", href);
      if (run && nextField) update(setScale(run, Number(nextField.defaultValue)));
      if (focus) say(`Amounts now for ${nextField?.defaultValue ?? "the new scale"}.`);
    } catch (error) {
      console.error(error);
      location.assign(href);
    }
  }

  const onScale = (e: SubmitEvent) => {
    if (!run || !scaleField || !scaleForm) return;
    e.preventDefault();
    const url = new URL(scaleForm.action, location.href);
    for (const [name, value] of new FormData(scaleForm))
      if (typeof value === "string" && value !== "") url.searchParams.set(name, value);
    void applyScale(`${url.pathname}${url.search}`, true);
  };
  scaleForm?.addEventListener("submit", onScale);

  function begin(existing: Run | null) {
    run =
      existing ??
      newRun({ ...checklist, scale: scaleField ? Number(scaleField.value) : null }, Date.now());
    root.dataset.run = "on";
    startButton.hidden = true;
    startNote?.remove();
    bar.hidden = false;
    summary.hidden = true;
    removeTools();
    for (const li of stepItems) buildTools(host, li);
    save();
    renderBar();
    drawAll();
    if (Object.values(run.timers).some((t) => t.state === "running")) startTicker();
    void awake.hold();
    say(existing ? "Run resumed." : "Run started.");
    const stored = run.scale;
    if (stored !== null && scaleField && Number(scaleField.value) !== stored && scaleForm) {
      const url = new URL(scaleForm.action, location.href);
      url.searchParams.set(scaleField.name, String(stored));
      void applyScale(`${url.pathname}${url.search}`);
    }
  }

  // One-way, so it asks in the confirm dialog, focus on Cancel (DEFAULTS.md, one-way actions).
  function stop() {
    void confirm({
      title: "Discard this run?",
      body: ["Its checks, notes and timers are removed from this device."],
      action: "Discard it",
      cancelLabel: "Keep going",
      returnTo: startButton,
      perform: async () => forget(),
    });
  }

  function end() {
    window.clearInterval(ticker);
    ticker = undefined;
    void awake.release();
    for (const flush of flushes.splice(0)) flush();
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

  function finish() {
    if (!run) return;
    update(finishRun(run, Date.now()));
    void awake.release();
    drawSummary(summary, { headingId: summaryHeadingId, noteId: summaryNoteId }, host, {
      path: checklist.path,
      stepKeys,
      stepRecords,
      forget,
      record: (r) =>
        o.toRecord
          ? o.toRecord(r, stepRecords(), location.origin)
          : runRecord(r, stepRecords(), o.recordName),
      markdown: (r) => runMarkdown(r, stepRecords(), o.markdownLabel),
    });
    summary.hidden = false;
    summary.scrollIntoView({ block: "start" });
    say("Run finished. The record is ready to download or print.");
  }

  startButton.addEventListener("click", () => begin(load()));
  (root.querySelector(o.startSlot) ?? root).append(startButton);
  root.before(live, alertRegion);
  root.after(bar, summary);
  root.dataset.capReady = "";

  const existing = load();
  if (existing && !existing.finishedAt) {
    const { done, total } = runProgress(existing, stepKeys);
    startButton.textContent = `Resume your run (${done} of ${total} done)`;
  } else if (storageNote) {
    startNote = el("span", { class: "cap-run-warning", role: "note" }, storageNote);
    startButton.after(startNote);
  }

  return () => {
    end();
    document.removeEventListener("visibilitychange", onVisible);
    scaleForm?.removeEventListener("submit", onScale);
    for (const node of [live, alertRegion, bar, summary, startButton, startNote]) node?.remove();
    delete root.dataset.capReady;
  };
}

export function enhance(scope: ParentNode = document, options: RunOptions = {}): () => void {
  const off: Array<() => void> = [];
  for (const root of scope.querySelectorAll<HTMLElement>(
    '[data-cap="checklist-run"]:not([data-cap-ready])',
  ))
    off.push(
      start(root, {
        ...(root.dataset.runNoun === undefined ? {} : { noun: root.dataset.runNoun }),
        ...options,
      }),
    );
  return () => off.forEach((f) => f());
}
