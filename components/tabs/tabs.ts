// The tabs' behavior (WAI-ARIA Authoring Practices, Tabs): one tab stop on the chosen tab
// (a roving tabindex), arrow keys, Home and End move between tabs, a tab chosen shows its
// panel and hides the rest. The markup arrives complete (chosen tab, `tabindex`, `hidden`
// panels), so this module only adds what changes after a person acts. No framework; the
// React wrapper uses the same pure functions.

const READY = "data-cap-ready";
const STOP = "data-cap-tabstop";

// Where the browser has `hidden="until-found"` (Chrome, Edge, Firefox 148), an inactive panel is hidden that way, so
// find-in-page and a link to text inside it still reach it: the browser fires `beforematch` on the panel, which
// chooses its tab. Elsewhere (Safari) the panel is plainly `hidden`, as before. (Modern Web Guidance,
// search-hidden-content.)
export const FINDS_HIDDEN =
  typeof HTMLElement !== "undefined" && "onbeforematch" in HTMLElement.prototype;

// A disabled tab's panel cannot be chosen, so a match must not open it: it stays plainly hidden.
function disabledTabOf(panel: HTMLElement): boolean {
  const id = panel.getAttribute("aria-labelledby");
  const tab = id ? panel.ownerDocument.getElementById(id) : null;
  return !!tab && isDisabled(tab);
}

/** Shows a panel, or hides it in the way this browser can still search (not the panel of a disabled tab). */
export function setPanelHidden(panel: HTMLElement, hide: boolean): void {
  if (!hide) {
    panel.hidden = false;
    // Its tab stop back (taken below while it was hidden until found).
    if (panel.hasAttribute(STOP)) {
      panel.setAttribute("tabindex", panel.getAttribute(STOP) ?? "0");
      panel.removeAttribute(STOP);
    }
  } else if (FINDS_HIDDEN && !disabledTabOf(panel)) {
    panel.setAttribute("hidden", "until-found");
    // The browser skips the panel's contents but not the panel itself, whose tabindex="0" would still be a Tab stop.
    // (inert would end that too, but inert text is left out of find-in-page.)
    const stop = panel.getAttribute("tabindex");
    if (stop !== null && stop !== "-1" && !panel.hasAttribute(STOP)) {
      panel.setAttribute(STOP, stop);
      panel.tabIndex = -1;
    }
  } else panel.hidden = true;
}

export type Orientation = "horizontal" | "vertical";
export type Activation = "automatic" | "manual";

// The tab to move to for a key, among the tabs that can be chosen. `enabled` holds the
// positions of the tabs not disabled, in order; `current` is the position of the focused
// tab. Left and Right move a horizontal list (swapped in a right-to-left page), Up and Down
// a vertical one; Home and End go to the ends; the ends wrap. Returns the position to focus,
// or null when the key is not one of these.
export function nextTab(
  enabled: number[],
  current: number,
  key: string,
  orientation: Orientation = "horizontal",
  rtl = false,
): number | null {
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
    return (
      (step === 1 ? after[0] : after[after.length - 1]) ??
      (step === 1 ? enabled[0] : enabled[enabled.length - 1]) ??
      null
    );
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
  return (
    [...root.querySelectorAll<HTMLElement>(":scope > [role='tabpanel']")].find(
      (p) => p.id === id,
    ) ?? null
  );
}

function isDisabled(tab: HTMLElement): boolean {
  return (
    tab.getAttribute("aria-disabled") === "true" || (tab as HTMLButtonElement).disabled === true
  );
}

// Chooses a tab: it becomes the one tab stop, its panel shows, the others hide. A disabled
// tab is not chosen. Tells the page with a `cap:tabs-change` event (bubbles) carrying the
// tab and its panel. Returns whether the tab was chosen.
export function select(
  root: HTMLElement,
  tab: HTMLElement,
  options: { focus?: boolean; silent?: boolean } = {},
): boolean {
  if (isDisabled(tab)) return false;
  const tabs = tabsOf(root);
  if (!tabs.includes(tab)) return false;
  const changed = tab.getAttribute("aria-selected") !== "true";
  for (const t of tabs) {
    const on = t === tab;
    t.setAttribute("aria-selected", String(on));
    t.tabIndex = on ? 0 : -1;
    const panel = panelOf(root, t);
    if (panel) setPanelHidden(panel, !on);
  }
  if (options.focus) tab.focus();
  // A long list scrolls the chosen tab into view, the least distance that shows it. Only the list
  // scrolls, by hand: scrollIntoView also scrolls the page and moves the browser's Tab starting
  // point to the tab, so the first Tab press on load skipped the skip link and header.
  const list = listOf(root);
  if (list) {
    const box = list.getBoundingClientRect();
    const at = tab.getBoundingClientRect();
    if (list.scrollWidth > list.clientWidth)
      list.scrollLeft +=
        at.left < box.left ? at.left - box.left : Math.max(0, at.right - box.right);
    if (list.scrollHeight > list.clientHeight)
      list.scrollTop += at.top < box.top ? at.top - box.top : Math.max(0, at.bottom - box.bottom);
  }
  if (changed && !options.silent)
    tab.dispatchEvent(
      new CustomEvent("cap:tabs-change", {
        bubbles: true,
        detail: { tab, panel: panelOf(root, tab) },
      }),
    );
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
  const orientation = (): Orientation =>
    list.getAttribute("aria-orientation") === "vertical" || root.dataset.orientation === "vertical"
      ? "vertical"
      : "horizontal";
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
    // A malformed escape (#%) throws URIError, which here ran inside init and stopped every later
    // tab set on the page; fall back to the raw text as the link component does.
    const raw = location.hash.slice(1);
    let id = raw;
    try {
      id = decodeURIComponent(raw);
    } catch {
      /* keep raw */
    }
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

  // Find-in-page or a text fragment matched inside an inactive panel: choose its tab first.
  if (FINDS_HIDDEN) {
    const panels = [...root.querySelectorAll<HTMLElement>(":scope > [role='tabpanel']")];
    for (const p of panels) if (p.hidden) setPanelHidden(p, true);
    const onMatch = (e: Event) => {
      const panel = e.target as HTMLElement;
      if (!panels.includes(panel)) return;
      const tab = tabsOf(root).find((t) => t.getAttribute("aria-controls") === panel.id);
      if (tab && select(root, tab)) writeHash(tab);
    };
    root.addEventListener("beforematch", onMatch);
    undo.push(() => root.removeEventListener("beforematch", onMatch));
  }

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
