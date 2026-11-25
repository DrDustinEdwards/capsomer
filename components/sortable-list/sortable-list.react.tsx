import {
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type FocusEvent,
  type KeyboardEvent,
  type PointerEvent,
} from "react";
import {
  indexAtPoint,
  keyMove,
  locate,
  moveBetween,
  sortText,
  startPointerDrag,
  type Lists,
  type SortMessages,
} from "./sortable-list.ts";
import { useSortFocus } from "./sortable-focus.react.ts";
import { SortItem, type ItemCtx, type Part } from "./sortable-list-item.react.tsx";
import {
  type CoreInput,
  type SortableListProps,
  type SortLane,
  type SortableBoardProps,
} from "./sortable-list-types.ts";
export { useRows } from "./sortable-rows.react.tsx";
export type { Row } from "./sortable-rows.react.tsx";
export type {
  SortState,
  SortableListProps,
  SortLane,
  BoardMove,
  SortableBoardProps,
} from "./sortable-list-types.ts";

export {
  indexAtPoint,
  keyMove,
  keyTarget,
  locate,
  moveBetween,
  moveId,
  sortText,
} from "./sortable-list.ts";
export type { Layout, Lists, SortMessages, SortMove } from "./sortable-list.ts";

// The sortable list's HTML contract, rendered from props. The caller owns the items: a finished move calls
// `onReorder`, and the list shows `items` again on the next render. With `name`, Move up and Move down are
// submit buttons (`up=<id>`, `down=<id>`), so a server-rendered list in a form reorders with no script.
// SortableList is one list; SortableBoard is several whose items move between them.

// How long an Add waits for the host's new row before giving up on moving focus into it: a host
// that refused must not have focus pulled into a row it adds later.
const ADD_WAIT_MS = 3000;

function Core<T>({
  lanes,
  board,
  getId,
  getLabel,
  renderItem,
  renderHead,
  renderFoot,
  removeStyle = "quiet",
  layout = "rows",
  messages,
  altKeys = false,
  readOnly = false,
  busy = false,
  onRemove,
  min = 0,
  empty,
  start,
  name,
  className,
  onChange,
  onAdd,
  addLabel = "Add",
  max,
  moveTo = true,
  renderLaneHead,
  laneClassName,
  steps = "quiet",
  grip = true,
  itemClassName,
  renderControls,
  label,
}: CoreInput<T>) {
  const text: SortMessages = { ...sortText, ...messages };
  const laneIds = lanes.map((l) => l.id);
  const ids: Lists = Object.fromEntries(lanes.map((l) => [l.id, l.items.map(getId)]));
  const byId = new Map(lanes.flatMap((l) => l.items.map((it) => [getId(it), it] as const)));
  const laneOf = new Map(lanes.map((l) => [l.id, l]));
  const [draft, setDraft] = useState<Lists | null>(null);
  const [lifted, setLifted] = useState<{ id: string; from: number; fromList: string } | null>(null);
  const [dragging, setDragging] = useState<string | null>(null);
  const [said, setSaid] = useState("");
  const current: Lists = Object.fromEntries(
    laneIds.map((l) => [l, (draft?.[l] ?? ids[l] ?? []).filter((id) => byId.has(id))]),
  );
  const total = laneIds.reduce((n, l) => n + (ids[l]?.length ?? 0), 0);
  const helpId = useId();
  const handles = useRef(new Map<string, HTMLElement>());
  const controls = useRef(new Map<string, HTMLElement>());
  const itemEls = useRef(new Map<string, HTMLElement>());
  const laneEls = useRef(new Map<string, HTMLElement>());
  const addRef = useRef<HTMLButtonElement>(null);
  const wantFocus = useRef<{ id: string; part: Part; el?: HTMLElement | null } | null>(null);
  const live = useRef<Lists>(current);
  useLayoutEffect(() => {
    live.current = current;
  });

  const say = (words: string) => setSaid((prev) => (prev === words ? `${words} ` : words));
  const labelOf = (id: string) => {
    const it = byId.get(id);
    return it === undefined ? id : getLabel(it);
  };

  const afterRemove = useRef<{ list: string; index: number; total: number } | null>(null);
  const added = useRef<{ ids: Set<string> } | null>(null);
  useSortFocus({
    wantFocusRef: wantFocus,
    afterRemoveRef: afterRemove,
    addedRef: added,
    live,
    handles,
    controls,
    itemEls,
    addRef,
    total,
    laneIds,
    byId,
    getLabel,
    say,
    text,
  });

  const laneWords = (list: string) => laneOf.get(list)?.label ?? list;
  const landed = (next: Lists, id: string, fromList: string, kind: "over" | "step") => {
    const at = locate(next, id);
    if (!at) return "";
    const count = next[at.list]?.length ?? 0;
    return at.list === fromList
      ? text[kind](labelOf(id), at.index + 1, count)
      : text.moveTo(labelOf(id), laneWords(at.list), at.index + 1, count);
  };
  const finish = (next: Lists, id: string, from: { list: string; index: number }) => {
    const to = locate(next, id);
    setDraft(null);
    if (to && (to.list !== from.list || to.index !== from.index))
      onChange(next, {
        id,
        from: from.index,
        to: to.index,
        fromList: from.list,
        toList: to.list,
      });
  };

  const onHandleKey = (e: KeyboardEvent, id: string) => {
    if (e.ctrlKey || e.metaKey || e.altKey || busy) return;
    const at = locate(current, id);
    if (!at) return;
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      if (lifted?.id === id) {
        const next = current;
        const words =
          at.list === lifted.fromList
            ? text.drop(
                labelOf(id),
                at.index + 1,
                next[at.list]?.length ?? 0,
                at.index !== lifted.from,
              )
            : landed(next, id, lifted.fromList, "step");
        say(words);
        setLifted(null);
        finish(next, id, { list: lifted.fromList, index: lifted.from });
      } else {
        const from = locate(ids, id) ?? at;
        setDraft(null);
        setLifted({ id, from: from.index, fromList: from.list });
        say(text.lift(labelOf(id), from.index + 1, ids[from.list]?.length ?? 0));
      }
      return;
    }
    if (lifted?.id !== id) return;
    if (e.key === "Escape") {
      e.preventDefault();
      cancel();
      return;
    }
    const sizes = laneIds.map((l) => current[l]?.length ?? 0);
    const to = keyMove(e.key, { list: laneIds.indexOf(at.list), index: at.index }, sizes);
    if (to === null) return;
    e.preventDefault();
    const toList = laneIds[to.list];
    if (toList === undefined || (toList === at.list && to.index === at.index)) return;
    const next = moveBetween(current, id, toList, to.index);
    setDraft(next);
    // While an item is up, a move says "Name: position n of m" (or its list too, across lists).
    say(landed(next, id, lifted.fromList, "over"));
    wantFocus.current = { id, part: "handle" };
  };
  const cancel = () => {
    if (!lifted) return;
    say(text.cancel(labelOf(lifted.id), lifted.from + 1, ids[lifted.fromList]?.length ?? 0));
    setLifted(null);
    setDraft(null);
    wantFocus.current = { id: lifted.id, part: "handle" };
  };

  const step = (id: string, by: -1 | 1, part: Part, keep?: HTMLElement | null) => {
    const from = locate(ids, id);
    if (!from) return;
    const to = from.index + by;
    if (to < 0 || to >= (ids[from.list]?.length ?? 0)) return;
    setLifted(null);
    const next = moveBetween(ids, id, from.list, to);
    say(text.step(labelOf(id), to + 1, next[from.list]?.length ?? 0));
    wantFocus.current = { id, part, el: keep };
    finish(next, id, from);
  };

  const toLane = (id: string, list: string, el: HTMLElement) => {
    const from = locate(ids, id);
    if (!from || from.list === list) return;
    setLifted(null);
    const next = moveBetween(ids, id, list, ids[list]?.length ?? 0);
    say(landed(next, id, from.list, "step"));
    wantFocus.current = { id, part: "move-to", el };
    finish(next, id, from);
  };

  const remove = (id: string) => {
    const at = locate(ids, id);
    if (!at || !onRemove) return;
    setLifted(null);
    // A board's lanes keep their own count: the words and `min` are the lane's.
    say(text.removed(labelOf(id), (ids[at.list]?.length ?? 1) - 1));
    afterRemove.current = { ...at, total };
    onRemove(id, { index: at.index, list: at.list });
  };

  const add = () => {
    if (!onAdd) return;
    setLifted(null);
    const token = { ids: new Set(laneIds.flatMap((l) => ids[l] ?? [])) };
    added.current = token;
    // A host that never adds anything (it refused) must not steal focus from a later change.
    window.setTimeout(() => {
      if (added.current === token) added.current = null;
    }, ADD_WAIT_MS);
    onAdd();
  };

  const onPointerDown = (e: PointerEvent, id: string) => {
    if (busy) return;
    const from = locate(ids, id);
    if (!from) return;
    let now: Lists = ids;
    startPointerDrag(e.nativeEvent, {
      onStart() {
        setLifted(null);
        setDragging(id);
      },
      onMove(x, y) {
        // The list under the pointer, else the one the item is in.
        const here = locate(now, id)?.list ?? from.list;
        const over =
          laneIds.find((l) => {
            const r = laneEls.current.get(l)?.getBoundingClientRect();
            return r && x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
          }) ?? here;
        const others = (now[over] ?? [])
          .filter((k) => k !== id)
          .flatMap((k) => {
            const el = itemEls.current.get(k);
            return el ? [el.getBoundingClientRect()] : [];
          });
        const to = indexAtPoint(others, x, y, layout);
        const at = locate(now, id);
        if (at && at.list === over && at.index === to) return;
        now = moveBetween(now, id, over, to);
        setDraft(now);
      },
      onDrop() {
        setDragging(null);
        const at = locate(now, id) ?? from;
        say(
          at.list === from.list
            ? text.drop(
                labelOf(id),
                at.index + 1,
                now[at.list]?.length ?? 0,
                at.index !== from.index,
              )
            : landed(now, id, from.list, "step"),
        );
        finish(now, id, from);
      },
      onCancel() {
        setDragging(null);
        setDraft(null);
        say(text.cancel(labelOf(id), from.index + 1, ids[from.list]?.length ?? 0));
      },
    });
  };

  const refFor =
    (kind: "item" | "handle" | "control" | "lane", key: string) => (el: HTMLElement | null) => {
      const map = { item: itemEls, handle: handles, control: controls, lane: laneEls }[kind];
      if (el) map.current.set(key, el);
      else map.current.delete(key);
    };

  const onBlur = (e: FocusEvent<HTMLElement>) => {
    const to = e.relatedTarget as Node | null;
    if (lifted && to && !e.currentTarget.contains(to)) cancel();
  };

  const ctx: ItemCtx<T> = {
    byId,
    lifted,
    dragging,
    labelOf,
    renderHead,
    itemClassName,
    altKeys,
    readOnly,
    busy,
    grip,
    helpId,
    board,
    moveTo,
    lanes,
    steps,
    name,
    removeStyle,
    min,
    onRemove,
    renderItem,
    renderControls,
    renderFoot,
    step,
    remove,
    toLane,
    onHandleKey,
    onPointerDown,
    refFor,
  };

  const renderLane = (lane: SortLane<T>) => {
    const order = current[lane.id] ?? [];
    const laneEmpty = lane.empty ?? empty;
    const list = (
      // oxlint-disable-next-line jsx-a11y/no-noninteractive-element-interactions -- delegates the events of the controls inside it
      <ol
        key={lane.id}
        {...(board ? { "aria-label": lane.label } : label)}
        ref={board ? undefined : refFor("lane", lane.id)}
        className={className ? `cap-sortable ${className}` : "cap-sortable"}
        data-layout={layout}
        data-sorting={dragging ? "" : undefined}
        data-readonly={readOnly ? "" : undefined}
        data-cap-ready=""
        start={start}
        onBlur={board ? undefined : onBlur}
      >
        {order.map((id, index) => (
          <SortItem key={id} c={ctx} lane={lane} order={order} id={id} index={index} />
        ))}
        {order.length === 0 && laneEmpty ? (
          <li className="cap-sortable-empty">{laneEmpty}</li>
        ) : null}
      </ol>
    );
    if (!board) return list;
    const laneClass = typeof laneClassName === "function" ? laneClassName(lane) : laneClassName;
    return (
      <section
        key={lane.id}
        className={laneClass ? `cap-sortable-lane ${laneClass}` : "cap-sortable-lane"}
        data-sortable-lane=""
        ref={refFor("lane", lane.id)}
      >
        {renderLaneHead?.(lane)}
        {list}
      </section>
    );
  };

  const addButton =
    onAdd && !board ? (
      <button
        ref={addRef}
        type="button"
        className="cap-btn"
        data-cap-part="add"
        disabled={busy || (max !== undefined && total >= max)}
        onClick={add}
      >
        {addLabel}
      </button>
    ) : null;
  return (
    <>
      {board ? (
        <div className="cap-sortable-board" onBlur={onBlur}>
          {lanes.map(renderLane)}
        </div>
      ) : (
        <>
          {lanes.map(renderLane)}
          {addButton}
        </>
      )}
      <p className="cap-sr-only" id={helpId}>
        {text.help}
      </p>
      <div className="cap-sr-only" role="status" aria-atomic="true" data-cap-part="announce">
        {said}
      </div>
    </>
  );
}

export function SortableList<T>({
  items,
  onReorder,
  onAdd,
  addLabel,
  max,
  "aria-label": ariaLabel,
  "aria-labelledby": labelledBy,
  ...rest
}: SortableListProps<T>) {
  const lanes = [{ id: "", label: "", items }];
  return (
    <Core
      {...rest}
      lanes={lanes}
      board={false}
      onChange={(lists, move) => onReorder(lists[""] ?? [], move)}
      onAdd={onAdd}
      addLabel={addLabel}
      max={max}
      label={{ "aria-label": ariaLabel, "aria-labelledby": labelledBy }}
    />
  );
}

// Several lists whose items move between them: dragged, moved by the arrow keys at a list's end, or by the select.
export function SortableBoard<T>({
  lanes,
  onMove,
  renderLaneHead,
  moveTo,
  "aria-label": ariaLabel,
  ...rest
}: SortableBoardProps<T>) {
  return (
    <Core
      {...rest}
      lanes={lanes}
      board
      onChange={onMove}
      moveTo={moveTo}
      renderLaneHead={renderLaneHead}
      label={{ "aria-label": ariaLabel }}
    />
  );
}
