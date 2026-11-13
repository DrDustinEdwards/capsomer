// The theme switch: Light or Dark, as a two-choice segmented radio group, or (0.9.0) as one icon
// button that switches to the other theme (data-variant="button", the site header's control). The first visit
// follows the operating system's setting (data-theme is left off, so the system's choice
// applies); the first time the person chooses, data-theme is set and the choice is remembered
// in this browser from then on, as the Portal's top bar button does. applyStoredTheme() is
// what an app runs before first paint; toggleTheme() is for a "t" shortcut. No framework;
// the React wrapper uses the same functions.
//
// One behavior on every site (0.92.0): a person's choice (chooseTheme) is painted, remembered in
// this browser, written to the site's cookie where it keeps one (data-cap-cookie), so its server
// renders the next page in that theme with no flash, and handed to the site's onSave hook, which
// saves it to the signed-in account. Where the cookie is the memory, the server's answer (the
// data-theme it wrote) is copied into this browser's memory first (syncServedTheme), so an older
// choice here never overrules it. The pre-paint script is themeScript (theme-server.ts).
import { readPref, writePref } from "../shell/shell.ts";
import { attach as attachTip } from "../tooltip/tooltip.ts";
import {
  isThemeChoice as isChoice,
  THEME_COOKIE,
  THEME_PREF,
  themeCookie,
  type ThemeChoice,
} from "./theme-server.ts";

export { THEME_COOKIE, THEME_PREF, type ThemeChoice };

/** Saves a person's choice where the site keeps it (the signed-in account). Fire and forget: the
 *  page has already switched, so a failed save never switches it back; the next page reconciles. */
export type ThemeSave = (choice: ThemeChoice) => void | Promise<unknown>;

/** Where a person's choice is kept. `key`: this browser's localStorage key (null: none). `cookie`:
 *  the site's cookie, for its server. `onSave`: the site's own save. */
export interface ThemeMemory {
  key?: string | null;
  cookie?: string;
  onSave?: ThemeSave;
}

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
export function applyTheme(
  choice: ThemeChoice,
  opts: { key?: string; remember?: boolean } = {},
): void {
  paintTheme(choice, opts.remember !== false, opts.remember !== false);
  if (opts.remember !== false) writePref(opts.key ?? THEME_PREF, choice);
}

// Paints a choice (crossfading when `animate`, motion allowed and the browser has view
// transitions) and tells every switch on the page; `chosen` says a person made it just now.
function paintTheme(choice: ThemeChoice, animate: boolean, chosen: boolean): void {
  const paint = () => {
    pending = null;
    document.documentElement.setAttribute("data-theme", choice);
    // The browser bar (themeColorMeta): every theme-color tag takes the chosen theme's ground.
    const metas = document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]');
    if (metas.length) {
      const ground = getComputedStyle(document.documentElement).getPropertyValue("--ground").trim();
      if (ground) for (const m of metas) m.content = ground;
    }
  };
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!animate || reduce || !document.startViewTransition) paint();
  else {
    pending = choice;
    document.startViewTransition(paint);
  }
  document.dispatchEvent(new CustomEvent("cap-theme", { detail: { choice, chosen } }));
}

// Writes the site's theme cookie from the browser, Secure on https.
export function writeThemeCookie(choice: ThemeChoice, name = THEME_COOKIE): void {
  document.cookie = themeCookie(choice, { name, secure: location.protocol === "https:" });
}

// A person's choice, kept everywhere the site keeps it: painted (crossfading unless `animate` is
// false), this browser's memory, the site's cookie, then the site's onSave. A save that throws or
// rejects is let go; the page has switched and stays switched.
export function chooseTheme(
  choice: ThemeChoice,
  { key = THEME_PREF, cookie, onSave }: ThemeMemory = {},
  { animate = true }: { animate?: boolean } = {},
): void {
  paintTheme(choice, animate, true);
  if (key) writePref(key, choice);
  if (cookie) writeThemeCookie(choice, cookie);
  if (!onSave) return;
  try {
    void Promise.resolve(onSave(choice)).catch(() => undefined);
  } catch {
    // The site's save failed at once; the choice stands in this browser and the cookie.
  }
}

// Where the server keeps the choice (a cookie, an account): copies the server's answer (the
// data-theme it wrote into the page, or none) into this browser's memory, before any switch reads
// it, so the two agree. With no answer the memory is cleared and the page follows the system.
export function syncServedTheme(key = THEME_PREF): void {
  const served = document.documentElement.getAttribute("data-theme");
  try {
    if (isChoice(served)) localStorage.setItem(key, served);
    else localStorage.removeItem(key);
  } catch {
    // Storage blocked: the switches read <html data-theme>.
  }
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

// Switches between light and dark, from whatever is showing, and keeps it as chooseTheme does
// (this browser, and the site's cookie and onSave when given). For a "t" shortcut.
export function toggleTheme(key = THEME_PREF, memory: Omit<ThemeMemory, "key"> = {}): ThemeChoice {
  const next = effectiveTheme() === "dark" ? "light" : "dark";
  chooseTheme(next, { ...memory, key });
  return next;
}

function check(el: HTMLElement, choice: ThemeChoice): void {
  for (const r of el.querySelectorAll<HTMLInputElement>("input[type='radio']"))
    r.checked = r.value === choice;
}

// The button form says what it does, never what is showing: "Switch to dark theme" while the
// page is light, "Switch to light theme" while it is dark.
export function themeButtonLabel(showing: ThemeChoice): string {
  return showing === "dark" ? "Switch to light theme" : "Switch to dark theme";
}

// Keeps a theme button's name and its tip's words in step with the theme that is showing.
export function syncThemeButton(
  button: HTMLElement,
  showing: ThemeChoice = effectiveTheme(),
): void {
  const label = themeButtonLabel(showing);
  button.setAttribute("aria-label", label);
  const text = button.querySelector(".cap-theme-tip-text");
  if (text) text.textContent = label;
}

// One theme button: a press switches to the other theme and remembers it; its name follows the
// theme from any source (a switch, the T key, another tab, the system). Its tip repeats its name,
// so it adds no description.
function wireButton(el: HTMLElement, key: string, memory: ThemeMemory): () => void {
  const start = readTheme(key);
  if (start) applyTheme(start, { key, remember: false });
  syncThemeButton(el);
  const tip = el.querySelector<HTMLElement>(".cap-theme-tip");
  const detachTip = tip ? attachTip(el, tip) : null;
  el.removeAttribute("aria-describedby");
  const onClick = () => toggleTheme(key, memory);
  const onTheme = (e: Event) =>
    syncThemeButton(
      el,
      (e as CustomEvent<{ choice: ThemeChoice }>).detail?.choice ?? effectiveTheme(),
    );
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

// The form (data-variant="form", 0.22.0): the button form for a site that keeps the choice in a
// cookie and works with no script. Two submit buttons ship, each a real post to the site's theme
// route, and CSS shows the one for the theme that is not showing. With script a press switches at
// once and writes the cookie (data-cap-cookie names it), and the server writes the same data-theme
// into the next page's first byte. The cookie is the memory; data-cap-pref also writes the choice
// to that localStorage key, for a part of the site (an admin) whose shell reads it from there.
function wireForm(form: HTMLFormElement, onSave?: ThemeSave): () => void {
  const detachTips = [...form.querySelectorAll<HTMLElement>(".cap-theme-tip")].map((tip) => {
    const button = tip.parentElement;
    if (!button) return () => undefined;
    const detach = attachTip(button, tip);
    button.removeAttribute("aria-describedby");
    return detach;
  });
  const onSubmit = (e: SubmitEvent) => {
    const choice = e.submitter instanceof HTMLButtonElement ? e.submitter.value : null;
    if (!isChoice(choice)) return;
    e.preventDefault();
    // Held before the page changes: the pressed button is about to be hidden, which drops focus.
    const had = form.contains(document.activeElement);
    // Painted at once, not crossfaded: the button to focus next is the one shown after the paint.
    chooseTheme(
      choice,
      { key: form.dataset.capPref ?? null, cookie: form.dataset.capCookie ?? THEME_COOKIE, onSave },
      { animate: false },
    );
    // preventScroll: Chrome scrolls a focused sticky-header control toward where it would sit unstuck.
    if (had)
      [...form.querySelectorAll<HTMLElement>("button[value]")]
        .find((b) => b.offsetParent !== null)
        ?.focus({ preventScroll: true });
  };
  form.addEventListener("submit", onSubmit);
  return () => {
    form.removeEventListener("submit", onSubmit);
    detachTips.forEach((f) => f());
  };
}

// Attaches to every [data-cap="theme-switch"] under root. With a remembered choice, that is
// checked and applied. With none and a radio checked in the markup (a server that read a
// cookie), that one is applied. With neither, the radio for the operating system's theme is
// checked and nothing is applied or remembered until the person chooses, so the page keeps
// following the system. A change applies and remembers; the radios follow toggleTheme(),
// other tabs and the system. A switch with data-cap-cookie keeps the choice in that cookie too;
// with a cookie or an onSave it starts from the server's answer (syncServedTheme). `onSave` is the site's save, handed every
// person's choice from every switch this attaches to.
export function enhance(
  root: ParentNode = document,
  { onSave }: { onSave?: ThemeSave } = {},
): () => void {
  const undo: Array<() => void> = [];
  for (const el of root.querySelectorAll<HTMLElement>(
    "[data-cap='theme-switch']:not([data-cap-ready])",
  )) {
    el.dataset.capReady = "";
    const key = el.dataset.capPref ?? THEME_PREF;
    const cookie = el.dataset.capCookie;
    // The server answers for a switch whose choice it keeps (a cookie, or the site's save).
    if ((cookie || onSave) && (el.dataset.variant !== "form" || el.dataset.capPref))
      syncServedTheme(key);
    const memory: ThemeMemory = { key, cookie, onSave };
    if (el.dataset.variant === "form" && el instanceof HTMLFormElement) {
      const unwire = wireForm(el, onSave);
      undo.push(() => {
        unwire();
        delete el.dataset.capReady;
      });
      continue;
    }
    if (el.dataset.variant === "button") {
      const unwire = wireButton(el, key, memory);
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
      if (r.type === "radio" && isChoice(r.value)) chooseTheme(r.value, memory);
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
