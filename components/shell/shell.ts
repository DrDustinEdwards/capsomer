// The shell's behaviour: the rail's collapse button, the remembered choice, and Esc to
// dismiss a collapsed rail's label (WCAG 1.4.13). No framework; the React wrapper uses the
// same functions.

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

// The phone tab bar's More sheet: a native modal dialog the More button opens. Esc closes it
// natively; closing by any route puts focus back on More and keeps aria-expanded true.
export function openMore(shell: HTMLElement): void {
  const button = shell.querySelector<HTMLButtonElement>("[data-cap-part='more']");
  const dialog = shell.querySelector<HTMLDialogElement>("dialog.cap-shell-more");
  if (!dialog || dialog.open) return;
  dialog.showModal();
  button?.setAttribute("aria-expanded", "true");
}

export function closeMore(shell: HTMLElement): void {
  const dialog = shell.querySelector<HTMLDialogElement>("dialog.cap-shell-more");
  if (dialog?.open) dialog.close();
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
      // A click on the backdrop lands on the dialog itself; a link or Close inside closes it.
      if (more?.open && (target === more || target.closest("a, [data-cap-part='more-close']"))) more.close();
    };
    // Closed by Esc, Close, a link or the backdrop: focus goes back to More.
    const onMoreClose = () => {
      moreButton?.setAttribute("aria-expanded", "false");
      moreButton?.focus();
    };
    more?.addEventListener("close", onMoreClose);
    // Esc hides the label a collapsed rail is showing, until the pointer or focus moves on.
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || shell.dataset.rail !== "collapsed") return;
      const entry = (document.activeElement as Element | null)?.closest<HTMLElement>(".cap-shell-rail a, .cap-shell-toggle");
      const hovered = shell.querySelector<HTMLElement>(".cap-shell-rail a:hover, .cap-shell-toggle:hover");
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
      document.removeEventListener("keydown", onKey);
      shell.removeEventListener("mouseout", reset);
      shell.removeEventListener("focusout", reset);
      delete shell.dataset.capReady;
    });
  }
  return () => undo.forEach((f) => f());
}
