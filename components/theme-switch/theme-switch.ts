// The theme switch: Light or Dark, as a two-choice segmented radio group, or (0.9.0) as one icon
// button that switches to the other theme (data-variant="button", the site header's control). The first visit
// follows the operating system's setting (data-theme is left off, so the system's choice
// applies); the first time the person chooses, data-theme is set and the choice is remembered
// in this browser from then on, as the Portal's top bar button does. applyStoredTheme() is
// what an app runs before first paint; toggleTheme() is for a "t" shortcut. No framework;
// the React wrapper uses the same functions.
import { readPref, writePref } from "../shell/shell.ts";
import { attach as attachTip } from "../tooltip/tooltip.ts";

export type ThemeChoice = "light" | "dark";
export const THEME_PREF = "cap-theme";

const isChoice = (v: string | null | undefined): v is ThemeChoice => v === "light" || v === "dark";

// What the person chose and the browser remembers, or null if they never did. A "system"
// remembered by 0.1.0 reads as no choice: the system's setting applies, as it did.
export function readTheme(key = THEME_PREF): ThemeChoice | null {
  const v = readPref(key);
  return isChoice(v) ? v : null;
}

// The choice a theme view transition is about to paint, so effectiveTheme() is right at once.
let pending: ThemeChoice | null = null;

// Sets data-theme, remembers the choice unless told not to, and tells every switch on the page.
// A person's choice (one it remembers) crossfades the page in a view transition (css/base.css),
// where the browser has one and motion is allowed; a restored or synced choice paints at once.
export function applyTheme(choice: ThemeChoice, opts: { key?: string; remember?: boolean } = {}): void {
  const paint = () => {
    pending = null;
    document.documentElement.setAttribute("data-theme", choice);
  };
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (opts.remember === false || reduce || !document.startViewTransition) paint();
  else {
    pending = choice;
    document.startViewTransition(paint);
  }
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

// The theme the page is painting now: data-theme when set, else the operating system's. It
// is right even when storage cannot be read or written, because the attribute is what
// applyTheme sets first.
export function effectiveTheme(): ThemeChoice {
  if (pending) return pending;
  const t = document.documentElement.getAttribute("data-theme");
  if (isChoice(t)) return t;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

// Switches between light and dark, from whatever is showing, and remembers it. For a "t" shortcut.
export function toggleTheme(key = THEME_PREF): ThemeChoice {
  const next = effectiveTheme() === "dark" ? "light" : "dark";
  applyTheme(next, { key });
  return next;
}

function check(el: HTMLElement, choice: ThemeChoice): void {
  for (const r of el.querySelectorAll<HTMLInputElement>("input[type='radio']")) r.checked = r.value === choice;
}

// The button form says what it does, never what is showing: "Switch to dark theme" while the
// page is light, "Switch to light theme" while it is dark.
export function themeButtonLabel(showing: ThemeChoice): string {
  return showing === "dark" ? "Switch to light theme" : "Switch to dark theme";
}

// Keeps a theme button's name and its tip's words in step with the theme that is showing.
export function syncThemeButton(button: HTMLElement, showing: ThemeChoice = effectiveTheme()): void {
  const label = themeButtonLabel(showing);
  button.setAttribute("aria-label", label);
  const text = button.querySelector(".cap-theme-tip-text");
  if (text) text.textContent = label;
}

// One theme button: a press switches to the other theme and remembers it; its name follows the
// theme from any source (a switch, the T key, another tab, the system). Its tip repeats its name,
// so it adds no description.
function wireButton(el: HTMLElement, key: string): () => void {
  const start = readTheme(key);
  if (start) applyTheme(start, { key, remember: false });
  syncThemeButton(el);
  const tip = el.querySelector<HTMLElement>(".cap-theme-tip");
  const detachTip = tip ? attachTip(el, tip) : null;
  el.removeAttribute("aria-describedby");
  const onClick = () => toggleTheme(key);
  const onTheme = (e: Event) => syncThemeButton(el, (e as CustomEvent<{ choice: ThemeChoice }>).detail?.choice ?? effectiveTheme());
  const onStorage = (e: StorageEvent) => {
    if (e.key === key && isChoice(e.newValue)) applyTheme(e.newValue, { key, remember: false });
  };
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  const onSystem = () => syncThemeButton(el);
  el.addEventListener("click", onClick);
  document.addEventListener("cap-theme", onTheme);
  window.addEventListener("storage", onStorage);
  media.addEventListener("change", onSystem);
  return () => {
    el.removeEventListener("click", onClick);
    document.removeEventListener("cap-theme", onTheme);
    window.removeEventListener("storage", onStorage);
    media.removeEventListener("change", onSystem);
    detachTip?.();
  };
}

// Attaches to every [data-cap="theme-switch"] under root. With a remembered choice, that is
// checked and applied. With none and a radio checked in the markup (a server that read a
// cookie), that one is applied. With neither, the radio for the operating system's theme is
// checked and nothing is applied or remembered until the person chooses, so the page keeps
// following the system. A change applies and remembers; the radios follow toggleTheme(),
// other tabs and the system.
export function enhance(root: ParentNode = document): () => void {
  const undo: Array<() => void> = [];
  for (const el of root.querySelectorAll<HTMLElement>("[data-cap='theme-switch']:not([data-cap-ready])")) {
    el.dataset.capReady = "";
    const key = el.dataset.capPref ?? THEME_PREF;
    if (el.dataset.variant === "button") {
      const unwire = wireButton(el, key);
      undo.push(() => {
        unwire();
        delete el.dataset.capReady;
      });
      continue;
    }
    const marked = el.querySelector<HTMLInputElement>("input[type='radio']:checked")?.value;
    const start = readTheme(key) ?? (isChoice(marked) ? marked : null);
    if (start) applyTheme(start, { key, remember: false });
    check(el, start ?? effectiveTheme());

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
    // While the person has not chosen, the system's change shows in the control too.
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onSystem = () => {
      if (!document.documentElement.hasAttribute("data-theme")) check(el, effectiveTheme());
    };
    el.addEventListener("change", onChange);
    document.addEventListener("cap-theme", onTheme);
    window.addEventListener("storage", onStorage);
    media.addEventListener("change", onSystem);
    undo.push(() => {
      el.removeEventListener("change", onChange);
      document.removeEventListener("cap-theme", onTheme);
      window.removeEventListener("storage", onStorage);
      media.removeEventListener("change", onSystem);
      delete el.dataset.capReady;
    });
  }
  return () => undo.forEach((f) => f());
}
