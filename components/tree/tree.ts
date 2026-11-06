// The tree: nested items a person opens and closes, chooses, and (optionally) moves, after
// the WAI-ARIA tree pattern. Delivered with no script it is nested lists with every level
// shown and every link working; `enhance` adds the roles, the closed branches, one tab stop
// with the arrow keys moving focus, selection, and moving by keyboard and by dragging. The
// tree owns no storage: a move is a cancelable `cap:tree-move` event, and the host saves it.
// No framework; the React wrapper uses the same pure functions.

import { TYPEAHEAD_MS, type TypeaheadState, nextTypeahead } from "../listbox/listbox.ts";
import { announcer, startPointerDrag } from "../sortable-list/sortable-list.ts";
import { type TreeMove, type TreeNodeLike, cannotMoveText, dropMove, findNode, movedText, planMove, treeKey, visibleRows, zoneAt } from "./tree-model.ts";

export { visibleRows, branchIds, treeKey, findNode, findPlace, isWithin, planMove, dropMove, zoneAt, applyMove, reverseMove, movedText, cannotMoveText } from "./tree-model.ts";
export type { TreeNodeLike, VisibleRow, TreeKeyResult, KeyMods, MoveDir, TreePlace, TreeMove, DropZone } from "./tree-model.ts";

// ---------------------------------------------------------------------------------------
// The controller, over the HTML contract: `[data-cap="tree"]`, a `ul.cap-tree` of
// `li.cap-tree-item[data-value]`, each holding its `.cap-tree-row` (a link, or a span) and,
// for a branch, a `ul.cap-tree-group`.

export type TreeSelection = "none" | "single" | "multi";

export interface TreeSelectDetail {
  id: string;
  label: string;
  selected: boolean;
  values: string[];
}

export interface Tree {
  readonly el: HTMLElement;
  nodes(): TreeNodeLike[];
  expanded(): string[];
  setExpanded(id: string, open: boolean): void;
  selected(): string[];
  focus(id?: string): void;
  // Makes a move, as the keyboard or a drop would: emits cap:tree-move, and unless that is
  // canceled, moves the item and says so. Returns whether it moved.
  move(move: TreeMove): boolean;
  refresh(): void;
  detach(): void;
}

let counter = 0;
const uid = (p: string) => `${p}-${++counter}`;

interface Parts {
  li: HTMLElement;
  row: HTMLElement;
  group: HTMLElement | null;
}

const partsOf = (li: HTMLElement): Parts => ({
  li,
  row: li.querySelector<HTMLElement>(":scope > .cap-tree-row")!,
  group: li.querySelector<HTMLElement>(":scope > .cap-tree-group"),
});
const itemsIn = (ul: Element) => Array.from(ul.querySelectorAll<HTMLElement>(":scope > .cap-tree-item")).filter((li) => li.querySelector(":scope > .cap-tree-row"));
const rowLabel = (row: HTMLElement) => (row.querySelector(".cap-tree-label")?.textContent ?? row.textContent ?? "").trim().replace(/\s+/g, " ");

const TOGGLE = '<svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" focusable="false"><path d="M6 3.5 10.5 8 6 12.5"/></svg>';

export function createTree(el: HTMLElement): Tree {
  const selection: TreeSelection = (el.dataset.selection as TreeSelection | undefined) ?? "single";
  const movable = el.hasAttribute("data-movable");
  const { region, made } = announcer(el);
  const say = (text: string) => {
    region.textContent = "";
    requestAnimationFrame(() => (region.textContent = text));
  };

  const parts = new Map<string, Parts>();
  const open = new Set<string>();
  const chosen = new Set<string>();
  let current: string | null = null;

  const read = (ul: Element): TreeNodeLike[] =>
    itemsIn(ul).map((li) => {
      const p = partsOf(li);
      li.dataset.value ||= uid("cap-tree-item");
      const id = li.dataset.value;
      parts.set(id, p);
      const node: TreeNodeLike = { id, label: rowLabel(p.row), disabled: p.row.getAttribute("aria-disabled") === "true" };
      if (p.group || li.hasAttribute("data-branch")) node.children = p.group ? read(p.group) : [];
      return node;
    });
  let model: TreeNodeLike[] = [];

  // Writes the roles and states from the model, the open set and the chosen set.
  const paint = () => {
    parts.clear();
    model = read(el);
    el.setAttribute("role", "tree");
    if (selection === "multi") el.setAttribute("aria-multiselectable", "true");
    const walk = (list: readonly TreeNodeLike[], level: number) => {
      list.forEach((n, i) => {
        const p = parts.get(n.id)!;
        p.li.setAttribute("role", "none");
        const r = p.row;
        r.setAttribute("role", "treeitem");
        r.id ||= uid("cap-tree-row");
        r.setAttribute("aria-level", String(level));
        r.setAttribute("aria-posinset", String(i + 1));
        r.setAttribute("aria-setsize", String(list.length));
        r.setAttribute("draggable", "false");
        if (selection !== "none" && !(r.getAttribute("aria-disabled") === "true")) r.setAttribute("aria-selected", String(chosen.has(n.id)));
        if (n.children) {
          const isOpen = open.has(n.id);
          r.setAttribute("aria-expanded", String(isOpen));
          if (!r.querySelector(":scope > .cap-tree-toggle")) {
            const t = document.createElement("span");
            t.className = "cap-tree-toggle";
            t.setAttribute("aria-hidden", "true");
            t.innerHTML = TOGGLE;
            r.prepend(t);
          }
          if (p.group) {
            p.group.id ||= uid("cap-tree-group");
            p.group.setAttribute("role", "group");
            p.group.hidden = !isOpen;
            r.setAttribute("aria-owns", p.group.id);
            walk(n.children, level + 1);
          }
        } else {
          r.removeAttribute("aria-expanded");
          r.removeAttribute("aria-owns");
          r.querySelector(":scope > .cap-tree-toggle")?.remove();
        }
      });
    };
    walk(model, 1);
    const rows = visibleRows(model, open);
    if (!current || !rows.some((r) => r.id === current)) {
      // The tab stop: the chosen row if one shows, otherwise the first.
      current = rows.find((r) => chosen.has(r.id))?.id ?? rows[0]?.id ?? null;
    }
    for (const [id, p] of parts) p.row.tabIndex = id === current ? 0 : -1;
  };

  const focusRow = (id: string) => {
    current = id;
    for (const [k, p] of parts) p.row.tabIndex = k === id ? 0 : -1;
    const r = parts.get(id)?.row;
    r?.focus({ preventScroll: true });
    r?.scrollIntoView({ block: "nearest" });
  };

  const setExpanded = (id: string, isOpen: boolean) => {
    const node = findNode(model, id);
    if (!node?.children || open.has(id) === isOpen) return;
    if (isOpen) open.add(id);
    else open.delete(id);
    const p = parts.get(id)!;
    p.row.setAttribute("aria-expanded", String(isOpen));
    if (p.group) p.group.hidden = !isOpen;
    el.dispatchEvent(new CustomEvent("cap:tree-toggle", { bubbles: true, detail: { id, expanded: isOpen } }));
  };

  const select = (id: string) => {
    if (selection === "none") return;
    const p = parts.get(id);
    if (!p || p.row.getAttribute("aria-disabled") === "true") return;
    if (selection === "single") chosen.clear();
    const on = selection === "multi" ? !chosen.has(id) : true;
    if (on) chosen.add(id);
    else chosen.delete(id);
    for (const [k, q] of parts) if (q.row.hasAttribute("aria-selected")) q.row.setAttribute("aria-selected", String(chosen.has(k)));
    const detail: TreeSelectDetail = { id, label: rowLabel(p.row), selected: on, values: [...chosen] };
    el.dispatchEvent(new CustomEvent("cap:tree-select", { bubbles: true, detail }));
  };

  const move = (m: TreeMove): boolean => {
    if (!el.dispatchEvent(new CustomEvent("cap:tree-move", { bubbles: true, cancelable: true, detail: m }))) return false;
    const li = parts.get(m.id)?.li;
    if (!li) return false;
    const hadFocus = li.contains(document.activeElement);
    let ul: HTMLElement | null = el;
    if (m.to.parent !== null) {
      const p = parts.get(m.to.parent)!;
      if (!p.group) {
        p.group = document.createElement("ul");
        p.group.className = "cap-tree-group";
        p.li.append(p.group);
      }
      ul = p.group;
      open.add(m.to.parent);
    }
    li.remove();
    ul.insertBefore(li, itemsIn(ul)[m.to.index] ?? null);
    paint();
    say(movedText(model, m));
    if (hadFocus) focusRow(m.id);
    return true;
  };

  // ---- keys
  let typed: TypeaheadState = { buffer: "", at: 0 };
  const onKey = (e: KeyboardEvent) => {
    const row = (e.target as Element | null)?.closest<HTMLElement>("[role='treeitem']");
    if (!row || !el.contains(row) || e.defaultPrevented || e.isComposing) return;
    const id = row.closest<HTMLElement>(".cap-tree-item")?.dataset.value ?? null;
    const rows = visibleRows(model, open);
    // Enter on a link is the link's own: the browser follows it, and the click selects.
    if (e.key === "Enter" && row.matches("a[href]")) return;
    // A space while letters are being typed is part of them ("02 f"), as in the listbox.
    const typing = Date.now() - typed.at <= TYPEAHEAD_MS && typed.buffer !== "";
    const r = e.key === " " && typing ? null : treeKey(rows, id, e.key, e, movable);
    if (r) {
      e.preventDefault();
      if (r.expand) for (const x of r.expand) setExpanded(x, true);
      if (r.collapse) setExpanded(r.collapse, false);
      if (r.focus) focusRow(r.focus);
      if (r.select) select(r.select);
      if (r.move && id) {
        const m = planMove(model, id, r.move);
        if (m) move(m);
        else say(cannotMoveText(rowLabel(row), r.move));
      }
      return;
    }
    if (e.key.length === 1 && (e.key !== " " || typing) && !e.altKey && !e.ctrlKey && !e.metaKey) {
      const res = nextTypeahead(typed, e.key, Date.now(), rows.map((x) => x.label), rows.findIndex((x) => x.id === id));
      typed = res.state;
      const hit = rows[res.index];
      if (hit) {
        e.preventDefault();
        focusRow(hit.id);
      }
    }
  };

  // ---- the pointer: the toggle opens and closes, the rest of the row chooses
  const rowAt = (target: EventTarget | null) => {
    const row = (target as Element | null)?.closest<HTMLElement>(".cap-tree-row");
    return row && el.contains(row) ? row : null;
  };
  const idOfRow = (row: HTMLElement) => row.closest<HTMLElement>(".cap-tree-item")?.dataset.value ?? "";
  const onClick = (e: MouseEvent) => {
    const row = rowAt(e.target);
    if (!row) return;
    const id = idOfRow(row);
    if ((e.target as Element).closest(".cap-tree-toggle")) {
      e.preventDefault();
      setExpanded(id, !open.has(id));
      focusRow(id);
      return;
    }
    focusRow(id);
    select(id);
  };

  let dropOn: HTMLElement | null = null;
  const clearDrop = () => {
    dropOn?.removeAttribute("data-drop");
    dropOn = null;
  };
  const onDown = (e: PointerEvent) => {
    const row = rowAt(e.target);
    if (!movable || !row || (e.target as Element).closest(".cap-tree-toggle") || row.getAttribute("aria-disabled") === "true") return;
    const id = idOfRow(row);
    let plan: TreeMove | null = null;
    startPointerDrag(e, {
      onStart() {
        row.setAttribute("data-dragging", "");
        el.setAttribute("data-sorting", "");
      },
      onMove(x, y) {
        clearDrop();
        plan = null;
        const over = rowAt(document.elementFromPoint(x, y));
        if (!over || over === row) return;
        const target = idOfRow(over);
        const box = over.getBoundingClientRect();
        const zone = zoneAt(y, box.top, box.height, findNode(model, target)?.children !== undefined);
        plan = dropMove(model, id, target, zone);
        if (plan) {
          dropOn = over;
          over.setAttribute("data-drop", zone);
        }
      },
      onDrop() {
        clearDrop();
        row.removeAttribute("data-dragging");
        el.removeAttribute("data-sorting");
        if (plan) {
          move(plan);
          focusRow(id);
        }
      },
      onCancel() {
        clearDrop();
        row.removeAttribute("data-dragging");
        el.removeAttribute("data-sorting");
        say(`Put ${rowLabel(row)} back.`);
      },
    });
  };

  // ---- start: read the delivered markup's own state
  model = read(el);
  for (const [id, p] of parts) {
    const node = findNode(model, id);
    if (node?.children && !p.li.hasAttribute("data-collapsed")) open.add(id);
    if (p.row.hasAttribute("data-selected") || p.row.getAttribute("aria-current") === "page") {
      if (selection === "multi" || chosen.size === 0) chosen.add(id);
    }
  }
  if (selection === "none") chosen.clear();
  paint();

  el.addEventListener("keydown", onKey);
  el.addEventListener("click", onClick);
  el.addEventListener("pointerdown", onDown);

  return {
    el,
    nodes: () => model,
    expanded: () => [...open],
    setExpanded,
    selected: () => [...chosen],
    focus: (id) => {
      const target = id ?? current;
      if (target) focusRow(target);
    },
    move,
    refresh: paint,
    detach() {
      el.removeEventListener("keydown", onKey);
      el.removeEventListener("click", onClick);
      el.removeEventListener("pointerdown", onDown);
      if (made) region.remove();
      delete el.dataset.capReady;
    },
  };
}

const trees = new WeakMap<HTMLElement, Tree>();

// The controller `enhance` made for this element, if any.
export function treeFor(el: Element | null): Tree | undefined {
  return el instanceof HTMLElement ? trees.get(el) : undefined;
}

// Attaches to every `[data-cap="tree"]` under root not yet marked `data-cap-ready`.
// Reads data-selection ("none", "single" by default, "multi") and data-movable. Returns a
// function that detaches them all.
export function enhance(root: ParentNode = document): () => void {
  const undo: Array<() => void> = [];
  for (const el of root.querySelectorAll<HTMLElement>("[data-cap='tree']:not([data-cap-ready])")) {
    el.dataset.capReady = "";
    const t = createTree(el);
    trees.set(el, t);
    undo.push(() => {
      t.detach();
      trees.delete(el);
    });
  }
  return () => undo.forEach((f) => f());
}
