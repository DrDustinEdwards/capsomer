// The shared listbox: options, groups, one active option, filtering, typeahead and selection,
// over `role="listbox"` markup. Command menu, select, and any list a person picks from reuse
// it. No framework, and no import but hooks' id counter and the shortcuts' IME check: the pure functions (listbox-model.ts) run in node as well as the browser.
//
// The active option is the one a key press would act on. It is marked `data-active` and,
// where focus stays elsewhere, named by `aria-activedescendant` on the holder. `aria-selected`
// means one thing only: this value is chosen (single or multi selection).

import { uid } from "../hooks/hooks.ts";
import { isImeEnter } from "../shortcuts/shortcuts.ts";
import {
  TYPEAHEAD_MS,
  emptyText,
  filterCommands,
  nextTypeahead,
  resultsText,
  stepEnabled,
  type TypeaheadState,
} from "./listbox-model.ts";
import type {
  Listbox,
  ListboxItem,
  ListboxMode,
  ListboxOptions,
  SelectDetail,
  Selection,
} from "./listbox-types.ts";

export type { Searchable, Rank, TypeaheadState } from "./listbox-model.ts";
export {
  TYPEAHEAD_MS,
  emptyText,
  filterCommands,
  groupBy,
  matchesQuery,
  nextTypeahead,
  resultsText,
  step,
  stepEnabled,
} from "./listbox-model.ts";
export type {
  Listbox,
  ListboxItem,
  ListboxMode,
  ListboxOptions,
  SelectDetail,
  Selection,
} from "./listbox-types.ts";

// The controller.

const isDisabled = (o: HTMLElement) =>
  o.getAttribute("aria-disabled") === "true" || o.hasAttribute("data-disabled");

export function createListbox(el: HTMLElement, opts: ListboxOptions = {}): Listbox {
  const input = opts.input ?? null;
  const mode: ListboxMode = input
    ? "input"
    : (opts.mode ?? (el.dataset.mode as ListboxMode | undefined) ?? "descendant");
  const selection: Selection =
    opts.selection ??
    (el.getAttribute("aria-multiselectable") === "true"
      ? "multi"
      : ((el.dataset.selection as Selection | undefined) ?? "none"));
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
  const empty =
    opts.empty ?? parent?.querySelector<HTMLElement>(":scope > .cap-listbox-empty") ?? null;
  let madeStatus: HTMLElement | null = null;
  let status =
    opts.status ?? parent?.querySelector<HTMLElement>(":scope > [data-cap-part='count']") ?? null;
  if (!status) {
    status = document.createElement("div");
    status.className = "cap-sr-only";
    status.dataset.capPart = "count";
    status.setAttribute("role", "status");
    status.setAttribute("aria-atomic", "true");
    el.after(status);
    madeStatus = status;
  }
  const announce =
    opts.announce ??
    ((n: number) => (n === 0 && empty ? "" : n === 0 ? "No results" : resultsText(n)));

  const optionEls = () => Array.from(el.querySelectorAll<HTMLElement>("[role='option']"));
  const order = new WeakMap<HTMLElement, number>();
  const ensureId = (o: HTMLElement) => (o.id ||= uid("cap-opt"));
  const labelOf = (o: HTMLElement) =>
    (
      o.dataset.label ??
      o.querySelector(".cap-option-label")?.textContent ??
      o.textContent ??
      ""
    ).trim();
  const groupOf = (o: HTMLElement) => {
    if (o.dataset.group !== undefined) return o.dataset.group;
    const g = o.closest<HTMLElement>("[role='group']");
    return g && el.contains(g)
      ? (g.querySelector(".cap-listbox-label")?.textContent ?? "").trim()
      : "";
  };
  const info = (o: HTMLElement): ListboxItem => ({
    el: o,
    id: ensureId(o),
    value: o.dataset.value ?? o.id,
    label: labelOf(o),
    group: groupOf(o),
    keywords: (o.dataset.keywords ?? "")
      .split(",")
      .map((k) => k.trim())
      .filter(Boolean),
    disabled: isDisabled(o),
    selected: o.getAttribute("aria-selected") === "true",
  });
  const items = () => optionEls().map(info);
  const visible = () => items().filter((i) => !i.el.hidden);
  const enabledVisible = () => visible().filter((i) => !i.disabled);

  optionEls().forEach((o, i) => {
    order.set(o, i);
    ensureId(o);
    if (selection !== "none" && !o.hasAttribute("aria-selected"))
      o.setAttribute("aria-selected", "false");
  });

  let current: HTMLElement | null = el.querySelector<HTMLElement>("[role='option'][data-active]");

  const syncRoving = () => {
    if (mode !== "roving") return;
    const vis = enabledVisible();
    const stop =
      (current && !current.hidden && !isDisabled(current) ? current : null) ??
      vis.find((i) => i.selected)?.el ??
      vis[0]?.el ??
      null;
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
    move(
      stepEnabled(
        vis.map((i) => i.disabled),
        currentIndex(),
        by,
        wrap,
      ),
      mode === "roving",
    );
  };
  const edge = (end: boolean) => {
    const vis = visible();
    const disabled = vis.map((i) => i.disabled);
    move(end ? disabled.lastIndexOf(false) : disabled.indexOf(false), mode === "roving");
  };

  const getValue = () =>
    selection === "none"
      ? []
      : items()
          .filter((i) => i.selected)
          .map((i) => i.value);
  const select = (target: HTMLElement | null = current) => {
    if (!target || isDisabled(target)) return;
    if (selection === "single")
      for (const o of optionEls()) o.setAttribute("aria-selected", String(o === target));
    else if (selection === "multi")
      target.setAttribute("aria-selected", String(target.getAttribute("aria-selected") !== "true"));
    syncRoving();
    const it = info(target);
    const detail: SelectDetail = {
      option: target,
      value: it.value,
      label: it.label,
      selected: selection === "none" || it.selected,
      values: getValue(),
    };
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

  const filter: Listbox["filter"] = (query, rank = opts.rank) => {
    const all = items();
    const keep = new Set(filterCommands(all, query, rank).map((i) => i.el));
    // A ranked list reorders within each parent; with no query it goes back to its own order.
    if (rank) {
      const ranked = filterCommands(all, query, rank);
      const pos = new Map(ranked.map((i, k) => [i.el, k]));
      const byParent = new Map<Element, HTMLElement[]>();
      for (const o of all.map((i) => i.el))
        byParent.set(o.parentElement ?? el, [...(byParent.get(o.parentElement ?? el) ?? []), o]);
      for (const [p, list] of byParent) {
        list.sort((a, b) =>
          query.trim()
            ? (pos.get(a) ?? 1e9) - (pos.get(b) ?? 1e9)
            : (order.get(a) ?? 0) - (order.get(b) ?? 0),
        );
        for (const o of list) p.append(o);
      }
    }
    for (const i of all) i.el.hidden = !keep.has(i.el);
    for (const g of el.querySelectorAll<HTMLElement>("[role='group']"))
      g.hidden = !g.querySelector("[role='option']:not([hidden])");
    // A separator shows only between two things that show.
    let seen = false;
    let pending: HTMLElement | null = null;
    for (const c of Array.from(el.children) as HTMLElement[]) {
      if (c.classList.contains("cap-listbox-separator")) {
        c.hidden = true;
        if (seen) pending = c;
      } else if (
        !c.hidden &&
        (c.matches("[role='option']") || c.querySelector("[role='option']:not([hidden])"))
      ) {
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

  let typed: TypeaheadState = { buffer: "", at: 0 };
  const pageBy = () => {
    if (opts.pageSize) return opts.pageSize;
    const row = visible()[0]?.el.offsetHeight ?? 0;
    return row > 0 ? Math.max(1, Math.floor(el.clientHeight / row) - 1) : 10;
  };

  const handleKey = (e: KeyboardEvent): boolean => {
    if (e.defaultPrevented || e.isComposing || isImeEnter(e) || e.ctrlKey || e.metaKey || e.altKey)
      return false;
    const k = e.key;
    const roving = mode === "roving";
    const typing = typeaheadOn && Date.now() - typed.at <= TYPEAHEAD_MS && typed.buffer !== "";
    let handled = true;
    if (k === "ArrowDown") stepBy(1);
    else if (k === "ArrowUp") stepBy(-1);
    else if (k === "PageDown")
      move(
        stepEnabled(
          visible().map((i) => i.disabled),
          currentIndex(),
          pageBy(),
        ),
        roving,
      );
    else if (k === "PageUp")
      move(
        stepEnabled(
          visible().map((i) => i.disabled),
          currentIndex(),
          -pageBy(),
        ),
        roving,
      );
    else if ((k === "Home" || k === "End") && (mode !== "input" || opts.homeEnd)) edge(k === "End");
    else if (k === "Enter") {
      if (!current) return false;
      select(current);
    } else if (k === " " && mode !== "input" && !typing) {
      if (!current) return false;
      select(current);
    } else if (typeaheadOn && k.length === 1 && (k !== " " || typing)) {
      const vis = visible();
      const r = nextTypeahead(
        typed,
        k,
        Date.now(),
        vis.map((i) => (i.disabled ? null : i.label)),
        currentIndex(),
      );
      typed = r.state;
      if (r.index >= 0) move(r.index, roving);
    } else handled = false;
    if (handled) e.preventDefault();
    return handled;
  };

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
        if (selection !== "none" && !o.hasAttribute("aria-selected"))
          o.setAttribute("aria-selected", "false");
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
  for (const el of root.querySelectorAll<HTMLElement>(
    "[data-cap='listbox']:not([data-cap-ready])",
  )) {
    el.dataset.capReady = "";
    const input = el.id
      ? (document.querySelector<HTMLInputElement>(`input[aria-controls~="${CSS.escape(el.id)}"]`) ??
        null)
      : null;
    const lb = createListbox(el, {
      input,
      filterInput: input !== null && el.dataset.filter !== undefined,
    });
    listboxes.set(el, lb);
    undo.push(lb.detach);
  }
  return () => undo.forEach((f) => f());
}
