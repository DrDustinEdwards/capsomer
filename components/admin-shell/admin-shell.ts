// The admin shell's behaviour: collapse the menu (the strip stays), remember the choice, hide a
// shown name on Esc (WCAG 1.4.13), jump between apps with Ctrl or Cmd and 1 to 9, and the phone
// sheet. No framework; the React wrapper uses the same functions. The menu's links and the page
// are in the HTML without any of this.
import { closeDialog, openDialog, wireDialog } from "../dialog/dialog.ts";
import { DEFAULT_PREF, readPref, writePref } from "../shell/shell.ts";

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
    toggle.setAttribute("aria-expanded", String(!collapsed));
    toggle.setAttribute("aria-label", collapsed ? "Expand menu" : "Collapse menu");
    const tip = toggle.querySelector(".cap-admin-tip-text");
    if (tip) tip.textContent = collapsed ? "Expand menu" : "Collapse menu";
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

// Esc hides the name a strip control is showing, until the pointer or focus moves on.
export function hideShownNames(shell: HTMLElement): void {
  const sel = ".cap-admin-btn, .cap-admin-tile, .cap-admin-menu a";
  const focused = (document.activeElement as Element | null)?.closest<HTMLElement>(sel);
  const hovered = shell.querySelector<HTMLElement>(".cap-admin-btn:hover, .cap-admin-tile:hover, .cap-admin-menu a:hover");
  for (const el of [focused, hovered]) if (el && shell.contains(el)) el.dataset.tip = "hidden";
}

export function showNamesAgain(e: { target: EventTarget | null }): void {
  const el = (e.target as Element).closest<HTMLElement>("[data-tip='hidden']");
  if (el) delete el.dataset.tip;
}

export function openSheet(shell: HTMLElement): void {
  const button = shell.querySelector<HTMLButtonElement>("[data-cap-part='more']");
  const dialog = shell.querySelector<HTMLDialogElement>("dialog.cap-admin-sheet");
  if (!dialog || dialog.open) return;
  openDialog(dialog, button);
  button?.setAttribute("aria-expanded", "true");
}

export function closeSheet(shell: HTMLElement): void {
  const dialog = shell.querySelector<HTMLDialogElement>("dialog.cap-admin-sheet");
  if (dialog?.open) closeDialog(dialog);
}

// Attaches to every [data-cap="admin-shell"] under root that is not attached yet. Returns a
// function that detaches them all.
export function enhance(root: ParentNode = document): () => void {
  const undo: Array<() => void> = [];
  for (const shell of root.querySelectorAll<HTMLElement>("[data-cap='admin-shell']:not([data-cap-ready])")) {
    shell.dataset.capReady = "";
    const pref = readPref(shell.dataset.capPref ?? ADMIN_PREF);
    if (pref) setMenu(shell, pref === "collapsed", false);

    const sheet = shell.querySelector<HTMLDialogElement>("dialog.cap-admin-sheet");
    const moreButton = shell.querySelector<HTMLButtonElement>("[data-cap-part='more']");
    const unwireSheet = sheet ? wireDialog(sheet) : null;
    const onSheetClose = () => moreButton?.setAttribute("aria-expanded", "false");
    sheet?.addEventListener("close", onSheetClose);

    const onClick = (e: MouseEvent) => {
      const target = e.target as Element;
      if (target.closest("[data-cap-part='menu-toggle']")) toggleMenu(shell);
      if (target.closest("[data-cap-part='more']")) openSheet(shell);
      if (sheet?.open && target.closest("a") && sheet.contains(target)) closeDialog(sheet);
      // A link in the account panel closes the panel.
      const panel = target.closest<HTMLElement>(".cap-admin-account");
      if (panel && target.closest("a, button")) panel.hidePopover?.();
    };
    const armed = { at: 0 };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") return hideShownNames(shell);
      const apps = [...shell.querySelectorAll<HTMLAnchorElement>(".cap-admin-tile")].map((a) => ({ href: a.href, current: a.getAttribute("aria-current") === "true" }));
      const to = jumpTarget(armed, e, apps);
      if (to) {
        e.preventDefault();
        location.assign(to);
      }
    };
    shell.addEventListener("click", onClick);
    shell.addEventListener("mouseout", showNamesAgain);
    shell.addEventListener("focusout", showNamesAgain);
    document.addEventListener("keydown", onKey);
    undo.push(() => {
      shell.removeEventListener("click", onClick);
      shell.removeEventListener("mouseout", showNamesAgain);
      shell.removeEventListener("focusout", showNamesAgain);
      document.removeEventListener("keydown", onKey);
      sheet?.removeEventListener("close", onSheetClose);
      unwireSheet?.();
      delete shell.dataset.capReady;
    });
  }
  return () => undo.forEach((f) => f());
}
