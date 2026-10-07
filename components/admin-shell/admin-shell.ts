// The admin shell's behaviour: collapse the menu (the strip stays), remember the choice, hide a
// shown name on Esc (WCAG 1.4.13), jump between apps with Ctrl or Cmd and 1 to 9, and the phone
// sheet. No framework; the React wrapper uses the same functions. The menu's links and the page
// are in the HTML without any of this.
import { closeDialog, openDialog, wireDialog } from "../dialog/dialog.ts";
import { DEFAULT_PREF, readPref, writePref } from "../shell/shell.ts";

export const ADMIN_PREF = DEFAULT_PREF;

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

// The app Ctrl or Cmd plus a digit jumps to, or null: the key is not a jump, the digit has no
// app, or that app is the one already open.
export function jumpTarget(e: Pick<KeyboardEvent, "key" | "ctrlKey" | "metaKey" | "altKey" | "shiftKey">, apps: ReadonlyArray<{ href: string; current?: boolean }>): string | null {
  if (!(e.ctrlKey || e.metaKey) || e.altKey || e.shiftKey || !/^[1-9]$/.test(e.key)) return null;
  const app = apps[Number(e.key) - 1];
  return app && !app.current ? app.href : null;
}

// Esc hides the name a strip control is showing, until the pointer or focus moves on.
export function hideShownNames(shell: HTMLElement): void {
  const sel = ".cap-admin-btn, .cap-admin-tile";
  const focused = (document.activeElement as Element | null)?.closest<HTMLElement>(sel);
  const hovered = shell.querySelector<HTMLElement>(".cap-admin-btn:hover, .cap-admin-tile:hover");
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
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") return hideShownNames(shell);
      const apps = [...shell.querySelectorAll<HTMLAnchorElement>(".cap-admin-tile")].map((a) => ({ href: a.href, current: a.getAttribute("aria-current") === "true" }));
      const to = jumpTarget(e, apps);
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
