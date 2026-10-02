// The tabs' behaviour (WAI-ARIA Authoring Practices, Tabs): one tab stop on the chosen tab
// (a roving tabindex), arrow keys, Home and End move between tabs, a tab chosen shows its
// panel and hides the rest. The markup arrives complete (chosen tab, `tabindex`, `hidden`
// panels), so this module only adds what changes after a person acts. No framework; the
// React wrapper uses the same pure functions.

const READY = "data-cap-ready";

export type Orientation = "horizontal" | "vertical";
export type Activation = "automatic" | "manual";

// The tab to move to for a key, among the tabs that can be chosen. `enabled` holds the
// positions of the tabs not disabled, in order; `current` is the position of the focused
// tab. Left and Right move a horizontal list (swapped in a right-to-left page), Up and Down
// a vertical one; Home and End go to the ends; the ends wrap. Returns the position to focus,
// or null when the key is not one of these.
export function nextTab(enabled: number[], current: number, key: string, orientation: Orientation = "horizontal", rtl = false): number | null {
  if (enabled.length === 0) return null;
  const forward = orientation === "vertical" ? "ArrowDown" : rtl ? "ArrowLeft" : "ArrowRight";
  const back = orientation === "vertical" ? "ArrowUp" : rtl ? "ArrowRight" : "ArrowLeft";
  if (key === "Home") return enabled[0] ?? null;
  if (key === "End") return enabled[enabled.length - 1] ?? null;
  if (key !== forward && key !== back) return null;
  const at = enabled.indexOf(current);
  // From a tab that cannot be chosen, forward starts at the next one after it, back at the one before.
  const step = key === forward ? 1 : -1;
  if (at === -1) {
    const after = enabled.filter((i) => (step === 1 ? i > current : i < current));
    return (step === 1 ? after[0] : after[after.length - 1]) ?? (step === 1 ? enabled[0] : enabled[enabled.length - 1]) ?? null;
  }
  return enabled[(at + step + enabled.length) % enabled.length] ?? null;
}

function listOf(root: HTMLElement): HTMLElement | null {
  return root.querySelector<HTMLElement>(":scope > [role='tablist']");
}

// This tab set's own tabs and panels (not those of a tab set nested in a panel).
export function tabsOf(root: HTMLElement): HTMLElement[] {
  return [...(listOf(root)?.querySelectorAll<HTMLElement>(":scope > [role='tab']") ?? [])];
}
export function panelOf(root: HTMLElement, tab: HTMLElement): HTMLElement | null {
  const id = tab.getAttribute("aria-controls");
  if (!id) return null;
  return [...root.querySelectorAll<HTMLElement>(":scope > [role='tabpanel']")].find((p) => p.id === id) ?? null;
}

function isDisabled(tab: HTMLElement): boolean {
  return tab.getAttribute("aria-disabled") === "true" || (tab as HTMLButtonElement).disabled === true;
}

// Chooses a tab: it becomes the one tab stop, its panel shows, the others hide. A disabled
// tab is not chosen. Tells the page with a `cap:tabs-change` event (bubbles) carrying the
// tab and its panel. Returns whether the tab was chosen.
export function select(root: HTMLElement, tab: HTMLElement, options: { focus?: boolean; silent?: boolean } = {}): boolean {
  if (isDisabled(tab)) return false;
  const tabs = tabsOf(root);
  if (!tabs.includes(tab)) return false;
  const changed = tab.getAttribute("aria-selected") !== "true";
  for (const t of tabs) {
    const on = t === tab;
    t.setAttribute("aria-selected", String(on));
    t.tabIndex = on ? 0 : -1;
    const panel = panelOf(root, t);
    if (panel) panel.hidden = !on;
  }
  if (options.focus) tab.focus();
  // A long list scrolls the chosen tab into view, the least distance that shows it.
  tab.scrollIntoView?.({ block: "nearest", inline: "nearest" });
  if (changed && !options.silent) tab.dispatchEvent(new CustomEvent("cap:tabs-change", { bubbles: true, detail: { tab, panel: panelOf(root, tab) } }));
  return true;
}

function attach(root: HTMLElement): () => void {
  const list = listOf(root);
  if (!list) return () => {};
  const undo: Array<() => void> = [];
  const on = <E extends Event>(type: string, fn: (e: E) => void) => {
    list.addEventListener(type, fn as EventListener);
    undo.push(() => list.removeEventListener(type, fn as EventListener));
  };
  const orientation = (): Orientation => (list.getAttribute("aria-orientation") === "vertical" || root.dataset.orientation === "vertical" ? "vertical" : "horizontal");
  const manual = () => root.dataset.activation === "manual";
  const hashed = () => root.dataset.sync === "hash";

  // Keeps the address in step when asked (data-sync="hash"): the panel's id after the #,
  // so a link opens the tab, and Back does not pile up one entry per click.
  const writeHash = (tab: HTMLElement) => {
    const id = tab.getAttribute("aria-controls");
    if (!hashed() || !id) return;
    try {
      history.replaceState(history.state, "", `#${id}`);
    } catch {
      /* a sandboxed frame may refuse; the tab still changes */
    }
  };
  const fromHash = () => {
    if (!hashed() || !location.hash) return;
    const id = decodeURIComponent(location.hash.slice(1));
    const tab = tabsOf(root).find((t) => t.getAttribute("aria-controls") === id);
    if (tab && tab.getAttribute("aria-selected") !== "true") select(root, tab);
  };

  on<MouseEvent>("click", (e) => {
    const tab = (e.target as HTMLElement).closest<HTMLElement>("[role='tab']");
    if (!tab || tab.parentElement !== list) return;
    if (isDisabled(tab)) {
      e.preventDefault();
      return;
    }
    if (select(root, tab)) writeHash(tab);
  });

  on<KeyboardEvent>("keydown", (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const tab = (e.target as HTMLElement).closest<HTMLElement>("[role='tab']");
    if (!tab || tab.parentElement !== list) return;
    const tabs = tabsOf(root);
    const enabled = tabs.flatMap((t, i) => (isDisabled(t) ? [] : [i]));
    const rtl = getComputedStyle(list).direction === "rtl";
    const to = nextTab(enabled, tabs.indexOf(tab), e.key, orientation(), rtl);
    if (to === null) {
      // Manual activation: Enter and Space on a focused tab choose it (a button does this
      // by itself; a tab that is not a button needs it).
      if ((e.key === "Enter" || e.key === " ") && tab.tagName !== "BUTTON" && select(root, tab)) {
        e.preventDefault();
        writeHash(tab);
      }
      return;
    }
    e.preventDefault();
    const target = tabs[to];
    if (!target) return;
    if (manual()) {
      // Focus moves along the tabs; the chosen one stays the tab stop until Enter or Space.
      for (const t of tabs) t.tabIndex = t === target ? 0 : -1;
      target.focus();
    } else if (select(root, target, { focus: true })) writeHash(target);
  });

  // In manual mode focus may leave a tab that was only focused: the chosen tab is the tab stop again.
  on<FocusEvent>("focusout", (e) => {
    if (!manual()) return;
    const next = e.relatedTarget as Node | null;
    if (next && list.contains(next)) return;
    for (const t of tabsOf(root)) t.tabIndex = t.getAttribute("aria-selected") === "true" ? 0 : -1;
  });

  if (hashed()) {
    window.addEventListener("hashchange", fromHash);
    undo.push(() => window.removeEventListener("hashchange", fromHash));
    fromHash();
  }
  return () => undo.forEach((f) => f());
}

// Attaches every [data-cap="tabs"] under root not yet attached. Returns a function that
// detaches them.
export function enhance(root: ParentNode = document): () => void {
  const undo: Array<() => void> = [];
  for (const el of root.querySelectorAll<HTMLElement>("[data-cap='tabs']")) {
    if (el.hasAttribute(READY)) continue;
    el.setAttribute(READY, "");
    const detach = attach(el);
    undo.push(() => {
      detach();
      el.removeAttribute(READY);
    });
  }
  return () => undo.forEach((f) => f());
}
