// The theme switch: System, Light or Dark, as a segmented radio group. Light and Dark set
// data-theme on <html>; System removes it, so the operating system's choice applies. The
// choice is remembered in this browser. applyStoredTheme() is what an app runs before
// first paint; toggleTheme() is for a "t" shortcut. No framework; the React wrapper uses the
// same functions.
import { readPref, writePref } from "../shell/shell.ts";

export type ThemeChoice = "system" | "light" | "dark";
export const THEME_PREF = "cap-theme";

const isChoice = (v: string | null | undefined): v is ThemeChoice => v === "system" || v === "light" || v === "dark";

export function readTheme(key = THEME_PREF): ThemeChoice | null {
  const v = readPref(key);
  return isChoice(v) ? v : null;
}

// Sets or removes data-theme, remembers the choice unless told not to, and tells every
// switch on the page.
export function applyTheme(choice: ThemeChoice, opts: { key?: string; remember?: boolean } = {}): void {
  const root = document.documentElement;
  if (choice === "system") root.removeAttribute("data-theme");
  else root.setAttribute("data-theme", choice);
  if (opts.remember !== false) writePref(opts.key ?? THEME_PREF, choice);
  document.dispatchEvent(new CustomEvent("cap-theme", { detail: { choice } }));
}

// Applies the remembered choice, if there is one. Run it before first paint, or the page
// flashes the other theme. Returns what it applied.
export function applyStoredTheme(key = THEME_PREF): ThemeChoice | null {
  const t = readTheme(key);
  if (t) applyTheme(t, { key, remember: false });
  return t;
}

// The theme the page is painting now.
export function effectiveTheme(): "light" | "dark" {
  const t = document.documentElement.getAttribute("data-theme");
  if (t === "light" || t === "dark") return t;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

// Switches between light and dark, from whatever is showing. For a "t" shortcut.
export function toggleTheme(key = THEME_PREF): "light" | "dark" {
  const next = effectiveTheme() === "dark" ? "light" : "dark";
  applyTheme(next, { key });
  return next;
}

function check(el: HTMLElement, choice: ThemeChoice): void {
  for (const r of el.querySelectorAll<HTMLInputElement>("input[type='radio']")) r.checked = r.value === choice;
}

// Attaches to every [data-cap="theme-switch"] under root: the remembered choice is checked
// and applied (or, with none remembered, the one checked in the markup is applied), a
// change applies and remembers, and the radios follow toggleTheme() and other tabs.
export function enhance(root: ParentNode = document): () => void {
  const undo: Array<() => void> = [];
  for (const el of root.querySelectorAll<HTMLElement>("[data-cap='theme-switch']:not([data-cap-ready])")) {
    el.dataset.capReady = "";
    const key = el.dataset.capPref ?? THEME_PREF;
    const stored = readTheme(key);
    const marked = el.querySelector<HTMLInputElement>("input[type='radio']:checked")?.value;
    const start: ThemeChoice = stored ?? (isChoice(marked) ? marked : "system");
    check(el, start);
    applyTheme(start, { key, remember: false });

    const onChange = (e: Event) => {
      const r = e.target as HTMLInputElement;
      if (r.type === "radio" && isChoice(r.value)) applyTheme(r.value, { key });
    };
    const onTheme = (e: Event) => {
      const choice = (e as CustomEvent<{ choice: ThemeChoice }>).detail?.choice;
      if (isChoice(choice)) check(el, choice);
    };
    const onStorage = (e: StorageEvent) => {
      if (e.key === key && isChoice(e.newValue)) applyTheme(e.newValue, { key, remember: false });
    };
    el.addEventListener("change", onChange);
    document.addEventListener("cap-theme", onTheme);
    window.addEventListener("storage", onStorage);
    undo.push(() => {
      el.removeEventListener("change", onChange);
      document.removeEventListener("cap-theme", onTheme);
      window.removeEventListener("storage", onStorage);
      delete el.dataset.capReady;
    });
  }
  return () => undo.forEach((f) => f());
}
