// The tree: nested items a person opens and closes, chooses, and (optionally) moves, after
// the WAI-ARIA tree pattern. Delivered with no script it is nested lists with every level
// shown and every link working; `enhance` adds the roles, the closed branches, one tab stop
// with the arrow keys moving focus, selection, and moving by keyboard and by dragging. The
// tree owns no storage: a move is a cancelable `cap:tree-move` event, and the host saves it.
// No framework; the React wrapper uses the same pure functions.

import { nextTypeahead, TYPEAHEAD_MS, type TypeaheadState } from "../listbox/listbox.ts";
import { announcer, startPointerDrag } from "../sortable-list/sortable-list.ts";

// ---------------------------------------------------------------------------------------
// Pure functions, over plain nodes. A node with `children` (even an empty list) is a
// branch and can hold others; a node without is a leaf.

export interface TreeNodeLike {
  id: string;
  label?: string;
  disabled?: boolean;
  children?: readonly TreeNodeLike[];
}

export interface VisibleRow {
  id: string;
  parent: string | null;
  // One-based, as aria-level, aria-posinset and aria-setsize count.
  level: number;
  posinset: number;
  setsize: number;
  branch: boolean;
  expanded: boolean;
  disabled: boolean;
  label: string;
}

// The rows a person can reach, in order: every top node, and the children of each open branch.
export function visibleRows(nodes: readonly TreeNodeLike[], expanded: ReadonlySet<string>): VisibleRow[] {
  const out: VisibleRow[] = [];
  const walk = (list: readonly TreeNodeLike[], parent: string | null, level: number) => {
    list.forEach((n, i) => {
      const branch = n.children !== undefined;
      const open = branch && expanded.has(n.id);
      out.push({ id: n.id, parent, level, posinset: i + 1, setsize: list.length, branch, expanded: open, disabled: !!n.disabled, label: n.label ?? n.id });
      if (open) walk(n.children ?? [], n.id, level + 1);
    });
  };
  walk(nodes, null, 1);
  return out;
}

// Every branch's id, for "open everything".
export function branchIds(nodes: readonly TreeNodeLike[]): string[] {
  const out: string[] = [];
  const walk = (list: readonly TreeNodeLike[]) => {
    for (const n of list) {
      if (n.children === undefined) continue;
      out.push(n.id);
      walk(n.children);
    }
  };
  walk(nodes);
  return out;
}

// What a key does to the tree, as data: the row to focus, a branch to open or close, the
// branches to open at once (`*`), a row to choose, or a move.
export interface TreeKeyResult {
  focus?: string;
  expand?: string[];
  collapse?: string;
  select?: string;
  move?: MoveDir;
}

export interface KeyMods {
  altKey?: boolean;
  ctrlKey?: boolean;
  metaKey?: boolean;
  shiftKey?: boolean;
}

// The tree pattern's keys, from the WAI-ARIA Authoring Practices: Down and Up move between
// visible rows; Right opens a closed branch or goes to its first child; Left closes an open
// branch or goes to the parent; Home and End go to the first and last row; `*` opens every
// sibling branch; Enter and Space choose. With `movable`, Alt with an arrow moves the row.
// Letters (typeahead) are the caller's, with the listbox's `nextTypeahead`.
export function treeKey(rows: readonly VisibleRow[], current: string | null, key: string, mods: KeyMods = {}, movable = false): TreeKeyResult | null {
  if (rows.length === 0) return null;
  const i = Math.max(0, rows.findIndex((r) => r.id === current));
  const row = rows[i]!;
  if (mods.ctrlKey || mods.metaKey) return null;
  if (mods.altKey) {
    if (!movable || row.disabled) return null;
    const dir = ({ ArrowUp: "up", ArrowDown: "down", ArrowRight: "in", ArrowLeft: "out" } as const)[key as "ArrowUp"];
    return dir ? { move: dir } : null;
  }
  switch (key) {
    case "ArrowDown":
      return { focus: rows[Math.min(rows.length - 1, i + 1)]!.id };
    case "ArrowUp":
      return { focus: rows[Math.max(0, i - 1)]!.id };
    case "ArrowRight":
      if (!row.branch) return {};
      if (!row.expanded) return { expand: [row.id] };
      return rows[i + 1]?.parent === row.id ? { focus: rows[i + 1]!.id } : {};
    case "ArrowLeft":
      if (row.branch && row.expanded) return { collapse: row.id };
      return row.parent !== null ? { focus: row.parent } : {};
    case "Home":
      return { focus: rows[0]!.id };
    case "End":
      return { focus: rows[rows.length - 1]!.id };
    case "*":
      return { expand: rows.filter((r) => r.parent === row.parent && r.branch && !r.expanded).map((r) => r.id) };
    case "Enter":
    case " ":
      return row.disabled ? {} : { select: row.id };
    default:
      return null;
  }
}

// ---- moving

export type MoveDir = "up" | "down" | "in" | "out";

// Where a node sits: its parent (null at the top) and its zero-based position there.
export interface TreePlace {
  parent: string | null;
  index: number;
}

// A move: `from` is the place before it, `to` the place in the tree once the node has left
// `from`, so applying it is "take out, then put in at `to`".
export interface TreeMove {
  id: string;
  from: TreePlace;
  to: TreePlace;
}

const childrenOf = (nodes: readonly TreeNodeLike[], parent: string | null): readonly TreeNodeLike[] | undefined =>
  parent === null ? nodes : findNode(nodes, parent)?.children;

export function findNode<T extends TreeNodeLike>(nodes: readonly T[], id: string): T | undefined {
  for (const n of nodes) {
    if (n.id === id) return n;
    const hit = n.children ? findNode(n.children as readonly T[], id) : undefined;
    if (hit) return hit;
  }
  return undefined;
}

export function findPlace(nodes: readonly TreeNodeLike[], id: string, parent: string | null = null): TreePlace | null {
  const i = nodes.findIndex((n) => n.id === id);
  if (i >= 0) return { parent, index: i };
  for (const n of nodes) {
    const hit = n.children ? findPlace(n.children, id, n.id) : null;
    if (hit) return hit;
  }
  return null;
}

// Whether `id` is `ancestor` or sits anywhere under it.
export function isWithin(nodes: readonly TreeNodeLike[], id: string, ancestor: string): boolean {
  if (id === ancestor) return true;
  const a = findNode(nodes, ancestor);
  return !!a?.children && !!findNode(a.children, id);
}

// A keyboard move: up and down among its siblings; in, to the end of the branch just above
// it; out, to just after its parent. Null where it cannot go (the first row up, a row with
// no branch above it in).
export function planMove(nodes: readonly TreeNodeLike[], id: string, dir: MoveDir): TreeMove | null {
  const from = findPlace(nodes, id);
  if (!from) return null;
  const siblings = childrenOf(nodes, from.parent) ?? [];
  if (dir === "up") return from.index > 0 ? { id, from, to: { parent: from.parent, index: from.index - 1 } } : null;
  if (dir === "down") return from.index < siblings.length - 1 ? { id, from, to: { parent: from.parent, index: from.index + 1 } } : null;
  if (dir === "in") {
    const above = siblings[from.index - 1];
    if (!above?.children) return null;
    return { id, from, to: { parent: above.id, index: above.children.length } };
  }
  if (from.parent === null) return null;
  const up = findPlace(nodes, from.parent);
  return up ? { id, from, to: { parent: up.parent, index: up.index + 1 } } : null;
}

export type DropZone = "before" | "after" | "inside";

// A drop of `id` on `target`: before it, after it, or inside it (at the end; a branch only).
// Null for a drop on itself or anywhere under itself, and for one that changes nothing.
export function dropMove(nodes: readonly TreeNodeLike[], id: string, target: string, zone: DropZone): TreeMove | null {
  const from = findPlace(nodes, id);
  const at = findPlace(nodes, target);
  if (!from || !at || isWithin(nodes, target, id)) return null;
  let to: TreePlace;
  if (zone === "inside") {
    const kids = findNode(nodes, target)?.children;
    if (!kids) return null;
    to = { parent: target, index: kids.filter((k) => k.id !== id).length };
  } else {
    // The target's position once `id` has left its old place.
    const shift = from.parent === at.parent && from.index < at.index ? 1 : 0;
    to = { parent: at.parent, index: at.index - shift + (zone === "after" ? 1 : 0) };
  }
  if (to.parent === from.parent && to.index === from.index) return null;
  return { id, from, to };
}

// Where on a row a drop at height `y` lands: the top quarter before it, the bottom quarter
// after it, the middle inside it when it is a branch (otherwise the nearer half).
export function zoneAt(y: number, top: number, height: number, branch: boolean): DropZone {
  const f = height > 0 ? (y - top) / height : 0.5;
  if (branch) return f < 0.25 ? "before" : f > 0.75 ? "after" : "inside";
  return f < 0.5 ? "before" : "after";
}

// The nodes with the move made. Immutable: new arrays along the changed paths only.
export function applyMove<T extends TreeNodeLike>(nodes: readonly T[], move: TreeMove): T[] {
  const node = findNode(nodes, move.id);
  if (!node) return [...nodes];
  const without = (list: readonly T[]): T[] =>
    list.filter((n) => n.id !== move.id).map((n) => (n.children ? ({ ...n, children: without(n.children as readonly T[]) } as T) : n));
  const insert = (list: readonly T[], parent: string | null): T[] => {
    if (parent === move.to.parent) {
      const out = [...list];
      out.splice(Math.max(0, Math.min(out.length, move.to.index)), 0, node);
      return out;
    }
    return list.map((n) => (n.children ? ({ ...n, children: insert(n.children as readonly T[], n.id) } as T) : n));
  };
  return insert(without(nodes), null);
}

// The move that puts it back (for Undo).
export function reverseMove(move: TreeMove): TreeMove {
  return { id: move.id, from: move.to, to: move.from };
}

// What the live region says after a move, from the tree as it is after it.
export function movedText(nodes: readonly TreeNodeLike[], move: TreeMove): string {
  const label = (id: string) => findNode(nodes, id)?.label ?? id;
  const count = childrenOf(nodes, move.to.parent)?.length ?? 0;
  const where = move.to.parent === null ? "at the top level" : `in ${label(move.to.parent)}`;
  return `Moved ${label(move.id)} to position ${move.to.index + 1} of ${count} ${where}.`;
}

export function cannotMoveText(label: string, dir: MoveDir): string {
  return {
    up: `${label} is already first here.`,
    down: `${label} is already last here.`,
    in: `${label} cannot go in: there is no branch just above it.`,
    out: `${label} is already at the top level.`,
  }[dir];
}

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
  // cancelled, moves the item and says so. Returns whether it moved.
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
