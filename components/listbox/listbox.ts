// The shared listbox: options, groups, one active option, filtering, typeahead and selection,
// over `role="listbox"` markup. Command menu, select, and any list a person picks from reuse
// it. No framework, no imports: the pure functions below run in node as well as the browser.
//
// The active option is the one a key press would act on. It is marked `data-active` and,
// where focus stays elsewhere, named by `aria-activedescendant` on the holder. `aria-selected`
// means one thing only: this value is chosen (single or multi selection).

// ---------------------------------------------------------------------------------------
// Pure functions.

export interface Searchable {
  label: string;
  group?: string;
  // Other words that find it: "home" finds Overview.
  keywords?: readonly string[];
}

// Case-insensitive substring over the group, the label and the keywords, so the name of a
// group finds all of it. An empty query matches all.
export function matchesQuery(c: Searchable, query: string): boolean {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;
  return [c.group ?? "", c.label, ...(c.keywords ?? [])].some((t) => t.toLowerCase().includes(needle));
}

// A ranking hook: a score (higher first) for an item against the lower-cased, trimmed query,
// or null to leave it out. Ties keep their order.
export type Rank<T> = (item: T, needle: string) => number | null;

// The items that match, in their own order; or, with a `rank`, the items it scores, best first.
// The rank replaces the substring test, so it may match more loosely (a subsequence, say).
export function filterCommands<T extends Searchable>(items: readonly T[], query: string, rank?: Rank<T>): T[] {
  const needle = query.trim().toLowerCase();
  if (!rank || !needle) return items.filter((c) => matchesQuery(c, query));
  const scored: Array<{ item: T; at: number; score: number }> = [];
  items.forEach((item, at) => {
    const score = rank(item, needle);
    if (score !== null) scored.push({ item, at, score });
  });
  return scored.sort((a, b) => b.score - a.score || a.at - b.at).map((s) => s.item);
}

// Items by group, in the order each group first appears. An item with no group falls under "".
export function groupBy<T>(items: readonly T[], by: (item: T) => string | undefined = (i) => (i as { group?: string }).group): Array<{ group: string; items: T[] }> {
  const out: Array<{ group: string; items: T[] }> = [];
  for (const item of items) {
    const key = by(item) ?? "";
    let g = out.find((x) => x.group === key);
    if (!g) {
      g = { group: key, items: [] };
      out.push(g);
    }
    g.items.push(item);
  }
  return out;
}

// Moves an index by `by`. Stops at the ends, or with `wrap` goes round. From no index (-1) a
// forward move lands on the first and a backward move on the last.
export function step(index: number, by: number, count: number, wrap = false): number {
  if (count <= 0) return -1;
  if (index < 0) return by > 0 ? 0 : count - 1;
  const next = index + by;
  if (wrap) return ((next % count) + count) % count;
  return Math.min(count - 1, Math.max(0, next));
}

// `step` over a row where some entries cannot be chosen. A single step lands on the next
// enabled entry in that direction (wrapping if asked); a longer step (a page) lands on the
// enabled entry nearest its target. Returns the current index when there is nowhere to go,
// and -1 when nothing is enabled.
export function stepEnabled(disabled: readonly boolean[], index: number, by: number, wrap = false): number {
  const n = disabled.length;
  const first = disabled.indexOf(false);
  if (first < 0) return -1;
  if (index < 0) return by > 0 ? first : disabled.lastIndexOf(false);
  const dir = by < 0 ? -1 : 1;
  const w = wrap && Math.abs(by) === 1;
  const scan = (from: number, d: number, round: boolean): number => {
    for (let k = 0; k < n; k++) {
      let i = from + d * k;
      if (round) i = ((i % n) + n) % n;
      else if (i < 0 || i >= n) return -1;
      if (!disabled[i]) return i;
    }
    return -1;
  };
  const target = step(index, by, n, w);
  let hit = scan(target, dir, w);
  if (hit < 0 && Math.abs(by) > 1) hit = scan(target, -dir, false);
  return hit < 0 ? index : hit;
}

export const TYPEAHEAD_MS = 700;

export interface TypeaheadState {
  buffer: string;
  at: number;
}

// Typeahead over a list of labels (null for an entry that cannot be chosen). Characters
// typed within `timeout` ms of each other make one prefix; the first match from the current
// entry on wins, wrapping. One letter pressed again and again (or a single letter after a
// pause) cycles through the entries that start with it. `index` is -1 when nothing matches.
export function nextTypeahead(
  state: TypeaheadState,
  key: string,
  now: number,
  labels: ReadonlyArray<string | null>,
  current: number,
  timeout = TYPEAHEAD_MS,
): { state: TypeaheadState; index: number } {
  const buffer = (now - state.at > timeout ? "" : state.buffer) + key.toLowerCase();
  const next = { buffer, at: now };
  const n = labels.length;
  const cycle = buffer.length === 1 || [...buffer].every((c) => c === buffer[0]);
  const needle = cycle ? (buffer[0] ?? "") : buffer;
  const from = cycle ? current + 1 : Math.max(current, 0);
  for (let k = 0; k < n; k++) {
    const label = labels[(from + k) % n];
    if (label != null && label.trimStart().toLowerCase().startsWith(needle)) return { state: next, index: (from + k) % n };
  }
  return { state: next, index: -1 };
}

// The words a polite live region says after filtering.
export function resultsText(count: number): string {
  return count === 1 ? "1 result" : `${count} results`;
}

export function emptyText(query: string): string {
  return `No results for “${query.trim()}”`;
}

// ---------------------------------------------------------------------------------------
// The controller.

export type ListboxMode =
  // Focus stays in a combobox input; the input names the active option (aria-activedescendant).
  | "input"
  // Focus is on the listbox, which names the active option (aria-activedescendant).
  | "descendant"
  // Focus moves to the options themselves (roving tabindex).
  | "roving";
export type Selection = "none" | "single" | "multi";

export interface ListboxOptions {
  // The combobox input that holds focus. Setting it makes the mode "input".
  input?: HTMLInputElement | null;
  mode?: ListboxMode;
  selection?: Selection;
  // Up from the first goes to the last, and the reverse. Off by default.
  wrap?: boolean;
  // Typing letters moves to a matching option. On unless an input holds focus.
  typeahead?: boolean;
  // With an input, Home and End move the caret unless this is set (the command menu sets it).
  homeEnd?: boolean;
  // With an input: typing in it filters the listbox. Needs `filter` to be called by the app
  // otherwise.
  filterInput?: boolean;
  // Makes the first enabled option active after filtering. On with an input.
  activateFirst?: boolean;
  // Hide the listbox while nothing matches. On.
  hideWhenEmpty?: boolean;
  rank?: Rank<ListboxItem>;
  // The element that receives "No results for ...". Found as a sibling `.cap-listbox-empty`.
  empty?: HTMLElement | null;
  // The polite live region for the result count. Made after the listbox when not given.
  status?: HTMLElement | null;
  announce?: (count: number, query: string) => string;
  // Options moved per Page Up or Page Down. Measured from the list's height when omitted.
  pageSize?: number;
  onActive?: (option: HTMLElement | null) => void;
  onFilter?: (count: number, query: string) => void;
}

export interface ListboxItem extends Searchable {
  el: HTMLElement;
  id: string;
  value: string;
  disabled: boolean;
  selected: boolean;
}

export interface SelectDetail {
  option: HTMLElement;
  value: string;
  label: string;
  // Whether the option is chosen after this (always true when selection is "none").
  selected: boolean;
  // Every chosen value after this.
  values: string[];
}

export interface Listbox {
  readonly el: HTMLElement;
  readonly mode: ListboxMode;
  items(): ListboxItem[];
  // The options a person can reach: those not hidden by a filter.
  visible(): ListboxItem[];
  active(): HTMLElement | null;
  setActive(target: HTMLElement | number | null, o?: { scroll?: boolean; focus?: boolean }): void;
  // Moves the active option: step(1) next, step(-1) previous, skipping disabled ones.
  step(by: number): void;
  first(): void;
  last(): void;
  // Shows the options that match and returns how many. Announces the count.
  filter(query: string, rank?: Rank<ListboxItem>): number;
  // Chooses (or with selection "none", just reports) the active or the given option.
  select(target?: HTMLElement | null): void;
  getValue(): string[];
  setValue(value: string | readonly string[] | null): void;
  // Puts focus where the listbox takes keys (the input, the list, or the active option).
  focus(): void;
  // Handles a key as the listbox would; returns true when it did. For an app that owns the
  // keydown listener itself.
  handleKey(e: KeyboardEvent): boolean;
  // Re-reads the markup after the app changed it.
  refresh(): void;
  detach(): void;
}

let counter = 0;
const uid = (p: string) => `${p}-${++counter}`;

const isDisabled = (o: HTMLElement) => o.getAttribute("aria-disabled") === "true" || o.hasAttribute("data-disabled");

export function createListbox(el: HTMLElement, opts: ListboxOptions = {}): Listbox {
  const input = opts.input ?? null;
  const mode: ListboxMode = input ? "input" : (opts.mode ?? (el.dataset.mode as ListboxMode | undefined) ?? "descendant");
  const selection: Selection = opts.selection ?? (el.getAttribute("aria-multiselectable") === "true" ? "multi" : ((el.dataset.selection as Selection | undefined) ?? "none"));
  const typeaheadOn = opts.typeahead ?? mode !== "input";
  const activateFirst = opts.activateFirst ?? mode === "input";
  const hideWhenEmpty = opts.hideWhenEmpty ?? true;
  const wrap = opts.wrap ?? el.dataset.wrap !== undefined;
  const holder: HTMLElement = input ?? el;

  el.dataset.mode = mode;
  el.dataset.selection = selection;
  if (selection === "multi") el.setAttribute("aria-multiselectable", "true");
  if (mode === "descendant" && !el.hasAttribute("tabindex")) el.tabIndex = 0;

  const parent = el.parentElement;
  const empty = opts.empty ?? parent?.querySelector<HTMLElement>(":scope > .cap-listbox-empty") ?? null;
  let madeStatus: HTMLElement | null = null;
  let status = opts.status ?? parent?.querySelector<HTMLElement>(":scope > [data-cap-part='count']") ?? null;
  if (!status) {
    status = document.createElement("div");
    status.className = "cap-sr-only";
    status.dataset.capPart = "count";
    status.setAttribute("role", "status");
    status.setAttribute("aria-atomic", "true");
    el.after(status);
    madeStatus = status;
  }
  const announce = opts.announce ?? ((n: number) => (n === 0 && empty ? "" : n === 0 ? "No results" : resultsText(n)));

  const optionEls = () => Array.from(el.querySelectorAll<HTMLElement>("[role='option']"));
  const order = new WeakMap<HTMLElement, number>();
  const ensureId = (o: HTMLElement) => (o.id ||= uid("cap-opt"));
  const labelOf = (o: HTMLElement) => (o.dataset.label ?? o.querySelector(".cap-option-label")?.textContent ?? o.textContent ?? "").trim();
  const groupOf = (o: HTMLElement) => {
    if (o.dataset.group !== undefined) return o.dataset.group;
    const g = o.closest<HTMLElement>("[role='group']");
    return g && el.contains(g) ? (g.querySelector(".cap-listbox-label")?.textContent ?? "").trim() : "";
  };
  const info = (o: HTMLElement): ListboxItem => ({
    el: o,
    id: ensureId(o),
    value: o.dataset.value ?? o.id,
    label: labelOf(o),
    group: groupOf(o),
    keywords: (o.dataset.keywords ?? "").split(",").map((k) => k.trim()).filter(Boolean),
    disabled: isDisabled(o),
    selected: o.getAttribute("aria-selected") === "true",
  });
  const items = () => optionEls().map(info);
  const visible = () => items().filter((i) => !i.el.hidden);
  const enabledVisible = () => visible().filter((i) => !i.disabled);

  optionEls().forEach((o, i) => {
    order.set(o, i);
    ensureId(o);
    if (selection !== "none" && !o.hasAttribute("aria-selected")) o.setAttribute("aria-selected", "false");
  });

  // ---- the active option
  let current: HTMLElement | null = el.querySelector<HTMLElement>("[role='option'][data-active]");

  const syncRoving = () => {
    if (mode !== "roving") return;
    const vis = enabledVisible();
    const stop = (current && !current.hidden && !isDisabled(current) ? current : null) ?? vis.find((i) => i.selected)?.el ?? vis[0]?.el ?? null;
    for (const o of optionEls()) o.tabIndex = o === stop ? 0 : -1;
  };

  const setActive: Listbox["setActive"] = (target, o = {}) => {
    const { scroll = true, focus = false } = o;
    const to = typeof target === "number" ? (visible()[target]?.el ?? null) : target;
    const prev = current;
    current = to;
    if (prev && prev !== to) prev.removeAttribute("data-active");
    if (to) {
      to.setAttribute("data-active", "");
      if (mode === "roving") {
        syncRoving();
        if (focus) to.focus({ preventScroll: true });
      } else holder.setAttribute("aria-activedescendant", ensureId(to));
      if (scroll) {
        // The first option scrolls its group's label into view with it.
        if (visible()[0]?.el === to) el.scrollTop = 0;
        else to.scrollIntoView({ block: "nearest" });
      }
    } else {
      if (mode !== "roving") holder.removeAttribute("aria-activedescendant");
      else syncRoving();
    }
    if (prev !== to) opts.onActive?.(to);
  };

  const move = (to: number, focus: boolean) => {
    const vis = visible();
    if (to >= 0 && vis[to]) setActive(vis[to].el, { focus });
  };
  const currentIndex = () => (current ? visible().findIndex((i) => i.el === current) : -1);
  const stepBy = (by: number) => {
    const vis = visible();
    move(stepEnabled(vis.map((i) => i.disabled), currentIndex(), by, wrap), mode === "roving");
  };
  const edge = (end: boolean) => {
    const vis = visible();
    const disabled = vis.map((i) => i.disabled);
    move(end ? disabled.lastIndexOf(false) : disabled.indexOf(false), mode === "roving");
  };

  // ---- selection
  const getValue = () => (selection === "none" ? [] : items().filter((i) => i.selected).map((i) => i.value));
  const select = (target: HTMLElement | null = current) => {
    if (!target || isDisabled(target)) return;
    if (selection === "single") for (const o of optionEls()) o.setAttribute("aria-selected", String(o === target));
    else if (selection === "multi") target.setAttribute("aria-selected", String(target.getAttribute("aria-selected") !== "true"));
    syncRoving();
    const it = info(target);
    const detail: SelectDetail = { option: target, value: it.value, label: it.label, selected: selection === "none" || it.selected, values: getValue() };
    el.dispatchEvent(new CustomEvent("cap:option-select", { bubbles: true, detail }));
  };
  const setValue: Listbox["setValue"] = (value) => {
    if (selection === "none") return;
    const want = new Set(value === null ? [] : typeof value === "string" ? [value] : value);
    let any = false;
    for (const i of items()) {
      const on = want.has(i.value) && (selection === "multi" || !any);
      if (on) any = true;
      i.el.setAttribute("aria-selected", String(on));
    }
    syncRoving();
  };

  // ---- filtering
  const filter: Listbox["filter"] = (query, rank = opts.rank) => {
    const all = items();
    const keep = new Set(filterCommands(all, query, rank).map((i) => i.el));
    // A ranked list reorders within each parent; with no query it goes back to its own order.
    if (rank) {
      const ranked = filterCommands(all, query, rank);
      const pos = new Map(ranked.map((i, k) => [i.el, k]));
      const byParent = new Map<Element, HTMLElement[]>();
      for (const o of all.map((i) => i.el)) byParent.set(o.parentElement ?? el, [...(byParent.get(o.parentElement ?? el) ?? []), o]);
      for (const [p, list] of byParent) {
        list.sort((a, b) => (query.trim() ? (pos.get(a) ?? 1e9) - (pos.get(b) ?? 1e9) : (order.get(a) ?? 0) - (order.get(b) ?? 0)));
        for (const o of list) p.append(o);
      }
    }
    for (const i of all) i.el.hidden = !keep.has(i.el);
    for (const g of el.querySelectorAll<HTMLElement>("[role='group']")) g.hidden = !g.querySelector("[role='option']:not([hidden])");
    // A separator shows only between two things that show.
    let seen = false;
    let pending: HTMLElement | null = null;
    for (const c of Array.from(el.children) as HTMLElement[]) {
      if (c.classList.contains("cap-listbox-separator")) {
        c.hidden = true;
        if (seen) pending = c;
      } else if (!c.hidden && (c.matches("[role='option']") || c.querySelector("[role='option']:not([hidden])"))) {
        if (pending) pending.hidden = false;
        pending = null;
        seen = true;
      }
    }
    const n = keep.size;
    if (hideWhenEmpty) el.hidden = n === 0;
    if (empty) empty.textContent = n === 0 && query.trim() ? emptyText(query) : "";
    if (status) status.textContent = query.trim() ? announce(n, query) : "";
    if (current && (current.hidden || isDisabled(current))) setActive(null);
    if (activateFirst) setActive(enabledVisible()[0]?.el ?? null, { scroll: false });
    else syncRoving();
    opts.onFilter?.(n, query);
    return n;
  };

  // ---- keys
  let typed: TypeaheadState = { buffer: "", at: 0 };
  const pageBy = () => {
    if (opts.pageSize) return opts.pageSize;
    const row = visible()[0]?.el.offsetHeight ?? 0;
    return row > 0 ? Math.max(1, Math.floor(el.clientHeight / row) - 1) : 10;
  };

  const handleKey = (e: KeyboardEvent): boolean => {
    if (e.defaultPrevented || e.isComposing || e.ctrlKey || e.metaKey || e.altKey) return false;
    const k = e.key;
    const roving = mode === "roving";
    const typing = typeaheadOn && Date.now() - typed.at <= TYPEAHEAD_MS && typed.buffer !== "";
    let handled = true;
    if (k === "ArrowDown") stepBy(1);
    else if (k === "ArrowUp") stepBy(-1);
    else if (k === "PageDown") move(stepEnabled(visible().map((i) => i.disabled), currentIndex(), pageBy()), roving);
    else if (k === "PageUp") move(stepEnabled(visible().map((i) => i.disabled), currentIndex(), -pageBy()), roving);
    else if ((k === "Home" || k === "End") && (mode !== "input" || opts.homeEnd)) edge(k === "End");
    else if (k === "Enter") {
      if (!current) return false;
      select(current);
    } else if (k === " " && mode !== "input" && !typing) {
      if (!current) return false;
      select(current);
    } else if (typeaheadOn && k.length === 1 && (k !== " " || typing)) {
      const vis = visible();
      const r = nextTypeahead(typed, k, Date.now(), vis.map((i) => (i.disabled ? null : i.label)), currentIndex());
      typed = r.state;
      if (r.index >= 0) move(r.index, roving);
    } else handled = false;
    if (handled) e.preventDefault();
    return handled;
  };

  // ---- wiring
  const onKey = (e: KeyboardEvent) => void handleKey(e);
  const optionAt = (e: Event) => {
    const o = (e.target as Element | null)?.closest<HTMLElement>("[role='option']") ?? null;
    return o && el.contains(o) ? o : null;
  };
  const onMove = (e: PointerEvent) => {
    const o = optionAt(e);
    if (o && o !== current && !isDisabled(o)) setActive(o, { scroll: false });
  };
  const onDown = (e: PointerEvent) => {
    // A click on an option must not take focus from the input.
    if (mode === "input" && optionAt(e)) e.preventDefault();
  };
  const onClick = (e: MouseEvent) => {
    const o = optionAt(e);
    if (!o || isDisabled(o)) return;
    setActive(o, { scroll: false, focus: mode === "roving" });
    select(o);
  };
  const onFocusIn = (e: FocusEvent) => {
    const o = optionAt(e);
    if (o && mode === "roving" && o !== current) setActive(o, { scroll: false });
  };
  const onFocus = () => {
    if (current) return;
    const vis = enabledVisible();
    setActive((vis.find((i) => i.selected) ?? vis[0])?.el ?? null);
  };
  const onInput = () => void filter(input?.value ?? "");

  (input ?? el).addEventListener("keydown", onKey as EventListener);
  el.addEventListener("pointermove", onMove as EventListener);
  el.addEventListener("pointerdown", onDown as EventListener);
  el.addEventListener("click", onClick as EventListener);
  if (mode === "roving") el.addEventListener("focusin", onFocusIn as EventListener);
  if (mode === "descendant") el.addEventListener("focus", onFocus);
  if (input && opts.filterInput) input.addEventListener("input", onInput);

  if (current) setActive(current, { scroll: false });
  else if (activateFirst) setActive(enabledVisible()[0]?.el ?? null, { scroll: false });
  syncRoving();

  return {
    el,
    mode,
    items,
    visible,
    active: () => current,
    setActive,
    step: stepBy,
    first: () => edge(false),
    last: () => edge(true),
    filter,
    select,
    getValue,
    setValue,
    focus() {
      if (mode === "input") input?.focus();
      else if (mode === "descendant") {
        el.focus({ preventScroll: true });
        onFocus();
      } else {
        if (!current) {
          const vis = enabledVisible();
          setActive((vis.find((i) => i.selected) ?? vis[0])?.el ?? null, { focus: true });
        } else current.focus({ preventScroll: true });
      }
    },
    handleKey,
    refresh() {
      optionEls().forEach((o, i) => {
        if (!order.has(o)) order.set(o, i);
        ensureId(o);
        if (selection !== "none" && !o.hasAttribute("aria-selected")) o.setAttribute("aria-selected", "false");
      });
      if (current && !el.contains(current)) current = null;
      syncRoving();
    },
    detach() {
      (input ?? el).removeEventListener("keydown", onKey as EventListener);
      el.removeEventListener("pointermove", onMove as EventListener);
      el.removeEventListener("pointerdown", onDown as EventListener);
      el.removeEventListener("click", onClick as EventListener);
      el.removeEventListener("focusin", onFocusIn as EventListener);
      el.removeEventListener("focus", onFocus);
      input?.removeEventListener("input", onInput);
      madeStatus?.remove();
      delete el.dataset.capReady;
      listboxes.delete(el);
    },
  };
}

// ---------------------------------------------------------------------------------------
// Markup wiring: `[data-cap="listbox"]`.

const listboxes = new WeakMap<HTMLElement, Listbox>();

// The controller `enhance` made for this element, if any.
export function listboxFor(el: Element | null): Listbox | undefined {
  return el instanceof HTMLElement ? listboxes.get(el) : undefined;
}

// Attaches to every `[data-cap="listbox"]` under root not yet marked `data-cap-ready`.
// Reads data-mode ("input" is found by the combobox whose aria-controls names this list),
// data-selection ("single", "multi"), data-wrap, and data-filter (typing in the input filters).
// Returns a function that detaches them all.
export function enhance(root: ParentNode = document): () => void {
  const undo: Array<() => void> = [];
  for (const el of root.querySelectorAll<HTMLElement>("[data-cap='listbox']:not([data-cap-ready])")) {
    el.dataset.capReady = "";
    const input = el.id ? (document.querySelector<HTMLInputElement>(`input[aria-controls~="${CSS.escape(el.id)}"]`) ?? null) : null;
    const lb = createListbox(el, { input, filterInput: input !== null && el.dataset.filter !== undefined });
    listboxes.set(el, lb);
    undo.push(lb.detach);
  }
  return () => undo.forEach((f) => f());
}
