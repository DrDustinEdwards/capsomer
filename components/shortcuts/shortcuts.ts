// The keyboard shortcut registry and the "?" sheet that lists it. One document keydown
// listener for the whole app. Single-key shortcuts (a letter, "?", a sequence like "g o")
// can be switched off and the choice is remembered (WCAG 2.1.4); shortcuts with Ctrl, Cmd
// or Alt always work. No framework; the React wrapper uses the same registry.
import { readPref, writePref } from "../shell/shell.ts";
import { isBackdropClick, rememberOpener, returnFocus, uid } from "../confirm-dialog/confirm-dialog.ts";

export interface Shortcut {
  // "r", "?", "g o" (a sequence: g, then o within 1200 ms), "Mod+k" (Ctrl, or Cmd on a
  // Mac), "Ctrl+Enter", "Alt+n". An array gives one command several keys.
  key: string | string[];
  label: string;
  group: string;
  run: (e: KeyboardEvent) => void;
  // Runs only while this returns true.
  when?: () => boolean;
}

export const SINGLE_KEYS_PREF = "cap-single-keys";
export const SEQUENCE_MS = 1200;

const entries: Shortcut[] = [];
let installed = false;
let singleOverride: boolean | null = null;
let pending: { step: string; at: number } | null = null;
let sheetOpener: () => void = () => openShortcutSheet();

interface Combo {
  key: string;
  ctrl: boolean;
  meta: boolean;
  alt: boolean;
  mod: boolean;
}

export function isMac(): boolean {
  return typeof navigator !== "undefined" && /Mac|iPhone|iPad|iPod/.test(navigator.userAgent);
}

function parseStep(step: string): Combo {
  if (step.length === 1) return { key: step, ctrl: false, meta: false, alt: false, mod: false };
  const parts = step.split("+");
  let key = parts.pop() ?? "";
  if (key === "") key = "+";
  const mods = parts.map((m) => m.toLowerCase());
  return {
    key,
    ctrl: mods.includes("ctrl") || mods.includes("control"),
    meta: mods.includes("meta") || mods.includes("cmd"),
    alt: mods.includes("alt") || mods.includes("option"),
    mod: mods.includes("mod"),
  };
}

const specsOf = (s: Shortcut): string[] => (Array.isArray(s.key) ? s.key : [s.key]);
const stepsOf = (spec: string): string[] => spec.trim().split(/\s+/);

// A single-key shortcut is one a person can press by accident while typing or speaking:
// no Ctrl, Cmd or Alt in any step.
export function isSingleKey(spec: string): boolean {
  return stepsOf(spec).every((step) => {
    const c = parseStep(step);
    return !c.ctrl && !c.meta && !c.alt && !c.mod;
  });
}

function matchesStep(step: string, e: KeyboardEvent): boolean {
  const c = parseStep(step);
  const mac = isMac();
  const ctrl = c.ctrl || (c.mod && !mac);
  const meta = c.meta || (c.mod && mac);
  if (e.ctrlKey !== ctrl || e.metaKey !== meta || e.altKey !== c.alt) return false;
  if (!ctrl && !meta && !c.alt) return e.key === c.key;
  // With a modifier, case does not matter, and Alt's altered characters are read by code.
  if (e.key.toLowerCase() === c.key.toLowerCase()) return true;
  return /^[a-z]$/i.test(c.key) && e.code === `Key${c.key.toUpperCase()}`;
}

export function singleKeysOn(): boolean {
  if (singleOverride !== null) return singleOverride;
  return readPref(SINGLE_KEYS_PREF) !== "off";
}

// Turns single-key shortcuts on or off. Remembered in this browser unless remember is
// false (a specimen, a test).
export function setSingleKeys(on: boolean, opts: { remember?: boolean } = {}): void {
  singleOverride = on;
  if (opts.remember !== false) writePref(SINGLE_KEYS_PREF, on ? "on" : "off");
  pending = null;
  if (typeof document !== "undefined") document.dispatchEvent(new CustomEvent("cap-single-keys", { detail: { on } }));
}

// Keys typed into a field belong to the field. Checkboxes, radios and buttons are not
// typing, so shortcuts still work while one has focus.
const NOT_TYPING = new Set(["checkbox", "radio", "button", "submit", "reset", "range", "color", "file", "image"]);
export function isTyping(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false;
  if (target instanceof HTMLInputElement) return !NOT_TYPING.has(target.type);
  if (target.closest("textarea, select")) return true;
  return target instanceof HTMLElement && target.isContentEditable;
}

function modalOpen(): boolean {
  try {
    return !!document.querySelector("dialog:modal");
  } catch {
    return !!document.querySelector("dialog[open]");
  }
}

function fire(s: Shortcut, e: KeyboardEvent): boolean {
  if (s.when && !s.when()) return false;
  e.preventDefault();
  s.run(e);
  return true;
}

function onKeyDown(e: KeyboardEvent): void {
  if (e.defaultPrevented || e.isComposing) return;
  if (e.key === "Shift" || e.key === "Control" || e.key === "Alt" || e.key === "Meta") return;
  // A modal dialog owns the keyboard while it is open.
  if (modalOpen()) {
    pending = null;
    return;
  }
  const singles = singleKeysOn() && !isTyping(e.target);
  const now = Date.now();
  const before = pending;
  pending = null;

  // The second key of a sequence.
  if (before && singles && now - before.at <= SEQUENCE_MS) {
    for (const s of entries) {
      for (const spec of specsOf(s)) {
        const steps = stepsOf(spec);
        if (steps.length === 2 && steps[0] === before.step && matchesStep(steps[1] ?? "", e) && fire(s, e)) return;
      }
    }
  }
  // A one-step shortcut.
  for (const s of entries) {
    for (const spec of specsOf(s)) {
      const steps = stepsOf(spec);
      if (steps.length !== 1) continue;
      if (isSingleKey(spec) && !singles) continue;
      if (matchesStep(spec, e) && fire(s, e)) return;
    }
  }
  // The first key of a sequence: wait for the second.
  if (!singles) return;
  for (const s of entries) {
    for (const spec of specsOf(s)) {
      const steps = stepsOf(spec);
      const first = steps[0] ?? "";
      if (steps.length === 2 && isSingleKey(spec) && matchesStep(first, e)) {
        pending = { step: first, at: now };
        return;
      }
    }
  }
}

// Installs the one listener and the "?" shortcut. Called by register(); safe to call again.
export function start(): void {
  if (installed || typeof document === "undefined") return;
  installed = true;
  document.addEventListener("keydown", onKeyDown);
  entries.unshift({ key: "?", label: "Show keyboard shortcuts", group: "General", run: () => sheetOpener() });
}

// Removes the listener and every shortcut.
export function stop(): void {
  if (typeof document !== "undefined") document.removeEventListener("keydown", onKeyDown);
  installed = false;
  entries.length = 0;
  pending = null;
}

// Adds a shortcut. Returns a function that removes it.
export function register(s: Shortcut): () => void {
  start();
  entries.push(s);
  return () => {
    const i = entries.indexOf(s);
    if (i >= 0) entries.splice(i, 1);
  };
}

export function list(): Shortcut[] {
  start();
  return entries.slice();
}

// The registry by group, in the order each group first appears.
export function grouped(): Array<{ group: string; items: Shortcut[] }> {
  const out: Array<{ group: string; items: Shortcut[] }> = [];
  for (const s of list()) {
    let g = out.find((x) => x.group === s.group);
    if (!g) {
      g = { group: s.group, items: [] };
      out.push(g);
    }
    g.items.push(s);
  }
  return out;
}

// What a key spec looks like on a key cap, one string per step: "Mod+k" is ["Ctrl K"]
// (["⌘ K"] on a Mac), "g o" is ["g", "o"].
export function keyCaps(spec: string): string[] {
  const mac = isMac();
  return stepsOf(spec).map((step) => {
    const c = parseStep(step);
    const names: string[] = [];
    if (c.ctrl || (c.mod && !mac)) names.push("Ctrl");
    if (c.meta || (c.mod && mac)) names.push(mac ? "⌘" : "Meta");
    if (c.alt) names.push(mac ? "⌥" : "Alt");
    const k = c.key.length === 1 && names.length ? c.key.toUpperCase() : c.key;
    names.push(k);
    return names.join(" ");
  });
}

// The key caps of a shortcut as <kbd> elements: "g o" is two caps, several keys are joined
// with "or".
export function keysFragment(key: string | string[]): DocumentFragment {
  const frag = document.createDocumentFragment();
  const specs = Array.isArray(key) ? key : [key];
  specs.forEach((spec, i) => {
    if (i > 0) frag.append(" or ");
    keyCaps(spec).forEach((cap, j) => {
      if (j > 0) frag.append(" ");
      const k = document.createElement("kbd");
      k.textContent = cap;
      frag.append(k);
    });
  });
  return frag;
}

// ---------------------------------------------------------------------------------------
// The sheet.

// Lets an app (the React wrapper) open its own sheet when "?" is pressed.
export function setSheetOpener(fn: (() => void) | null): void {
  sheetOpener = fn ?? (() => openShortcutSheet());
}

// Fills a sheet's list from the registry: one group heading and one description list each.
export function renderSheetList(container: HTMLElement): void {
  container.replaceChildren();
  for (const g of grouped()) {
    const wrap = document.createElement("div");
    wrap.className = "cap-keys-group";
    const h = document.createElement("h3");
    h.className = "cap-keys-group-title";
    h.textContent = g.group;
    const dl = document.createElement("dl");
    dl.className = "cap-keys-list";
    for (const s of g.items) {
      const row = document.createElement("div");
      const dt = document.createElement("dt");
      dt.append(keysFragment(s.key));
      const dd = document.createElement("dd");
      dd.textContent = s.label;
      row.append(dt, dd);
      dl.append(row);
    }
    wrap.append(h, dl);
    container.append(wrap);
  }
}

function syncSwitch(sheet: HTMLElement): void {
  const box = sheet.querySelector<HTMLInputElement>("[data-cap-part='single-keys']");
  if (!box) return;
  const on = singleKeysOn();
  box.checked = on;
  const word = box.closest(".cap-switch")?.querySelector(".cap-switch-state");
  if (word) word.textContent = on ? "On" : "Off";
}

// Builds the sheet's markup, exactly the contract on the doc page.
export function buildSheet(): HTMLDialogElement {
  const id = uid("cap-keys");
  const d = document.createElement("dialog");
  d.className = "cap-keys";
  d.dataset.cap = "shortcuts";
  d.setAttribute("aria-labelledby", `${id}-title`);

  const head = document.createElement("div");
  head.className = "cap-keys-head";
  const h = document.createElement("h2");
  h.className = "cap-keys-title";
  h.id = `${id}-title`;
  h.textContent = "Keyboard shortcuts";
  const close = document.createElement("button");
  close.type = "button";
  close.className = "cap-btn";
  close.dataset.capPart = "close";
  close.textContent = "Close";
  head.append(h, close);

  const body = document.createElement("div");
  body.className = "cap-keys-body";
  body.dataset.capPart = "keys-list";

  const foot = document.createElement("div");
  foot.className = "cap-keys-foot";
  const label = document.createElement("label");
  label.className = "cap-switch";
  const box = document.createElement("input");
  box.type = "checkbox";
  box.setAttribute("role", "switch");
  box.dataset.capPart = "single-keys";
  box.setAttribute("aria-describedby", `${id}-note`);
  const name = document.createElement("span");
  name.textContent = "Single-key shortcuts";
  const state = document.createElement("span");
  state.className = "cap-switch-state";
  state.setAttribute("aria-hidden", "true");
  label.append(box, name, state);
  const note = document.createElement("p");
  note.className = "cap-keys-note";
  note.id = `${id}-note`;
  note.textContent = "Turn these off if they clash with a screen reader or speech input. Shortcuts with Ctrl or ⌘ keep working.";
  foot.append(label, note);

  d.append(head, body, foot);
  return d;
}

// Wires one sheet: its list, the switch, Close, a click on the backdrop, and focus returned
// on close. Returns a function that unwires it.
export function wireSheet(sheet: HTMLDialogElement): () => void {
  sheet.dataset.capReady = "";
  const box = sheet.querySelector<HTMLInputElement>("[data-cap-part='single-keys']");
  const onChange = () => {
    if (box) setSingleKeys(box.checked);
  };
  const onSingle = () => syncSwitch(sheet);
  const onClick = (e: MouseEvent) => {
    if ((e.target as Element).closest("[data-cap-part='close']") || isBackdropClick(sheet, e)) sheet.close();
  };
  const onClose = () => returnFocus(sheet);
  box?.addEventListener("change", onChange);
  document.addEventListener("cap-single-keys", onSingle);
  sheet.addEventListener("click", onClick);
  sheet.addEventListener("close", onClose);
  syncSwitch(sheet);
  return () => {
    box?.removeEventListener("change", onChange);
    document.removeEventListener("cap-single-keys", onSingle);
    sheet.removeEventListener("click", onClick);
    sheet.removeEventListener("close", onClose);
    delete sheet.dataset.capReady;
  };
}

// Opens the sheet: the one in the page's markup, or one built on first use.
export function openShortcutSheet(opener: Element | null = document.activeElement): HTMLDialogElement {
  let sheet = document.querySelector<HTMLDialogElement>("dialog.cap-keys[data-cap='shortcuts']");
  if (!sheet) {
    sheet = buildSheet();
    document.body.append(sheet);
  }
  if (!sheet.dataset.capReady) wireSheet(sheet);
  const list = sheet.querySelector<HTMLElement>("[data-cap-part='keys-list']");
  if (list) renderSheetList(list);
  syncSwitch(sheet);
  if (!sheet.open) {
    rememberOpener(sheet, opener);
    sheet.showModal();
    sheet.querySelector<HTMLElement>("[data-cap-part='close']")?.focus();
  }
  return sheet;
}

// Wires a sheet written in markup and every [data-cap-keys-open] button under root, and
// starts the registry. Returns a function that detaches them.
export function enhance(root: ParentNode = document): () => void {
  start();
  const undo: Array<() => void> = [];
  for (const sheet of root.querySelectorAll<HTMLDialogElement>("dialog.cap-keys[data-cap='shortcuts']:not([data-cap-ready])")) {
    undo.push(wireSheet(sheet));
  }
  for (const btn of root.querySelectorAll<HTMLElement>("[data-cap-keys-open]:not([data-cap-ready])")) {
    btn.dataset.capReady = "";
    const onClick = () => openShortcutSheet(btn);
    btn.addEventListener("click", onClick);
    undo.push(() => {
      btn.removeEventListener("click", onClick);
      delete btn.dataset.capReady;
    });
  }
  return () => undo.forEach((f) => f());
}
