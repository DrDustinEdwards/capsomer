// The admin shell's behaviour: collapse the menu (the strip stays), remember the choice, attach
// each control's name tip (Capsomer's tooltip: Esc hides it, WCAG 1.4.13) and jump between apps
// with G and 1 to 9. The header above it (its panels, the account menu and the phone's sheet) is
// the site header's own behaviour, which enhance() attaches too. No framework; the React wrapper
// uses the same functions. The menu's links and the page are in the HTML without any of this.
import { DEFAULT_PREF, readPref, writePref } from "../shell/shell.ts";
import { enhance as enhanceHeader } from "../site-header/site-header.ts";
import { attach as attachTip, hideTip } from "../tooltip/tooltip.ts";

// A count is a glance, not a figure: past 99 it says 99+ (the site header's rule, one for the
// family); the accessible name keeps the real count.
export { badgeText } from "../site-header/site-header.ts";

export const ADMIN_PREF = DEFAULT_PREF;

// Page transitions (the View Transitions API), an option on the shell: `data-transition="page"`
// names the content area, the strip and the menu for the browser, so the content cross-fades
// between pages while the strip and menu stay put (admin-shell.css has the animation, from the
// --dur-* tokens). An app calls this around the update that shows the next page (in React, wrap
// the state change in flushSync). It runs `update` straight away, with no animation and no
// error, when the browser has no document.startViewTransition, when a person asked for reduced
// motion, or when the shell has not opted in. Resolves when the update has been shown.
type Transitioner = { startViewTransition?: (update: () => void | Promise<void>) => { finished: Promise<void> } };

export function pageTransitionsOn(shell: HTMLElement | null = document.querySelector("[data-cap='admin-shell']")): boolean {
  if (!shell || shell.dataset.transition !== "page") return false;
  if (typeof (document as unknown as Transitioner).startViewTransition !== "function") return false;
  return !window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
}

export async function startPageTransition(update: () => void | Promise<void>, shell?: HTMLElement | null): Promise<void> {
  if (!pageTransitionsOn(shell)) return void (await update());
  try {
    await (document as unknown as Required<Transitioner>).startViewTransition(update).finished;
  } catch {
    // A skipped or interrupted transition still showed the page; its animation is all that was lost.
  }
}

export function setMenu(shell: HTMLElement, collapsed: boolean, remember = true): void {
  if (collapsed) shell.dataset.menu = "collapsed";
  else delete shell.dataset.menu;
  const toggle = shell.querySelector<HTMLButtonElement>("[data-cap-part='menu-toggle']");
  if (toggle) {
    const name = collapsed ? "Expand menu" : "Collapse menu";
    toggle.setAttribute("aria-expanded", String(!collapsed));
    toggle.setAttribute("aria-label", name);
    for (const text of toggle.querySelectorAll(":scope > .cap-admin-label, .cap-admin-tip .cap-admin-tip-text")) text.textContent = name;
  }
  if (remember) writePref(shell.dataset.capPref ?? ADMIN_PREF, collapsed ? "collapsed" : "expanded");
}

export function toggleMenu(shell: HTMLElement): void {
  setMenu(shell, shell.dataset.menu !== "collapsed");
}

// G then a number jumps to the app in that place (the sequence GitHub and Linear use; Ctrl and a
// digit belong to the browser's tabs). `armed` holds the time G was pressed. Returns the app's
// address, or null: the key is not part of a jump, the number has no app, that app is already
// open, or the person is typing in a field.
export const JUMP_WINDOW_MS = 1200;
export function jumpTarget(armed: { at: number }, e: Pick<KeyboardEvent, "key" | "ctrlKey" | "metaKey" | "altKey" | "target">, apps: ReadonlyArray<{ href: string; current?: boolean }>, now = Date.now()): string | null {
  if (e.ctrlKey || e.metaKey || e.altKey) return null;
  const t = e.target as Element | null;
  if (t?.closest?.("input, textarea, select, [contenteditable='true']")) return null;
  const live = armed.at > 0 && now - armed.at < JUMP_WINDOW_MS;
  armed.at = e.key === "g" ? now : 0;
  if (!live || !/^[1-9]$/.test(e.key)) return null;
  const app = apps[Number(e.key) - 1];
  return app && !app.current ? app.href : null;
}

// Attaches to every [data-cap="admin-shell"] under root that is not attached yet. Returns a
// function that detaches them all.
export function enhance(root: ParentNode = document): () => void {
  const undo: Array<() => void> = [];
  for (const shell of root.querySelectorAll<HTMLElement>("[data-cap='admin-shell']:not([data-cap-ready])")) {
    shell.dataset.capReady = "";
    const pref = readPref(shell.dataset.capPref ?? ADMIN_PREF);
    if (pref) setMenu(shell, pref === "collapsed", false);

    // Each control's name tip, a child of its control. A menu link's tip repeats its name, so it
    // adds no description; it shows only while the menu is collapsed (admin-shell.css).
    const detachTips = [...shell.querySelectorAll<HTMLElement>(".cap-admin-tip")].map((tip) => {
      const trigger = tip.parentElement;
      if (!trigger) return () => undefined;
      const detach = attachTip(trigger, tip);
      if (trigger.closest(".cap-admin-menu")) trigger.removeAttribute("aria-describedby");
      const used = () => hideTip(trigger);
      trigger.addEventListener("click", used);
      return () => {
        trigger.removeEventListener("click", used);
        detach();
      };
    });
    const detachHeader = enhanceHeader(shell);

    const onClick = (e: MouseEvent) => {
      if ((e.target as Element).closest("[data-cap-part='menu-toggle']")) toggleMenu(shell);
    };
    const armed = { at: 0 };
    const onKey = (e: KeyboardEvent) => {
      const apps = [...shell.querySelectorAll<HTMLAnchorElement>(".cap-admin-tile")].map((a) => ({ href: a.href, current: a.getAttribute("aria-current") === "true" }));
      const to = jumpTarget(armed, e, apps);
      if (to) {
        e.preventDefault();
        location.assign(to);
      }
    };
    shell.addEventListener("click", onClick);
    document.addEventListener("keydown", onKey);
    undo.push(() => {
      shell.removeEventListener("click", onClick);
      detachTips.forEach((f) => f());
      document.removeEventListener("keydown", onKey);
      detachHeader();
      delete shell.dataset.capReady;
    });
  }
  return () => undo.forEach((f) => f());
}
