// The keyboard shortcut registry and the "?" sheet that lists it, with one document keydown listener.
// Single-key shortcuts can be switched off and the choice is remembered (WCAG 2.1.4); Ctrl, Cmd and Alt
// shortcuts always work. The choice lives on <html> as data-cap-single-keys, which every component reads.
import { readStored, writeStored } from "../hooks/hooks.ts";

export interface Shortcut {
  // "r", "?", "g o" (a sequence: g, then o within 1200 ms), "Mod+k" (Ctrl, or Cmd on a
  // Mac), "Ctrl+Enter", "Alt+n". An array gives one command several keys.
  key: string | string[];
  label: string;
  about?: string;
  group: string;
  run: (e: KeyboardEvent) => void;
  // Runs only while this returns true.
  when?: () => boolean;
}

export const SINGLE_KEYS_PREF = "cap-single-keys";
export const SINGLE_KEYS_NOTE =
  "Turn these off if they clash with a screen reader. Shortcuts with Ctrl or ⌘ keep working.";
export const SEQUENCE_MS = 1200;

const entries: Shortcut[] = [];
// listening: the keydown listener is on. installed: "?" opens the sheet too.
let listening = false;
let installed = false;
let pending: { step: string; at: number } | null = null;
// The built-in sheet (shortcuts-sheet.ts) loads the first time it is asked for, so a page that never
// presses "?" never downloads it. A server build (Vite sets import.meta.env.SSR) leaves the chunk out:
// nothing presses a key there.
const loadSheet = () =>
  (import.meta as { env?: { SSR?: boolean } }).env?.SSR
    ? Promise.reject(new Error("shortcuts: the sheet opens only in a browser"))
    : import("./shortcuts-sheet.ts");
const openBuiltIn = (opener?: Element | null) =>
  void loadSheet().then((m) => m.openShortcutSheet(opener ?? document.activeElement));
let sheetOpener: () => void = () => openBuiltIn();

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
  return (
    typeof document === "undefined" || document.documentElement.dataset.capSingleKeys !== "off"
  );
}

export function singleKeysOff(): boolean {
  return !singleKeysOn();
}

export function setSingleKeys(on: boolean, opts: { remember?: boolean } = {}): void {
  if (opts.remember !== false) writeStored(SINGLE_KEYS_PREF, on ? "on" : "off");
  pending = null;
  if (typeof document === "undefined") return;
  document.documentElement.dataset.capSingleKeys = on ? "on" : "off";
  document.dispatchEvent(new CustomEvent("cap-single-keys", { detail: { on } }));
}

if (
  typeof document !== "undefined" &&
  !document.documentElement.dataset.capSingleKeys &&
  readStored(SINGLE_KEYS_PREF) === "off"
) {
  document.documentElement.dataset.capSingleKeys = "off";
}

// Keys typed into a field belong to the field. Checkboxes, radios and buttons are not
// typing, so shortcuts still work while one has focus.
const NOT_TYPING = new Set([
  "checkbox",
  "radio",
  "button",
  "submit",
  "reset",
  "range",
  "color",
  "file",
  "image",
]);
/**
 * True for an Enter that confirms an IME conversion (Japanese, Chinese, Korean input) and must not submit or act.
 * `isComposing` covers Chrome and Firefox; `keyCode` 229 covers Safari, which fires `compositionend` before the
 * confirming keydown and so reports `isComposing` false (WebKit bug 165004). Only meaningful behind an Enter check:
 * a phone keyboard reports 229 for ordinary keys too. (Modern Web Guidance, ime-safe-enter-submit.)
 */
export function isImeEnter(e: Pick<KeyboardEvent, "key" | "isComposing" | "keyCode">): boolean {
  return e.key === "Enter" && (e.isComposing || e.keyCode === 229);
}

export function isTyping(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false;
  if (target instanceof HTMLInputElement) return !NOT_TYPING.has(target.type);
  if (target.closest("textarea, select, [role='textbox'], [role='combobox'], [role='searchbox']"))
    return true;
  return target instanceof HTMLElement && target.isContentEditable;
}

function modalOpen(): boolean {
  try {
    return !!document.querySelector("dialog:modal");
  } catch {
    return !!document.querySelector("dialog[open]");
  }
}

export function fire(s: Shortcut, e: KeyboardEvent): boolean {
  if (s.when && !s.when()) return false;
  e.preventDefault();
  s.run(e);
  return true;
}

function onKeyDown(e: KeyboardEvent): void {
  if (e.defaultPrevented || e.isComposing || isImeEnter(e)) return;
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

  if (before && singles && now - before.at <= SEQUENCE_MS) {
    for (const s of entries) {
      for (const spec of specsOf(s)) {
        const steps = stepsOf(spec);
        if (
          steps.length === 2 &&
          steps[0] === before.step &&
          matchesStep(steps[1] ?? "", e) &&
          fire(s, e)
        )
          return;
      }
    }
  }
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

function listen(): void {
  if (listening || typeof document === "undefined") return;
  listening = true;
  document.addEventListener("keydown", onKeyDown);
}

// Installs the one listener and the "?" shortcut. Called by register(); safe to call again.
export function start(): void {
  listen();
  if (installed || typeof document === "undefined") return;
  installed = true;
  entries.unshift({
    key: "?",
    label: "Show keyboard shortcuts",
    group: "General",
    run: () => sheetOpener(),
  });
}

// The Ctrl, Cmd or Alt shortcut this key matches, if any, and whether its `when` allows it. Lets a surface
// open over the page (the sheet) pass such keys through: Ctrl K in the help sheet opens the command menu.
export function modifiedShortcutFor(e: KeyboardEvent): Shortcut | undefined {
  for (const s of entries) {
    if (s.when && !s.when()) continue;
    for (const spec of specsOf(s)) {
      if (stepsOf(spec).length === 1 && !isSingleKey(spec) && matchesStep(spec, e)) return s;
    }
  }
  return undefined;
}

export function stop(): void {
  if (typeof document !== "undefined") document.removeEventListener("keydown", onKeyDown);
  listening = false;
  installed = false;
  entries.length = 0;
  pending = null;
}

export function register(s: Shortcut): () => void {
  start();
  return registerKey(s);
}

// Adds a shortcut without offering the "?" sheet. Keeps the sheet out of bundles that reach the registry only
// through this: a classic /site.js inlines the sheet's lazy import.
export function registerKey(s: Shortcut): () => void {
  listen();
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

// Keys whose cap is a symbol or a short word, with the name a screen reader says for the symbols.
const CAPS: Record<string, string> = {
  ArrowLeft: "←",
  ArrowRight: "→",
  ArrowUp: "↑",
  ArrowDown: "↓",
  Escape: "Esc",
};
const CAP_NAMES: Record<string, string> = {
  "←": "Left arrow",
  "→": "Right arrow",
  "↑": "Up arrow",
  "↓": "Down arrow",
};

// The spoken name of a key cap drawn as a symbol (an arrow); undefined for a cap that reads as it is.
export function capName(cap: string): string | undefined {
  return CAP_NAMES[cap];
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
    const k = CAPS[c.key] ?? (c.key.length === 1 && names.length ? c.key.toUpperCase() : c.key);
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
      const name = capName(cap);
      if (name) {
        // The arrow is drawn; its name is what a screen reader says and what a pointer's tooltip shows.
        k.title = name;
        const shown = document.createElement("span");
        shown.setAttribute("aria-hidden", "true");
        shown.textContent = cap;
        const said = document.createElement("span");
        said.className = "cap-sr-only";
        said.textContent = name;
        k.append(shown, said);
      } else k.textContent = cap;
      frag.append(k);
    });
  });
  return frag;
}

export function setSheetOpener(fn: (() => void) | null): void {
  sheetOpener = fn ?? (() => openBuiltIn());
}

export function enhance(root: ParentNode = document): () => void {
  start();
  const undo: Array<() => void> = [];
  let gone = false;
  const sheets = root.querySelectorAll<HTMLDialogElement>(
    "dialog.cap-keys[data-cap='shortcuts']:not([data-cap-ready])",
  );
  if (sheets.length)
    void loadSheet().then((m) => {
      if (!gone) for (const sheet of sheets) undo.push(m.wireSheet(sheet));
    });
  for (const btn of root.querySelectorAll<HTMLElement>(
    "[data-cap-keys-open]:not([data-cap-ready])",
  )) {
    btn.dataset.capReady = "";
    const onClick = () => openBuiltIn(btn);
    btn.addEventListener("click", onClick);
    undo.push(() => {
      btn.removeEventListener("click", onClick);
      delete btn.dataset.capReady;
    });
  }
  return () => {
    gone = true;
    undo.forEach((f) => f());
  };
}
