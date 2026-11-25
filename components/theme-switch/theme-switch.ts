// The theme switch: a two-choice radio group, or one icon button (data-variant="button"). The first
// visit follows the system (data-theme left off); a person's choice sets data-theme and is remembered
// in localStorage, the site cookie (data-cap-cookie) and the onSave hook. Where a server answers, its
// data-theme is copied into local memory first (syncServedTheme), so an older choice never overrules it.
// applyStoredTheme() runs before first paint; the pre-paint script is themeScript (theme-cookie.ts).
import { readStored, reducedMotion, writeStored } from "../hooks/hooks.ts";
import { attach as attachTip } from "../tooltip/tooltip.ts";
import {
  colorSchemeContent,
  isThemeChoice as isChoice,
  THEME_COOKIE,
  THEME_PREF,
  themeCookie,
  type ThemeChoice,
} from "./theme-cookie.ts";

export { THEME_COOKIE, THEME_PREF, type ThemeChoice };

/** Saves a person's choice where the site keeps it (the signed-in account). Fire and forget: the
 *  page has already switched, so a failed save never switches it back; the next page reconciles. */
export type ThemeSave = (choice: ThemeChoice) => void | Promise<unknown>;

/** Where a person's choice is kept. `key`: this browser's localStorage key (null: none). `cookie`:
 *  the site's cookie, for its server. `onSave`: the site's own save. `onError`: told when that save
 *  throws or rejects (the choice stands either way); without it the failure is let go. */
export interface ThemeMemory {
  key?: string | null;
  cookie?: string;
  onSave?: ThemeSave;
  onError?: (error: unknown) => void;
}

export function readTheme(key = THEME_PREF): ThemeChoice | null {
  const v = readStored(key);
  return isChoice(v) ? v : null;
}

// The choice a theme view transition is about to paint, so effectiveTheme() is right at once.
let pending: ThemeChoice | null = null;

// A person's choice (one it remembers) crossfades the page in a view transition (css/base.css),
// where the browser has one and motion is allowed; a restored or synced choice paints at once.
export function applyTheme(
  choice: ThemeChoice,
  opts: { key?: string; remember?: boolean } = {},
): void {
  paintTheme(choice, opts.remember !== false, opts.remember !== false);
  if (opts.remember !== false) writeStored(opts.key ?? THEME_PREF, choice);
}

function paintTheme(choice: ThemeChoice, animate: boolean, chosen: boolean): void {
  const paint = () => {
    pending = null;
    document.documentElement.setAttribute("data-theme", choice);
    // The color-scheme hint (colorSchemeContent) follows the choice too, so the canvas the browser paints before the CSS
    // and its own controls match it (Modern Web Guidance, dark-mode-toggle).
    const scheme = document.querySelector<HTMLMetaElement>('meta[name="color-scheme"]');
    if (scheme) scheme.content = colorSchemeContent(choice);
    // The browser bar (themeColorMeta): every theme-color tag takes the chosen theme's ground.
    const metas = document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]');
    if (metas.length) {
      const ground = getComputedStyle(document.documentElement).getPropertyValue("--ground").trim();
      if (ground) for (const m of metas) m.content = ground;
    }
  };
  if (!animate || reducedMotion() || !document.startViewTransition) paint();
  else {
    pending = choice;
    document.startViewTransition(paint);
  }
  document.dispatchEvent(new CustomEvent("cap-theme", { detail: { choice, chosen } }));
}

export function writeThemeCookie(choice: ThemeChoice, name = THEME_COOKIE): void {
  document.cookie = themeCookie(choice, { name, secure: location.protocol === "https:" });
}

export function chooseTheme(
  choice: ThemeChoice,
  { key = THEME_PREF, cookie, onSave, onError }: ThemeMemory = {},
  { animate = true }: { animate?: boolean } = {},
): void {
  paintTheme(choice, animate, true);
  if (key) writeStored(key, choice);
  if (cookie) writeThemeCookie(choice, cookie);
  if (!onSave) return;
  // The choice stands in this browser and the cookie whether the save fails at once or later.
  const failed = (error: unknown) => onError?.(error);
  try {
    void Promise.resolve(onSave(choice)).catch(failed);
  } catch (error) {
    failed(error);
  }
}

// Where the server keeps the choice (a cookie, an account): copies the server's answer (the
// data-theme it wrote into the page, or none) into this browser's memory, before any switch reads
// it, so the two agree. With no answer the memory is cleared and the page follows the system.
export function syncServedTheme(key = THEME_PREF): void {
  const served = document.documentElement.getAttribute("data-theme");
  writeStored(key, isChoice(served) ? served : null);
}

export function applyStoredTheme(key = THEME_PREF): ThemeChoice | null {
  const t = readTheme(key);
  if (t) applyTheme(t, { key, remember: false });
  return t;
}

export function effectiveTheme(): ThemeChoice {
  if (pending) return pending;
  const t = document.documentElement.getAttribute("data-theme");
  if (isChoice(t)) return t;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function toggleTheme(key = THEME_PREF, memory: Omit<ThemeMemory, "key"> = {}): ThemeChoice {
  const next = effectiveTheme() === "dark" ? "light" : "dark";
  chooseTheme(next, { ...memory, key });
  return next;
}

function check(el: HTMLElement, choice: ThemeChoice): void {
  for (const r of el.querySelectorAll<HTMLInputElement>("input[type='radio']"))
    r.checked = r.value === choice;
}

export function themeButtonLabel(showing: ThemeChoice): string {
  return showing === "dark" ? "Switch to light theme" : "Switch to dark theme";
}

export function syncThemeButton(
  button: HTMLElement,
  showing: ThemeChoice = effectiveTheme(),
): void {
  const label = themeButtonLabel(showing);
  button.setAttribute("aria-label", label);
  const text = button.querySelector(".cap-theme-tip-text");
  if (text) text.textContent = label;
}

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

// The form variant (data-variant="form"): two real submit buttons post to the site's theme route, so it
// works with no script; CSS shows the one for the theme not showing. data-cap-pref also writes the choice
// to that localStorage key, for an admin shell that reads it there.
function wireForm(form: HTMLFormElement, memory: ThemeMemory): () => void {
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
      {
        ...memory,
        key: form.dataset.capPref ?? null,
        cookie: form.dataset.capCookie ?? THEME_COOKIE,
      },
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

// Attaches to every [data-cap="theme-switch"] under root. With no remembered choice and no checked
// radio, nothing is applied until the person chooses, so the page keeps following the system. A
// cookie or onSave starts from the server's answer (syncServedTheme); `onSave` hears every choice, `onError` a failed save.
export function enhance(
  root: ParentNode = document,
  { onSave, onError }: Pick<ThemeMemory, "onSave" | "onError"> = {},
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
    const memory: ThemeMemory = { key, cookie, onSave, onError };
    if (el.dataset.variant === "form" && el instanceof HTMLFormElement) {
      const unwire = wireForm(el, memory);
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
