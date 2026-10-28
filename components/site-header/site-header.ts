// The site header's behavior: the panels (the switcher, a section with children, the account),
// the phone's sheet, and each icon control's name tip. No framework; the React wrapper uses the
// same functions. Every link, the logo, Sign in and the controls are in the HTML without any of
// this; a panel's contents are too, so a page with no script still reads and reaches them.
//
// A panel is a list of links under a disclosure button (aria-expanded, aria-controls), not an
// ARIA menu: every item goes somewhere. It is a manual popover in the top layer, so it is above
// the page and every rail, and this module gives it light dismiss and Esc. On a mouse it opens at
// once on hover, with no delay, and on click; on touch, on tap. Opened from the keyboard, focus
// moves to its first item; Up and Down move between items, Home and End go to the ends, Esc closes
// it and focus goes back to its button.
import { closeDialog, openDialog, wireDialog } from "../dialog/dialog.ts";
import { escapeHtml } from "../email/email.ts";
import { place } from "../popover/popover.ts";
import { attach as attachTip, hideTip } from "../tooltip/tooltip.ts";

// A count is a glance, not a figure: past 99 it says 99+, in the header, the sheet, the bottom bar
// and the admin shell alike; the accessible name keeps the real count.
export const badgeText = (count: number): string => (count > 99 ? "99+" : String(count));

// How long a panel opened by hover stays after the pointer leaves both it and its button, so the
// pointer can cross the gap between them.
export const HOVER_GRACE_MS = 150;

// The phone layout's width (docs/design/design-site-header.md, section 5): under 768px.
export const PHONE_QUERY = "(max-width: 767.98px)";

// The next item for a key in a panel of `count` items with `at` focused (-1: none yet). Returns
// null for a key that does not move. Up and Down wrap; Home and End go to the ends.
export function stepIndex(count: number, at: number, key: string): number | null {
  if (count === 0) return null;
  if (key === "Home") return 0;
  if (key === "End") return count - 1;
  if (key === "ArrowDown") return at < 0 ? 0 : (at + 1) % count;
  if (key === "ArrowUp") return at < 0 ? count - 1 : (at - 1 + count) % count;
  return null;
}

// The items a panel holds that a person can reach: links and enabled buttons that are drawn.
export function panelItems(panel: HTMLElement): HTMLElement[] {
  return [...panel.querySelectorAll<HTMLElement>("a[href], button:not(:disabled)")].filter((el) => el.getClientRects().length > 0);
}

const isOpen = (panel: HTMLElement): boolean => {
  try {
    return panel.matches(":popover-open");
  } catch {
    return false;
  }
};

// Every panel this module has wired, so opening one closes the others in the same header.
const panels = new Map<HTMLElement, { trigger: HTMLElement; close: () => void }>();

export function closePanels(except?: HTMLElement): void {
  for (const [panel, p] of panels) if (panel !== except && isOpen(panel)) p.close();
}

// Puts a panel under its button, lined up with the button's edge (start, or end with
// data-align="end"), its top just under the header's bottom edge so it never covers the header.
export function placePanel(trigger: HTMLElement, panel: HTMLElement): void {
  const bar = trigger.closest(".cap-site-header")?.getBoundingClientRect();
  const t = trigger.getBoundingClientRect();
  const offset = bar ? Math.max(4, Math.round(bar.bottom - t.bottom) + 4) : 4;
  place(trigger, panel, { side: "bottom", align: panel.dataset.align === "end" ? "end" : "start", offset });
}

let escBound = false;
function onEsc(e: KeyboardEvent): void {
  if (e.key !== "Escape") return;
  for (const [panel, p] of panels) {
    if (!isOpen(panel)) continue;
    e.preventDefault();
    const inside = panel.contains(document.activeElement) || p.trigger === document.activeElement;
    p.close();
    if (inside) p.trigger.focus({ preventScroll: true });
  }
}

// Wires one disclosure button to its panel. Returns a function that unwires it.
// Adds a listener and keeps its removal (wirePanel, wireSearch).
type On = <E extends Event>(target: EventTarget, type: string, fn: (e: E) => void, opts?: boolean | AddEventListenerOptions) => void;

// Focus leaving an open panel for anything but its button closes it, as does a press outside both.
function dismissOutside(on: On, trigger: HTMLElement, panel: HTMLElement, close: () => void): void {
  on(panel, "focusout", (e: FocusEvent) => {
    const to = e.relatedTarget as Node | null;
    if (to && !panel.contains(to) && to !== trigger) close();
  });
  on(document, "pointerdown", (e: PointerEvent) => {
    const t = e.target as Node;
    if (isOpen(panel) && !panel.contains(t) && !trigger.contains(t)) close();
  });
}

export function wirePanel(trigger: HTMLElement, panel: HTMLElement): () => void {
  if (!panel.hasAttribute("popover")) panel.setAttribute("popover", "manual");
  trigger.setAttribute("aria-expanded", String(isOpen(panel)));
  if (panel.id) trigger.setAttribute("aria-controls", panel.id);
  // How it was opened: by hover it closes when the pointer leaves; by a click or a key it stays.
  let mode: "hover" | "held" = "held";
  let timer: number | undefined;
  const undo: Array<() => void> = [];
  const on = <E extends Event>(target: EventTarget, type: string, fn: (e: E) => void, opts?: boolean | AddEventListenerOptions) => {
    target.addEventListener(type, fn as EventListener, opts);
    undo.push(() => target.removeEventListener(type, fn as EventListener, opts));
  };
  const follow = () => {
    if (isOpen(panel)) placePanel(trigger, panel);
  };
  const close = () => {
    window.clearTimeout(timer);
    if (isOpen(panel)) panel.hidePopover();
  };
  const open = (how: "hover" | "held", focusFirst = false) => {
    window.clearTimeout(timer);
    closePanels(panel);
    mode = how;
    if (!isOpen(panel)) panel.showPopover();
    placePanel(trigger, panel);
    if (focusFirst) panelItems(panel)[0]?.focus({ preventScroll: true });
  };
  panels.set(panel, { trigger, close });
  if (!escBound) {
    escBound = true;
    document.addEventListener("keydown", onEsc);
  }

  on(panel, "toggle", (e: ToggleEvent) => {
    const opened = e.newState === "open";
    trigger.setAttribute("aria-expanded", String(opened));
    window[opened ? "addEventListener" : "removeEventListener"]("scroll", follow, true);
    window[opened ? "addEventListener" : "removeEventListener"]("resize", follow);
    if (!opened) {
      // Focus left inside a closed panel (or lost to the page) goes back to its button.
      const active = document.activeElement;
      if (!active || active === document.body || panel.contains(active)) trigger.focus({ preventScroll: true });
    }
  });
  // A click, Enter or Space toggles. A panel opened by hover is held open by a click rather than
  // closed by it, since the click is what the person meant. From the keyboard (no pointer, so
  // detail 0) focus moves to the first item.
  on(trigger, "click", (e: MouseEvent) => {
    e.preventDefault();
    hideTip(trigger);
    const byKey = e.detail === 0;
    if (isOpen(panel) && (mode === "held" || byKey)) close();
    else open("held", byKey);
  });
  const hovered = () => trigger.matches(":hover") || panel.matches(":hover");
  const leave = () => {
    if (mode !== "hover") return;
    window.clearTimeout(timer);
    timer = window.setTimeout(() => {
      if (!hovered()) close();
    }, HOVER_GRACE_MS);
  };
  on(trigger, "pointerenter", (e: PointerEvent) => {
    if (e.pointerType !== "mouse") return;
    window.clearTimeout(timer);
    if (!isOpen(panel)) open("hover");
  });
  on(trigger, "pointerleave", leave);
  on(panel, "pointerenter", () => window.clearTimeout(timer));
  on(panel, "pointerleave", leave);
  on(panel, "keydown", (e: KeyboardEvent) => {
    const items = panelItems(panel);
    const next = stepIndex(items.length, items.indexOf(document.activeElement as HTMLElement), e.key);
    if (next === null) return;
    e.preventDefault();
    items[next]?.focus();
  });
  // Tab past the panel's last item closes it without taking focus back; so does a press outside
  // the panel and its button (light dismiss), as does following a link.
  dismissOutside(on, trigger, panel, close);
  on(panel, "click", (e: MouseEvent) => {
    if ((e.target as Element).closest("a[href], [data-panel-close]")) close();
  });
  return () => {
    close();
    window.removeEventListener("scroll", follow, true);
    window.removeEventListener("resize", follow);
    undo.forEach((f) => f());
    panels.delete(panel);
  };
}

// Opens the phone's sheet (the shared dialog, from the bottom) from the menu button.
export function openSheet(header: HTMLElement): void {
  const button = header.querySelector<HTMLButtonElement>(".cap-site-header-menu");
  const sheet = header.querySelector<HTMLDialogElement>("dialog.cap-site-header-sheet");
  if (!sheet || sheet.open) return;
  openDialog(sheet, button, { focus: sheet.querySelector<HTMLElement>(".cap-site-header-sheet-title") });
  button?.setAttribute("aria-expanded", "true");
}

export function closeSheet(header: HTMLElement): void {
  const sheet = header.querySelector<HTMLDialogElement>("dialog.cap-site-header-sheet");
  if (sheet?.open) closeDialog(sheet);
}

// Attaches to every [data-cap="site-header"] under root not yet attached: each panel, each
// icon control's tip, search (answered by `suggest`, the site's own), the menu button and its
// sheet. Returns a function that detaches them all.
export function enhance(root: ParentNode = document, { suggest }: { suggest?: Suggest } = {}): () => void {
  const undo: Array<() => void> = [];
  for (const header of root.querySelectorAll<HTMLElement>("[data-cap='site-header']:not([data-cap-ready])")) {
    header.dataset.capReady = "";
    const parts: Array<() => void> = [];
    for (const trigger of header.querySelectorAll<HTMLElement>("[data-cap-part='panel-trigger']")) {
      const panel = document.getElementById(trigger.getAttribute("aria-controls") ?? "");
      if (panel) parts.push(wirePanel(trigger, panel));
    }
    // An icon control's tip names it, so it adds no description; a press hides it.
    for (const tip of header.querySelectorAll<HTMLElement>(".cap-site-header-tip")) {
      const trigger = tip.parentElement;
      if (!trigger) continue;
      parts.push(attachTip(trigger, tip));
      trigger.removeAttribute("aria-describedby");
    }
    const search = header.querySelector<HTMLElement>("[data-cap-part='search']");
    if (search) parts.push(wireSearch(search, suggest));
    const sheet = header.querySelector<HTMLDialogElement>("dialog.cap-site-header-sheet");
    const menu = header.querySelector<HTMLButtonElement>(".cap-site-header-menu");
    if (sheet) parts.push(wireDialog(sheet));
    const onClose = () => menu?.setAttribute("aria-expanded", "false");
    sheet?.addEventListener("close", onClose);
    const onClick = (e: MouseEvent) => {
      const t = e.target as Element;
      if (menu && t.closest(".cap-site-header-menu") === menu) openSheet(header);
      if (sheet?.open && sheet.contains(t) && t.closest("a[href]")) closeDialog(sheet);
    };
    header.addEventListener("click", onClick);
    undo.push(() => {
      header.removeEventListener("click", onClick);
      sheet?.removeEventListener("close", onClose);
      parts.forEach((f) => f());
      delete header.dataset.capReady;
    });
  }
  return () => undo.forEach((f) => f());
}

// Search (Dustin, 2026-10-28): a magnifier icon beside the theme, on the sites that have search; a
// box that only opened another box, or that did nothing until Enter, read as broken, and a box on
// half the sites made the header differ from tab to tab. The icon is a link to the site's search
// page, so it works with no script. With script, the icon (or "/") opens a field under it, focused,
// and the site's own `suggest` answers as the person types: the matches drop down under the field as
// a listbox. Up and Down move through them, Enter opens the one marked (or, with none marked, the
// full results page, as the form always did), Esc closes the list, then the field. The last row is
// always the full results page. Focus stays in the field (aria-activedescendant), as in the WAI-ARIA
// combobox pattern.
export interface SearchHit {
  url: string;
  title: string;
  /** A short kind before the title ("Paper", "Tool"). */
  kind?: string;
  /** One line under the title. */
  detail?: string;
}
export type Suggest = (query: string, signal: AbortSignal) => Promise<SearchHit[]> | SearchHit[];

// How long the field waits after a key before it asks, so a word typed fast asks once.
export const SUGGEST_DELAY_MS = 120;

let searchCount = 0;

/**
 * Wires a letterhead's search ([data-cap-part="search"]: the icon link and its panel holding the
 * form) to open from the icon or "/", and, given `suggest`, to show matches as the person types.
 * Returns a function that unwires it.
 */
export function wireSearch(search: HTMLElement, suggest?: Suggest, { limit = 6 }: { limit?: number } = {}): () => void {
  const trigger = search.querySelector<HTMLElement>("[data-cap-part='search-trigger']");
  const panel = search.querySelector<HTMLElement>(".cap-site-header-search-panel");
  const form = panel?.querySelector<HTMLFormElement>("form");
  const input = form?.querySelector<HTMLInputElement>("input[type='search']");
  if (!trigger || !panel || !form || !input) return () => {};
  const id = `cap-search-${++searchCount}`;
  panel.id ||= id;
  if (!panel.hasAttribute("popover")) panel.setAttribute("popover", "manual");
  trigger.setAttribute("aria-controls", panel.id);
  trigger.setAttribute("aria-expanded", "false");
  const results = document.createElement("div");
  results.className = "cap-site-header-results";
  results.hidden = true;
  results.innerHTML = `<div role="listbox" id="${id}-list" aria-label="${escapeHtml(input.getAttribute("aria-label") ?? "Search")}"></div><p class="cap-site-header-results-empty" hidden></p><span class="cap-sr-only" role="status"></span>`;
  form.after(results);
  const list = results.children[0] as HTMLElement;
  const empty = results.children[1] as HTMLElement;
  const status = results.children[2] as HTMLElement;
  input.setAttribute("role", "combobox");
  input.setAttribute("aria-autocomplete", "list");
  input.setAttribute("aria-controls", `${id}-list`);
  input.setAttribute("aria-expanded", "false");

  let timer: number | undefined;
  let pending: AbortController | undefined;
  let active = -1;
  const rows = () => [...list.querySelectorAll<HTMLAnchorElement>("[role='option']")];
  const listed = () => !results.hidden;
  const follow = () => {
    if (isOpen(panel)) placePanel(trigger, panel);
  };
  const mark = (at: number) => {
    const all = rows();
    active = at;
    all.forEach((row, i) => row.toggleAttribute("data-highlighted", i === at));
    if (at >= 0 && all[at]) {
      input.setAttribute("aria-activedescendant", all[at].id);
      all[at].scrollIntoView({ block: "nearest" });
    } else input.removeAttribute("aria-activedescendant");
  };
  const hideList = () => {
    window.clearTimeout(timer);
    pending?.abort();
    mark(-1);
    results.hidden = true;
    input.setAttribute("aria-expanded", "false");
  };
  const close = (refocus = false) => {
    hideList();
    if (isOpen(panel)) panel.hidePopover();
    if (refocus) trigger.focus({ preventScroll: true });
  };
  const open = () => {
    closePanels();
    if (!isOpen(panel)) panel.showPopover();
    placePanel(trigger, panel);
    input.focus({ preventScroll: true });
    input.select();
  };
  const fullUrl = (query: string) => {
    const url = new URL(form.action, location.href);
    url.searchParams.set(input.name || "q", query);
    return url.pathname + url.search;
  };
  const show = (query: string, hits: SearchHit[]) => {
    const row = (h: SearchHit, i: number) =>
      `<a role="option" id="${id}-${i}" href="${escapeHtml(h.url)}" tabindex="-1">${h.kind ? `<span class="cap-site-header-result-kind">${escapeHtml(h.kind)}</span>` : ""}<span class="cap-site-header-result-title">${escapeHtml(h.title)}</span>${h.detail ? `<span class="cap-site-header-result-detail">${escapeHtml(h.detail)}</span>` : ""}</a>`;
    const top = hits.slice(0, limit);
    list.innerHTML = `${top.map(row).join("")}<a role="option" id="${id}-all" href="${escapeHtml(fullUrl(query))}" tabindex="-1" class="cap-site-header-result-all">All results for “${escapeHtml(query)}”</a>`;
    empty.hidden = top.length > 0;
    empty.textContent = top.length ? "" : `No match for “${query}”. Try fewer words, or open all results.`;
    status.textContent = top.length ? `${hits.length} ${hits.length === 1 ? "match" : "matches"}` : "No match";
    mark(-1);
    results.hidden = false;
    input.setAttribute("aria-expanded", "true");
    follow();
  };
  const ask = () => {
    const query = input.value.trim();
    pending?.abort();
    if (!query || !suggest) return hideList();
    const mine = new AbortController();
    pending = mine;
    Promise.resolve(suggest(query, mine.signal))
      .then((hits) => {
        if (!mine.signal.aborted && input.value.trim() === query) show(query, hits);
      })
      .catch(() => {
        if (!mine.signal.aborted) show(query, []);
      });
  };

  const undo: Array<() => void> = [];
  const on = <E extends Event>(target: EventTarget, type: string, fn: (e: E) => void, opts?: boolean | AddEventListenerOptions) => {
    target.addEventListener(type, fn as EventListener, opts);
    undo.push(() => target.removeEventListener(type, fn as EventListener, opts));
  };
  on(panel, "toggle", (e: ToggleEvent) => {
    const opened = e.newState === "open";
    trigger.setAttribute("aria-expanded", String(opened));
    if (!opened) hideList();
  });
  on(trigger, "click", (e: MouseEvent) => {
    e.preventDefault();
    hideTip(trigger);
    if (isOpen(panel)) close();
    else open();
  });
  // "/" opens search from anywhere, but not while a person types in a field.
  on(document, "keydown", (e: KeyboardEvent) => {
    if (e.key !== "/" || e.ctrlKey || e.metaKey || e.altKey || e.defaultPrevented) return;
    if ((e.target as Element | null)?.closest?.("input, textarea, select, [contenteditable='true']")) return;
    e.preventDefault();
    open();
  });
  on(input, "input", () => {
    window.clearTimeout(timer);
    timer = window.setTimeout(ask, SUGGEST_DELAY_MS);
  });
  on(input, "keydown", (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      if (listed()) hideList();
      else close(true);
      return;
    }
    if (e.key === "Enter") {
      const row = rows()[active];
      if (listed() && row) {
        e.preventDefault();
        location.assign(row.href);
      }
      return;
    }
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
    if (!listed()) {
      if (input.value.trim()) ask();
      return;
    }
    e.preventDefault();
    const all = rows();
    mark(active < 0 ? (e.key === "ArrowDown" ? 0 : all.length - 1) : (active + (e.key === "ArrowDown" ? 1 : all.length - 1)) % all.length);
  });
  // Focus leaving the panel for anything but its icon closes it; so does a press outside both.
  dismissOutside(on, trigger, panel, close);
  // A press on a row follows its link; focus stays in the field until then.
  on(results, "pointerdown", (e: PointerEvent) => e.preventDefault());
  on(window, "resize", follow);
  on(window, "scroll", follow, true);
  return () => {
    close();
    undo.forEach((f) => f());
    results.remove();
    for (const a of ["role", "aria-autocomplete", "aria-controls", "aria-expanded", "aria-activedescendant"]) input.removeAttribute(a);
  };
}

export interface LetterheadOptions {
  /** The site's name, bold under the agency ("Prelum"); the headquarters site passes "" and shows the agency alone. */
  name: string;
  /** The small line over it. */
  agency?: string;
  /** Where the logo goes. */
  home?: string;
  /** The site's mark, an inline <svg> (trusted markup). */
  mark: string;
  /** The section links, Home first: [href, label]. */
  links: Array<[string, string]>;
  /** The label of the page's own link, marked aria-current="page". */
  current?: string;
  /** The site's search page and the field's label ("Search Prelum"); none leaves the slot empty. */
  search?: { action: string; label: string };
  /** The link the skip link goes to. */
  skipTo?: string;
  /** The theme button; a page with no script follows the system's setting and leaves it out. */
  theme?: boolean;
}

const SEARCH_GLYPH = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M11 4a7 7 0 1 0 0 14a7 7 0 1 0 0-14zM20 20l-3.2-3.2" /></svg>';
const THEME_BUTTON = `<button type="button" class="cap-theme-button cap-site-header-icon cap-site-header-theme" data-cap="theme-switch" data-variant="button" aria-label="Switch to dark theme">
<svg class="cap-theme-icon" data-show="light" viewBox="0 0 24 24" aria-hidden="true"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" /></svg>
<svg class="cap-theme-icon" data-show="dark" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>
<span class="cap-theme-tip cap-popover" data-variant="tooltip" data-side="bottom" data-offset="6" popover="manual" role="tooltip" aria-hidden="true"><span class="cap-theme-tip-text">Switch to dark theme</span><kbd>T</kbd></span>
</button>`;

/** The search icon and its panel, as `letterheadHtml` writes them and the React header draws them. */
export function searchHtml({ action, label, name = "q" }: { action: string; label: string; name?: string }): string {
  return `<div class="cap-site-header-search" data-cap-part="search"><a class="cap-site-header-icon cap-site-header-search-button" href="${escapeHtml(action)}" aria-label="${escapeHtml(label)}" data-cap-part="search-trigger">${SEARCH_GLYPH}<span class="cap-site-header-tip cap-popover" data-variant="tooltip" data-side="bottom" data-offset="6" popover="manual" role="tooltip" aria-hidden="true"><span class="cap-site-header-tip-text">${escapeHtml(label)}</span><kbd>/</kbd></span></a><div class="cap-site-header-search-panel" data-align="end"><form role="search" aria-label="Site" action="${escapeHtml(action)}" method="get">${SEARCH_GLYPH}<input type="search" name="${escapeHtml(name)}" placeholder="${escapeHtml(label)}" aria-label="${escapeHtml(label)}" autocomplete="off" enterkeyhint="search" /></form></div></div>`;
}

/**
 * A public page's letterhead as HTML: plain string building, so a static build or a server writes
 * the same markup as the React header (Dustin, 2026-10-27). `enhance` and the theme switch wire it.
 */
export function letterheadHtml({ name, agency = "Dustin Edwards", home = "/", mark, links, current, search, skipTo = "#main", theme = true }: LetterheadOptions): string {
  const label = [agency, name].filter(Boolean).join(" ");
  const names = [agency && `<span class="cap-site-header-agency">${escapeHtml(agency)}</span>`, name && `<span class="cap-site-header-name">${escapeHtml(name)}</span>`]
    .filter(Boolean)
    .join(" ");
  const items = links
    .map(([href, text]) => `<li><a class="cap-site-header-link" href="${escapeHtml(href)}"${text === current ? ' aria-current="page"' : ""}>${escapeHtml(text)}</a></li>`)
    .join("");
  const field = search ? searchHtml(search) : "";
  return `<header class="cap-site-header" data-cap="site-header" data-variant="letterhead" data-markup="">
<a class="cap-site-header-skip" href="${escapeHtml(skipTo)}">Skip to content</a>
<a class="cap-site-header-logo" href="${escapeHtml(home)}" aria-label="${escapeHtml(label)}">${mark}<span class="cap-site-header-names" aria-hidden="true">${names}</span></a>
<nav class="cap-site-header-sections" aria-label="Sections"><ul>${items}</ul></nav>
<div class="cap-site-header-tools">${field}${theme ? THEME_BUTTON : ""}</div>
</header>`;
}
