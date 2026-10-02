// The shell's behaviour: the rail's collapse button, the remembered choice, the More sheet,
// the density choice, and Esc to dismiss a collapsed rail's label (WCAG 1.4.13). No framework;
// the React wrapper uses the same functions. readPref and writePref are shared with the theme
// switch and the shortcuts, so they stay exported.
import { closeDialog, openDialog, wireDialog } from "../dialog/dialog.ts";

export const DEFAULT_PREF = "cap-rail";

export function readPref(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function writePref(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Private windows and blocked storage: the choice lasts for this page only.
  }
}

// Collapses or expands the rail of one shell, and keeps its toggle's state and name true.
export function setRail(shell: HTMLElement, collapsed: boolean, remember = true): void {
  if (collapsed) shell.dataset.rail = "collapsed";
  else delete shell.dataset.rail;
  const toggle = shell.querySelector<HTMLButtonElement>("[data-cap-part='rail-toggle']");
  if (toggle) {
    toggle.setAttribute("aria-expanded", String(!collapsed));
    const label = toggle.querySelector(".cap-shell-label");
    if (label) label.textContent = collapsed ? "Expand menu" : "Collapse menu";
  }
  if (remember) writePref(shell.dataset.capPref ?? DEFAULT_PREF, collapsed ? "collapsed" : "expanded");
}

export function toggleRail(shell: HTMLElement): void {
  setRail(shell, shell.dataset.rail !== "collapsed");
}

// The phone tab bar's More sheet: the shared dialog (components/dialog) as a bottom sheet,
// which the More button opens. The dialog gives Esc, the inert page, the backdrop click, the
// focus trap and the hand-back of focus to More; this adds aria-expanded on the button.
export function openMore(shell: HTMLElement): void {
  const button = shell.querySelector<HTMLButtonElement>("[data-cap-part='more']");
  const dialog = shell.querySelector<HTMLDialogElement>("dialog.cap-shell-more");
  if (!dialog || dialog.open) return;
  openDialog(dialog, button);
  button?.setAttribute("aria-expanded", "true");
}

export function closeMore(shell: HTMLElement): void {
  const dialog = shell.querySelector<HTMLDialogElement>("dialog.cap-shell-more");
  if (dialog?.open) closeDialog(dialog);
}

// Density: the choice of how roomy the app is, on the root as data-density, remembered in
// this browser like the theme. With no choice made the attribute is left off and the default
// (compact) applies. An app puts the choice on its Settings page, and runs applyStoredDensity()
// before first paint beside applyStoredTheme().
export type Density = "compact" | "comfortable";
export const DENSITY_PREF = "cap-density";
const isDensity = (v: string | null | undefined): v is Density => v === "compact" || v === "comfortable";

export function readDensity(key = DENSITY_PREF): Density | null {
  const v = readPref(key);
  return isDensity(v) ? v : null;
}

export function applyDensity(choice: Density, opts: { key?: string; remember?: boolean } = {}): void {
  document.documentElement.setAttribute("data-density", choice);
  if (opts.remember !== false) writePref(opts.key ?? DENSITY_PREF, choice);
  document.dispatchEvent(new CustomEvent("cap-density", { detail: { choice } }));
}

export function applyStoredDensity(key = DENSITY_PREF): Density | null {
  const d = readDensity(key);
  if (d) applyDensity(d, { key, remember: false });
  return d;
}

// Attaches to every [data-cap="shell"] under root that is not attached yet. Returns a
// function that detaches them all.
export function enhance(root: ParentNode = document): () => void {
  const undo: Array<() => void> = [];
  for (const shell of root.querySelectorAll<HTMLElement>("[data-cap='shell']:not([data-cap-ready])")) {
    shell.dataset.capReady = "";
    const pref = readPref(shell.dataset.capPref ?? DEFAULT_PREF);
    if (pref) setRail(shell, pref === "collapsed", false);

    const more = shell.querySelector<HTMLDialogElement>("dialog.cap-shell-more");
    const moreButton = shell.querySelector<HTMLButtonElement>("[data-cap-part='more']");
    const onClick = (e: MouseEvent) => {
      const target = e.target as Element;
      if (target.closest("[data-cap-part='rail-toggle']")) toggleRail(shell);
      if (target.closest("[data-cap-part='more']")) openMore(shell);
      // The dialog closes itself on Close and the backdrop; a link inside closes it too.
      if (more?.open && target.closest("a") && more.contains(target)) closeDialog(more);
    };
    // Closed by Esc, Close, a link or the backdrop: More says so, and the dialog hands focus back to it.
    const onMoreClose = () => moreButton?.setAttribute("aria-expanded", "false");
    const unwireMore = more ? wireDialog(more) : null;
    more?.addEventListener("close", onMoreClose);
    // Esc hides the label a collapsed rail is showing, until the pointer or focus moves on.
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || shell.dataset.rail !== "collapsed") return;
      const entry = (document.activeElement as Element | null)?.closest<HTMLElement>(".cap-shell-rail a, .cap-shell-toggle, .cap-shell-railbtn");
      const hovered = shell.querySelector<HTMLElement>(".cap-shell-rail a:hover, .cap-shell-toggle:hover, .cap-shell-railbtn:hover");
      for (const el of [entry, hovered]) if (el && shell.contains(el)) el.dataset.tip = "hidden";
    };
    const reset = (e: Event) => {
      const el = (e.target as Element).closest<HTMLElement>("[data-tip='hidden']");
      if (el) delete el.dataset.tip;
    };
    shell.addEventListener("click", onClick);
    document.addEventListener("keydown", onKey);
    shell.addEventListener("mouseout", reset);
    shell.addEventListener("focusout", reset);
    undo.push(() => {
      shell.removeEventListener("click", onClick);
      more?.removeEventListener("close", onMoreClose);
      unwireMore?.();
      document.removeEventListener("keydown", onKey);
      shell.removeEventListener("mouseout", reset);
      shell.removeEventListener("focusout", reset);
      delete shell.dataset.capReady;
    });
  }
  return () => undo.forEach((f) => f());
}
