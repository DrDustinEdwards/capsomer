// The tabs' behavior (WAI-ARIA Authoring Practices, Tabs): one tab stop on the chosen tab
// (a roving tabindex), arrow keys, Home and End move between tabs, a tab chosen shows its
// panel and hides the rest. The markup arrives complete (chosen tab, `tabindex`, `hidden`
// panels), so this module only adds what changes after a person acts; a progressive set
// (data-progressive) arrives as links to every panel and is turned into tabs here. It also keeps
// a remembered choice (data-remember) and drags the pill variant's mark. The keyboard is this
// module's own on purpose: Chrome's focusgroup does not skip a disabled tab (#321). No framework;
// the React wrapper uses the same pure functions.

const READY = "data-cap-ready";
const STOP = "data-cap-tabstop";

// Where the browser has `hidden="until-found"` (Chrome, Edge, Firefox 148), an inactive panel is hidden that way, so
// find-in-page and a link to text inside it still reach it: the browser fires `beforematch` on the panel, which
// chooses its tab. Elsewhere (Safari) the panel is plainly `hidden`, as before. (Modern Web Guidance,
// search-hidden-content.)
export const FINDS_HIDDEN =
  typeof HTMLElement !== "undefined" && "onbeforematch" in HTMLElement.prototype;

// Remembered tabs (data-remember="<key>", or the React wrapper's `remember`): the reader's choice is kept on this
// device under "capsomer.tabs.<key>" and chosen in every tab set on every page that names the same key, and in other
// windows. Storage can be refused (a private window, blocked site data); the choice then lasts the page.
// readStored, writeStored and subscribeStored have the shape of 0.91.0's capsomer/behavior/hooks functions of the same
// names: switch to them by replacing these three definitions with one import from "../hooks/hooks.ts".
const memory = new Map<string, string>();
const listeners = new Set<() => void>();
function readStored(key: string): string | null {
  try {
    return localStorage.getItem(key) ?? memory.get(key) ?? null;
  } catch {
    return memory.get(key) ?? null;
  }
}
function writeStored(key: string, value: string | null): void {
  if (value === null) memory.delete(key);
  else memory.set(key, value);
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch {
    /* not kept; this page still follows the choice, from memory */
  }
  for (const listener of listeners) listener();
}
function subscribeStored(listener: () => void): () => void {
  listeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

const REMEMBER_PREFIX = "capsomer.tabs.";

export function readRemembered(key: string): string | null {
  return readStored(REMEMBER_PREFIX + key);
}

/** Keeps a choice; every tab set remembering the same key follows it. */
export function writeRemembered(key: string, value: string): void {
  writeStored(REMEMBER_PREFIX + key, value);
}

/** Calls back with each new choice made for `key`, on this page or in another window. */
export function onRemembered(key: string, fn: (value: string) => void): () => void {
  let last = readRemembered(key);
  return subscribeStored(() => {
    const now = readRemembered(key);
    if (now === null || now === last) return;
    last = now;
    fn(now);
  });
}

// A first guess when nothing is remembered: data-remember-guess="platform" picks the tab whose value is the reader's
// system ("windows", "macos" or "linux"), from the browser's report; null when it says none of those.
export function guessPlatform(
  ua: string = typeof navigator === "undefined" ? "" : navigator.userAgent,
): string | null {
  if (/Windows/.test(ua)) return "windows";
  if (/Mac OS X|Macintosh/.test(ua)) return "macos";
  if (/Linux|X11/.test(ua)) return "linux";
  return null;
}

/** A tab's value: its `data-value`, else the id of the panel it controls. */
export function tabValue(tab: HTMLElement): string {
  return tab.dataset.value ?? tab.getAttribute("aria-controls") ?? "";
}

// Page tabs (PageTabs, or links written by hand): each tab is the page's address with ?tab=<id>, the first tab the
// bare address, other query parameters kept.
/** The ?tab= value an address's query names, or null. */
export function tabParam(search: string, param = "tab"): string | null {
  return new URLSearchParams(search).get(param);
}
/** The address of a page tab: `path` with `search`'s other parameters and ?tab=id (none for the first tab). */
export function pageTabHref(
  path: string,
  search: string,
  id: string,
  firstId: string | undefined,
  param = "tab",
): string {
  const qs = new URLSearchParams(search);
  if (id === firstId) qs.delete(param);
  else qs.set(param, id);
  const q = qs.toString();
  return `${path}${q ? `?${q}` : ""}`;
}

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
// A panel is a child of the set, or deeper in it when a layout wraps the panels (a column beside them),
// so long as no tab set nested inside holds it.
export function panelsOf(root: HTMLElement): HTMLElement[] {
  return [...root.querySelectorAll<HTMLElement>("[role='tabpanel']")].filter(
    (p) =>
      p.parentElement === root || p.parentElement?.closest("[data-cap='tabs'], .cap-tabs") === root,
  );
}
export function panelOf(root: HTMLElement, tab: HTMLElement): HTMLElement | null {
  const id = tab.getAttribute("aria-controls");
  if (!id) return null;
  return panelsOf(root).find((p) => p.id === id) ?? null;
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

// Progressive tabs (data-progressive on .cap-tabs): the server sends the list as links to the panels (`href="#id"`)
// and every panel showing, each under its own name (`.cap-tabs-panel-label`), which is the whole page with script off,
// on paper and for a machine. This turns the links into tabs: the list a tablist (named by its aria-label, or its
// data-label), each link a tab, each panel a tabpanel, one panel showing. Returns whether the set is tabs now.
export function upgrade(root: HTMLElement): boolean {
  if (listOf(root)) return true;
  if (!root.hasAttribute("data-progressive")) return false;
  const list = root.querySelector<HTMLElement>(":scope > .cap-tabs-list");
  if (!list) return false;
  const panels = [...root.querySelectorAll<HTMLElement>(".cap-tabs-panel[id]")].filter(
    (p) => p.parentElement?.closest("[data-cap='tabs'], .cap-tabs") === root,
  );
  const pairs = [...list.querySelectorAll<HTMLAnchorElement>(":scope > a.cap-tab")].flatMap((a) => {
    let id = a.hash.slice(1);
    try {
      id = decodeURIComponent(id);
    } catch {
      /* keep raw */
    }
    const panel = id ? panels.find((p) => p.id === id) : undefined;
    return panel ? [{ tab: a as HTMLElement, panel }] : [];
  });
  if (pairs.length === 0) return false;
  list.setAttribute("role", "tablist");
  if (!list.hasAttribute("aria-label") && list.dataset.label)
    list.setAttribute("aria-label", list.dataset.label);
  if (root.dataset.orientation === "vertical") list.setAttribute("aria-orientation", "vertical");
  for (const { tab, panel } of pairs) {
    const on = tab === pairs[0]?.tab;
    tab.setAttribute("role", "tab");
    tab.id ||= `${panel.id}-tab`;
    tab.setAttribute("aria-controls", panel.id);
    tab.setAttribute("aria-selected", String(on));
    tab.tabIndex = on ? 0 : -1;
    panel.setAttribute("role", "tabpanel");
    panel.setAttribute("aria-labelledby", tab.id);
    if (!panel.hasAttribute("tabindex")) panel.tabIndex = 0;
    panel.hidden = !on;
  }
  return true;
}

// The pill variant's mark follows a drag (data-variant="pill", a horizontal list): press anywhere on the list and
// slide, and the mark moves with the pointer, held between the first and last tab; let go and the tab nearest the mark
// is chosen through `pick`, and the mark settles on it. A press that does not move is a click, as on any tab. The mark's
// place while dragging goes through the CSSOM (--cap-pill-start, --cap-pill-end); the tab under it carries data-near.
export function attachPillDrag(list: HTMLElement, pick: (tab: HTMLElement) => void): () => void {
  let start = 0;
  let base: HTMLElement | null = null;
  let near: HTMLElement | null = null;
  let id: number | null = null;
  let dragging = false;
  let swallow = false;
  const tabs = () =>
    [...list.querySelectorAll<HTMLElement>(":scope > [role='tab']")].filter((t) => !isDisabled(t));
  // A tab's start, in the list's padding box (where its ::before is placed), taking the list's scroll into account.
  const xOf = (t: HTMLElement) =>
    t.getBoundingClientRect().left -
    list.getBoundingClientRect().left -
    list.clientLeft +
    list.scrollLeft;
  const clear = () => {
    dragging = false;
    id = null;
    list.removeAttribute("data-dragging");
    near?.removeAttribute("data-near");
    near = null;
    list.style.removeProperty("--cap-pill-start");
    list.style.removeProperty("--cap-pill-end");
  };
  const down = (e: PointerEvent) => {
    if (list.dataset.variant !== "pill" || list.getAttribute("aria-orientation") === "vertical")
      return;
    if (!e.isPrimary || e.button !== 0) return;
    base = tabs().find((t) => t.getAttribute("aria-selected") === "true") ?? null;
    if (!base) return;
    start = e.clientX;
    id = e.pointerId;
  };
  const move = (e: PointerEvent) => {
    if (e.pointerId !== id || !base) return;
    const dx = e.clientX - start;
    if (!dragging) {
      if (Math.abs(dx) <= 4) return;
      dragging = true;
      list.setAttribute("data-dragging", "");
      try {
        list.setPointerCapture(e.pointerId);
      } catch {
        /* the pointer is gone */
      }
    }
    const all = tabs();
    const first = all[0];
    const last = all[all.length - 1];
    if (!first || !last) return;
    const width = base.getBoundingClientRect().width;
    const x = Math.min(xOf(last), Math.max(xOf(first), xOf(base) + dx));
    list.style.setProperty("--cap-pill-start", `${x}px`);
    list.style.setProperty("--cap-pill-end", `${list.clientWidth - x - width}px`);
    let best = first;
    for (const t of all) if (Math.abs(xOf(t) - x) < Math.abs(xOf(best) - x)) best = t;
    if (best !== near) {
      near?.removeAttribute("data-near");
      best.setAttribute("data-near", "");
      near = best;
    }
  };
  const up = (e: PointerEvent) => {
    if (e.pointerId !== id) return;
    const was = dragging ? near : null;
    clear();
    if (!was) return;
    // The click that follows a drag is not a choice of the tab under the pointer.
    swallow = true;
    setTimeout(() => (swallow = false), 0);
    pick(was);
  };
  const cancel = (e: PointerEvent) => {
    if (e.pointerId === id) clear();
  };
  const click = (e: MouseEvent) => {
    if (!swallow || !e.isTrusted) return;
    swallow = false;
    e.preventDefault();
    e.stopPropagation();
  };
  list.addEventListener("pointerdown", down);
  list.addEventListener("pointermove", move);
  list.addEventListener("pointerup", up);
  list.addEventListener("pointercancel", cancel);
  list.addEventListener("click", click, true);
  return () => {
    clear();
    list.removeEventListener("pointerdown", down);
    list.removeEventListener("pointermove", move);
    list.removeEventListener("pointerup", up);
    list.removeEventListener("pointercancel", cancel);
    list.removeEventListener("click", click, true);
  };
}

function attach(root: HTMLElement): () => void {
  upgrade(root);
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
    // A progressive tab is a link to its panel: choosing it does not jump the page.
    if (tab.tagName === "A" || isDisabled(tab)) e.preventDefault();
    if (isDisabled(tab)) return;
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
    const panels = panelsOf(root);
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

  // Remembered: the reader's earlier choice (or the guess) on load, each new choice kept and followed by every set
  // that remembers the same key. An address with the panel's hash, below, still wins.
  const key = root.dataset.remember;
  if (key) {
    let applying = false;
    const pick = (value: string | null, silent: boolean) => {
      const tab = value ? tabsOf(root).find((t) => tabValue(t) === value) : undefined;
      if (!tab) return false;
      applying = true;
      try {
        return select(root, tab, { silent });
      } finally {
        applying = false;
      }
    };
    if (!pick(readRemembered(key), true) && root.dataset.rememberGuess === "platform")
      pick(guessPlatform(), true);
    const keep = (e: Event) => {
      const tab = (e as CustomEvent<{ tab: HTMLElement }>).detail?.tab;
      if (applying || !tab || tab.parentElement !== list) return;
      writeRemembered(key, tabValue(tab));
    };
    root.addEventListener("cap:tabs-change", keep);
    undo.push(() => root.removeEventListener("cap:tabs-change", keep));
    undo.push(onRemembered(key, (value) => void pick(value, false)));
  }

  undo.push(
    attachPillDrag(list, (tab) => {
      if (select(root, tab)) writeHash(tab);
    }),
  );

  if (hashed()) {
    window.addEventListener("hashchange", fromHash);
    undo.push(() => window.removeEventListener("hashchange", fromHash));
    fromHash();
  }
  return () => undo.forEach((f) => f());
}

// Attaches every [data-cap="tabs"] under root not yet attached. Returns a function that
// detaches them. Document | Element, not ParentNode: under the Workers types an HTMLElement is
// not a ParentNode (their Element's append differs), so enhance(root) failed to typecheck in bsw.
export function enhance(root: Document | Element = document): () => void {
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
