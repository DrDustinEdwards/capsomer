// The keyboard shortcut registry and the "?" sheet that lists it (the shared dialog,
// components/dialog). One document keydown listener for the whole app. Single-key shortcuts (a letter, "?", a sequence like "g o")
// can be switched off and the choice is remembered (WCAG 2.1.4); shortcuts with Ctrl, Cmd
// or Alt always work. The choice lives on <html> as data-cap-single-keys, the one switch every
// component's own single keys read. No framework; the React wrapper uses the same registry.
import { readStored, writeStored } from "../hooks/hooks.js";
export const SINGLE_KEYS_PREF = "cap-single-keys";
// The line under the switch, shared by the built sheet and the React one.
export const SINGLE_KEYS_NOTE = "Turn these off if they clash with a screen reader or speech input. It applies at once. Shortcuts with Ctrl or ⌘ keep working.";
export const SEQUENCE_MS = 1200;
const entries = [];
// listening: the keydown listener is on. installed: "?" opens the sheet too.
let listening = false;
let installed = false;
let pending = null;
// The built-in sheet (shortcuts-sheet.ts) loads the first time it is asked for, so a page that never
// presses "?" never downloads it. A server build (Vite sets import.meta.env.SSR) leaves the chunk out:
// nothing presses a key there.
const loadSheet = () => import.meta.env?.SSR
    ? Promise.reject(new Error("shortcuts: the sheet opens only in a browser"))
    : import("./shortcuts-sheet.js");
const openBuiltIn = (opener) => void loadSheet().then((m) => m.openShortcutSheet(opener ?? document.activeElement));
let sheetOpener = () => openBuiltIn();
export function isMac() {
    return typeof navigator !== "undefined" && /Mac|iPhone|iPad|iPod/.test(navigator.userAgent);
}
function parseStep(step) {
    if (step.length === 1)
        return { key: step, ctrl: false, meta: false, alt: false, mod: false };
    const parts = step.split("+");
    let key = parts.pop() ?? "";
    if (key === "")
        key = "+";
    const mods = parts.map((m) => m.toLowerCase());
    return {
        key,
        ctrl: mods.includes("ctrl") || mods.includes("control"),
        meta: mods.includes("meta") || mods.includes("cmd"),
        alt: mods.includes("alt") || mods.includes("option"),
        mod: mods.includes("mod"),
    };
}
const specsOf = (s) => (Array.isArray(s.key) ? s.key : [s.key]);
const stepsOf = (spec) => spec.trim().split(/\s+/);
// A single-key shortcut is one a person can press by accident while typing or speaking:
// no Ctrl, Cmd or Alt in any step.
export function isSingleKey(spec) {
    return stepsOf(spec).every((step) => {
        const c = parseStep(step);
        return !c.ctrl && !c.meta && !c.alt && !c.mod;
    });
}
function matchesStep(step, e) {
    const c = parseStep(step);
    const mac = isMac();
    const ctrl = c.ctrl || (c.mod && !mac);
    const meta = c.meta || (c.mod && mac);
    if (e.ctrlKey !== ctrl || e.metaKey !== meta || e.altKey !== c.alt)
        return false;
    if (!ctrl && !meta && !c.alt)
        return e.key === c.key;
    // With a modifier, case does not matter, and Alt's altered characters are read by code.
    if (e.key.toLowerCase() === c.key.toLowerCase())
        return true;
    return /^[a-z]$/i.test(c.key) && e.code === `Key${c.key.toUpperCase()}`;
}
export function singleKeysOn() {
    return (typeof document === "undefined" || document.documentElement.dataset.capSingleKeys !== "off");
}
export function singleKeysOff() {
    return !singleKeysOn();
}
// Turns single-key shortcuts on or off, here and in every component. Remembered in this browser
// unless remember is false (a specimen, a test).
export function setSingleKeys(on, opts = {}) {
    if (opts.remember !== false)
        writeStored(SINGLE_KEYS_PREF, on ? "on" : "off");
    pending = null;
    if (typeof document === "undefined")
        return;
    document.documentElement.dataset.capSingleKeys = on ? "on" : "off";
    document.dispatchEvent(new CustomEvent("cap-single-keys", { detail: { on } }));
}
// The remembered choice reaches <html> as soon as any component that has single keys loads.
if (typeof document !== "undefined" &&
    !document.documentElement.dataset.capSingleKeys &&
    readStored(SINGLE_KEYS_PREF) === "off") {
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
export function isImeEnter(e) {
    return e.key === "Enter" && (e.isComposing || e.keyCode === 229);
}
export function isTyping(target) {
    if (!(target instanceof Element))
        return false;
    if (target instanceof HTMLInputElement)
        return !NOT_TYPING.has(target.type);
    if (target.closest("textarea, select, [role='textbox'], [role='combobox'], [role='searchbox']"))
        return true;
    return target instanceof HTMLElement && target.isContentEditable;
}
function modalOpen() {
    try {
        return !!document.querySelector("dialog:modal");
    }
    catch {
        return !!document.querySelector("dialog[open]");
    }
}
export function fire(s, e) {
    if (s.when && !s.when())
        return false;
    e.preventDefault();
    s.run(e);
    return true;
}
function onKeyDown(e) {
    if (e.defaultPrevented || e.isComposing || isImeEnter(e))
        return;
    if (e.key === "Shift" || e.key === "Control" || e.key === "Alt" || e.key === "Meta")
        return;
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
                if (steps.length === 2 &&
                    steps[0] === before.step &&
                    matchesStep(steps[1] ?? "", e) &&
                    fire(s, e))
                    return;
            }
        }
    }
    // A one-step shortcut.
    for (const s of entries) {
        for (const spec of specsOf(s)) {
            const steps = stepsOf(spec);
            if (steps.length !== 1)
                continue;
            if (isSingleKey(spec) && !singles)
                continue;
            if (matchesStep(spec, e) && fire(s, e))
                return;
        }
    }
    // The first key of a sequence: wait for the second.
    if (!singles)
        return;
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
// The one keydown listener, without the "?" sheet.
function listen() {
    if (listening || typeof document === "undefined")
        return;
    listening = true;
    document.addEventListener("keydown", onKeyDown);
}
// Installs the one listener and the "?" shortcut. Called by register(); safe to call again.
export function start() {
    listen();
    if (installed || typeof document === "undefined")
        return;
    installed = true;
    entries.unshift({
        key: "?",
        label: "Show keyboard shortcuts",
        group: "General",
        run: () => sheetOpener(),
    });
}
// The registered shortcut with Ctrl, Cmd or Alt that this key event matches, if any, and
// whether its `when` allows it now. For a surface open over the page (the sheet) that lets
// such a key through: the Portal's Ctrl K pressed in the help sheet closes the sheet and
// opens the command menu. Keys that match nothing (Ctrl C) are left alone.
export function modifiedShortcutFor(e) {
    for (const s of entries) {
        if (s.when && !s.when())
            continue;
        for (const spec of specsOf(s)) {
            if (stepsOf(spec).length === 1 && !isSingleKey(spec) && matchesStep(spec, e))
                return s;
        }
    }
    return undefined;
}
// Removes the listener and every shortcut.
export function stop() {
    if (typeof document !== "undefined")
        document.removeEventListener("keydown", onKeyDown);
    listening = false;
    installed = false;
    entries.length = 0;
    pending = null;
}
// Adds a shortcut. Returns a function that removes it.
export function register(s) {
    start();
    return registerKey(s);
}
// Adds a shortcut without offering the "?" sheet, for a key a page has whether or not it lists
// its shortcuts (the site header's theme key). It is listed when something else on the page
// offers the sheet. The sheet is not part of a bundle that reaches the registry only through
// this: a classic /site.js inlines the sheet's lazy import, so a page with no other shortcut
// would carry it to list one key.
export function registerKey(s) {
    listen();
    entries.push(s);
    return () => {
        const i = entries.indexOf(s);
        if (i >= 0)
            entries.splice(i, 1);
    };
}
export function list() {
    start();
    return entries.slice();
}
// The registry by group, in the order each group first appears.
export function grouped() {
    const out = [];
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
const CAPS = {
    ArrowLeft: "←",
    ArrowRight: "→",
    ArrowUp: "↑",
    ArrowDown: "↓",
    Escape: "Esc",
};
const CAP_NAMES = {
    "←": "Left arrow",
    "→": "Right arrow",
    "↑": "Up arrow",
    "↓": "Down arrow",
};
// The spoken name of a key cap drawn as a symbol (an arrow); undefined for a cap that reads as it is.
export function capName(cap) {
    return CAP_NAMES[cap];
}
// What a key spec looks like on a key cap, one string per step: "Mod+k" is ["Ctrl K"]
// (["⌘ K"] on a Mac), "g o" is ["g", "o"].
export function keyCaps(spec) {
    const mac = isMac();
    return stepsOf(spec).map((step) => {
        const c = parseStep(step);
        const names = [];
        if (c.ctrl || (c.mod && !mac))
            names.push("Ctrl");
        if (c.meta || (c.mod && mac))
            names.push(mac ? "⌘" : "Meta");
        if (c.alt)
            names.push(mac ? "⌥" : "Alt");
        const k = CAPS[c.key] ?? (c.key.length === 1 && names.length ? c.key.toUpperCase() : c.key);
        names.push(k);
        return names.join(" ");
    });
}
// The key caps of a shortcut as <kbd> elements: "g o" is two caps, several keys are joined
// with "or".
export function keysFragment(key) {
    const frag = document.createDocumentFragment();
    const specs = Array.isArray(key) ? key : [key];
    specs.forEach((spec, i) => {
        if (i > 0)
            frag.append(" or ");
        keyCaps(spec).forEach((cap, j) => {
            if (j > 0)
                frag.append(" ");
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
            }
            else
                k.textContent = cap;
            frag.append(k);
        });
    });
    return frag;
}
// ---------------------------------------------------------------------------------------
// The sheet.
// Lets an app (the React wrapper) open its own sheet when "?" is pressed.
export function setSheetOpener(fn) {
    sheetOpener = fn ?? (() => openBuiltIn());
}
// Wires a sheet written in markup and every [data-cap-keys-open] button under root, and
// starts the registry. Returns a function that detaches them.
export function enhance(root = document) {
    start();
    const undo = [];
    let gone = false;
    const sheets = root.querySelectorAll("dialog.cap-keys[data-cap='shortcuts']:not([data-cap-ready])");
    if (sheets.length)
        void loadSheet().then((m) => {
            if (!gone)
                for (const sheet of sheets)
                    undo.push(m.wireSheet(sheet));
        });
    for (const btn of root.querySelectorAll("[data-cap-keys-open]:not([data-cap-ready])")) {
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
