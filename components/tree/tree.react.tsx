import { useId, useLayoutEffect, useMemo, useRef, useState, type KeyboardEvent, type MouseEvent, type PointerEvent, type ReactNode } from "react";
import { nextTypeahead, TYPEAHEAD_MS, type TypeaheadState } from "../listbox/listbox.ts";
import { startPointerDrag } from "../sortable-list/sortable-list.ts";
import { cannotMoveText, dropMove, findNode, movedText, applyMove, planMove, treeKey, visibleRows, zoneAt, type DropZone, type TreeMove, type TreeSelection } from "./tree.ts";

export { applyMove, branchIds, dropMove, findNode, findPlace, movedText, planMove, reverseMove, treeKey, visibleRows } from "./tree.ts";
export type { DropZone, MoveDir, TreeMove, TreePlace, TreeSelection, VisibleRow } from "./tree.ts";

// The tree's HTML contract, rendered from props, with the roles and states the behaviour
// module writes on the delivered markup. Which branches are open and which rows are chosen
// can be the caller's (`expanded`, `selected`) or the tree's own (`defaultExpanded`,
// `defaultSelected`). The nodes are always the caller's: a move calls `onMove`, and the
// caller saves the new tree (`applyMove` makes it). Nothing here sets a `style` prop.

export interface TreeNode {
  id: string;
  label: string;
  // Makes the row a link.
  href?: string;
  // Beside the label, read as part of the row's name: a status, a word count. No controls.
  meta?: ReactNode;
  icon?: ReactNode;
  disabled?: boolean;
  // A branch, even when empty.
  children?: TreeNode[];
}

export interface TreeProps {
  nodes: TreeNode[];
  "aria-label"?: string;
  "aria-labelledby"?: string;
  selection?: TreeSelection;
  selected?: string[];
  defaultSelected?: string[];
  onSelectedChange?: (ids: string[], node: TreeNode) => void;
  expanded?: string[];
  defaultExpanded?: string[];
  onExpandedChange?: (ids: string[]) => void;
  // Turns on moving, by Alt with an arrow and by dragging a row. The caller saves the move.
  onMove?: (move: TreeMove, next: TreeNode[]) => void;
  // Refuses a move before it is offered (a scene may not sit at the top level, say).
  canMove?: (move: TreeMove) => boolean;
  // Draws its own border and surface, for a tree on its own.
  variant?: "surface";
  className?: string;
}

const Chevron = () => (
  <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" focusable="false">
    <path d="M6 3.5 10.5 8 6 12.5" />
  </svg>
);

function useControllable<T>(value: T | undefined, initial: T, onChange?: (v: T) => void): [T, (v: T) => void] {
  const [own, setOwn] = useState(initial);
  const v = value ?? own;
  return [
    v,
    (next: T) => {
      if (value === undefined) setOwn(next);
      onChange?.(next);
    },
  ];
}

export function Tree({ nodes, selection = "single", selected, defaultSelected = [], onSelectedChange, expanded, defaultExpanded = [], onExpandedChange, onMove, canMove, variant, className, ...name }: TreeProps) {
  const [open, setOpen] = useControllable(expanded, defaultExpanded, onExpandedChange);
  const [chosen, setChosenRaw] = useState(defaultSelected);
  const picked = selected ?? chosen;
  const openSet = useMemo(() => new Set(open), [open]);
  const rows = useMemo(() => visibleRows(nodes, openSet), [nodes, openSet]);
  const [current, setCurrent] = useState<string | null>(null);
  const [said, setSaid] = useState("");
  const [drop, setDrop] = useState<{ id: string; zone: DropZone } | null>(null);
  const [dragging, setDragging] = useState<string | null>(null);
  const rowEls = useRef(new Map<string, HTMLElement>());
  const wantFocus = useRef<string | null>(null);
  const typed = useRef<TypeaheadState>({ buffer: "", at: 0 });
  const prefix = useId();
  const movable = !!onMove;

  // The tab stop: the focused row, else the chosen one that shows, else the first.
  const stop = rows.some((r) => r.id === current) ? current : (rows.find((r) => picked.includes(r.id))?.id ?? rows[0]?.id ?? null);

  useLayoutEffect(() => {
    if (!wantFocus.current) return;
    const el = rowEls.current.get(wantFocus.current);
    wantFocus.current = null;
    el?.focus({ preventScroll: true });
    el?.scrollIntoView({ block: "nearest" });
  });

  const focusRow = (id: string) => {
    setCurrent(id);
    wantFocus.current = id;
  };
  const say = (text: string) => setSaid((prev) => (prev === text ? `${text} ` : text));
  const toggle = (id: string, on: boolean) => {
    if (openSet.has(id) === on) return;
    setOpen(on ? [...open, id] : open.filter((x) => x !== id));
  };
  const choose = (node: TreeNode) => {
    if (selection === "none" || node.disabled) return;
    const next = selection === "single" ? [node.id] : picked.includes(node.id) ? picked.filter((x) => x !== node.id) : [...picked, node.id];
    if (selected === undefined) setChosenRaw(next);
    onSelectedChange?.(next, node);
  };
  const doMove = (m: TreeMove | null, dir?: Parameters<typeof cannotMoveText>[1]) => {
    if (!onMove) return;
    if (!m || (canMove && !canMove(m))) {
      const node = m ? findNode(nodes, m.id) : current ? findNode(nodes, current) : undefined;
      if (node && dir) say(cannotMoveText(node.label, dir));
      return;
    }
    const next = applyMove(nodes, m);
    if (m.to.parent !== null && !openSet.has(m.to.parent)) setOpen([...open, m.to.parent]);
    say(movedText(next, m));
    focusRow(m.id);
    onMove(m, next);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLUListElement>) => {
    const id = (e.target as HTMLElement).closest<HTMLElement>("[data-cap-id]")?.dataset.capId ?? null;
    if (!id || e.nativeEvent.isComposing) return;
    const row = e.target as HTMLElement;
    if (e.key === "Enter" && row.matches("a[href]")) return;
    const typing = Date.now() - typed.current.at <= TYPEAHEAD_MS && typed.current.buffer !== "";
    const r = e.key === " " && typing ? null : treeKey(rows, id, e.key, e, movable);
    if (r) {
      e.preventDefault();
      if (r.expand?.length) setOpen([...open, ...r.expand.filter((x) => !openSet.has(x))]);
      if (r.collapse) toggle(r.collapse, false);
      if (r.focus) focusRow(r.focus);
      if (r.select) {
        const node = findNode(nodes, r.select);
        if (node) choose(node);
      }
      if (r.move) doMove(planMove(nodes, id, r.move), r.move);
      return;
    }
    if (e.key.length === 1 && (e.key !== " " || typing) && !e.altKey && !e.ctrlKey && !e.metaKey) {
      const res = nextTypeahead(typed.current, e.key, Date.now(), rows.map((x) => x.label), rows.findIndex((x) => x.id === id));
      typed.current = res.state;
      const hit = rows[res.index];
      if (hit) {
        e.preventDefault();
        focusRow(hit.id);
      }
    }
  };

  const onRowClick = (e: MouseEvent, node: TreeNode) => {
    if ((e.target as Element).closest(".cap-tree-toggle")) {
      e.preventDefault();
      toggle(node.id, !openSet.has(node.id));
      focusRow(node.id);
      return;
    }
    setCurrent(node.id);
    choose(node);
  };

  const onPointerDown = (e: PointerEvent, node: TreeNode) => {
    if (!movable || node.disabled || (e.target as Element).closest(".cap-tree-toggle")) return;
    let plan: TreeMove | null = null;
    startPointerDrag(e.nativeEvent, {
      onStart: () => setDragging(node.id),
      onMove(x, y) {
        plan = null;
        const over = document.elementFromPoint(x, y)?.closest<HTMLElement>("[data-cap-id]");
        const target = over?.dataset.capId;
        if (!over || !target || target === node.id || !rowEls.current.has(target)) return setDrop(null);
        const box = over.getBoundingClientRect();
        const zone = zoneAt(y, box.top, box.height, findNode(nodes, target)?.children !== undefined);
        const m = dropMove(nodes, node.id, target, zone);
        plan = m && (!canMove || canMove(m)) ? m : null;
        setDrop(plan ? { id: target, zone } : null);
      },
      onDrop() {
        setDrop(null);
        setDragging(null);
        if (plan) doMove(plan);
      },
      onCancel() {
        setDrop(null);
        setDragging(null);
        say(`Put ${node.label} back.`);
      },
    });
  };

  const render = (list: TreeNode[], level: number): ReactNode =>
    list.map((node, i) => {
      const branch = node.children !== undefined;
      const isOpen = branch && openSet.has(node.id);
      const groupId = `${prefix}-g-${node.id}`;
      const Row = node.href ? "a" : "span";
      return (
        <li key={node.id} className="cap-tree-item" role="none" data-value={node.id}>
          <Row
            ref={(el: HTMLElement | null) => {
              if (el) rowEls.current.set(node.id, el);
              else rowEls.current.delete(node.id);
            }}
            className="cap-tree-row"
            role="treeitem"
            href={node.href}
            draggable={false}
            tabIndex={node.id === stop ? 0 : -1}
            aria-level={level}
            aria-posinset={i + 1}
            aria-setsize={list.length}
            aria-expanded={branch ? isOpen : undefined}
            aria-owns={branch && node.children!.length > 0 ? groupId : undefined}
            aria-selected={selection === "none" || node.disabled ? undefined : picked.includes(node.id)}
            aria-disabled={node.disabled ? true : undefined}
            data-cap-id={node.id}
            data-drop={drop?.id === node.id ? drop.zone : undefined}
            data-dragging={dragging === node.id ? "" : undefined}
            onClick={(e: MouseEvent) => onRowClick(e, node)}
            onFocus={() => setCurrent(node.id)}
            onPointerDown={(e: PointerEvent) => onPointerDown(e, node)}
          >
            {branch ? (
              <span className="cap-tree-toggle" aria-hidden="true">
                <Chevron />
              </span>
            ) : null}
            {node.icon != null ? <span className="cap-tree-icon">{node.icon}</span> : null}
            <span className="cap-tree-label">{node.label}</span>
            {node.meta != null ? <span className="cap-tree-meta">{node.meta}</span> : null}
          </Row>
          {branch && node.children!.length > 0 ? (
            <ul className="cap-tree-group" role="group" id={groupId} hidden={!isOpen}>
              {render(node.children!, level + 1)}
            </ul>
          ) : null}
        </li>
      );
    });

  return (
    <>
      <ul
        {...name}
        className={className ? `cap-tree ${className}` : "cap-tree"}
        role="tree"
        aria-multiselectable={selection === "multi" ? true : undefined}
        data-variant={variant}
        data-movable={movable ? "" : undefined}
        data-sorting={dragging ? "" : undefined}
        data-cap-ready=""
        onKeyDown={onKeyDown}
      >
        {render(nodes, 1)}
      </ul>
      <div className="cap-sr-only" role="status" aria-atomic="true" data-cap-part="announce">
        {said}
      </div>
    </>
  );
}
