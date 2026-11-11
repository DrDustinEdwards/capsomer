import {
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type FocusEvent,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
} from "react";
import {
  indexAtPoint,
  keyMove,
  locate,
  moveBetween,
  sortText,
  startPointerDrag,
  type Layout,
  type Lists,
  type SortMessages,
  type SortMove,
} from "./sortable-list.ts";

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

// The sortable list's HTML contract, rendered from props. The items are the caller's: a
// finished move calls `onReorder` with the new order, and the list shows the caller's
// `items` again on the next render, so a host that does not save the order sees it go back.
// While an item is up (keyboard) or under the pointer, the list holds a draft order of its
// own. With `name`, every item carries a hidden `name` input with its id, and Move up and
// Move down are submit buttons (`up=<id>`, `down=<id>`), so a server-rendered list inside a
// form reorders with no script. Nothing here sets a `style` prop.
//
// One engine drives both exports: SortableList is one list, SortableBoard several lists whose
// items move between them. Besides moving, a list can add and remove items (repeatable rows),
// say what it says in a host's own words, take Alt and an arrow anywhere in an item, and show
// an item as a card with its own head line.

export interface SortState {
  index: number;
  lifted: boolean;
  // The id of the list the item is in ("" for a SortableList).
  list: string;
}

interface CoreProps<T> {
  getId: (item: T) => string;
  // The words a person knows the item by: "Move {label}", "Picked up {label}".
  getLabel: (item: T) => string;
  // The item's own content, beside the handle and the buttons. No drag handle of its own.
  renderItem: (item: T, state: SortState) => ReactNode;
  // A line between the handle and the buttons, in the item's head: "Step 3", an item's title. In
  // the "cards" and "stack" layouts the head sits over the content.
  renderHead?: (item: T, state: SortState) => ReactNode;
  // "rows" (the default), "cards" (a wrapping grid) or "stack" (a card per line, the head over the
  // content, for an item whose body is fields).
  layout?: Layout;
  // Says what the list says in the host's own words: any of the sentences in `sortText`.
  messages?: Partial<SortMessages>;
  // Alt and Up or Down anywhere in an item moves it one place, as the buttons do (not from a
  // select, where Alt+Down opens it). The buttons name the shortcut with aria-keyshortcuts.
  altKeys?: boolean;
  // Shows the order with no handle and no buttons: a published book, a locked list.
  readOnly?: boolean;
  // A move or save is under way: every control is disabled.
  busy?: boolean;
  // Remove: a button after Move down. `onRemove` hears it; the list says so and puts focus on the
  // next item. Not offered at `min` items or fewer.
  onRemove?: (id: string, at: { index: number; list: string }) => void;
  min?: number;
  // Said in place of an empty list: "No hosts yet."
  empty?: ReactNode;
  // The first number of the ordered list (`start` of the `ol`).
  start?: number;
  // The form field name for the order; turns the buttons into submit buttons.
  name?: string;
  className?: string;
  // How Move up and Move down are drawn: "quiet" icon buttons (the default), "bordered" icon
  // buttons, or "labeled" bordered buttons with the words Up and Down.
  steps?: "quiet" | "bordered" | "labeled";
  // The grip; on by default. Off, the item has no drag handle and moves by its buttons (and Alt
  // and an arrow, with altKeys).
  grip?: boolean;
  // A class of the site's own on an item, for a state it draws (an excluded entry).
  itemClassName?: (item: T, state: SortState) => string | undefined;
  // The site's own controls in the item's buttons, after the steps and the move-to select and
  // before Remove (a checkbox, say).
  renderControls?: (item: T, state: SortState) => ReactNode;
}

export interface SortableListProps<T> extends CoreProps<T> {
  items: readonly T[];
  onReorder: (order: string[], move: SortMove) => void;
  // Add: a button under the list that calls `onAdd` (the host appends the item), then says so and
  // puts focus in the new item's first field. Off at `max` items.
  onAdd?: () => void;
  addLabel?: string;
  max?: number;
  "aria-label"?: string;
  "aria-labelledby"?: string;
}

export interface SortLane<T> {
  id: string;
  // What the list is called: the name of its list, said when an item moves into it, and the label of
  // its option in the move-to select.
  label: string;
  items: readonly T[];
  // Said in place of this list's items when it has none: "Empty. Drag an abstract here."
  empty?: ReactNode;
}

export interface BoardMove extends SortMove {
  fromList: string;
  toList: string;
}

export interface SortableBoardProps<T> extends CoreProps<T> {
  lanes: readonly SortLane<T>[];
  // Every list's new order, and what moved. The host saves it.
  onMove: (lists: Lists, move: BoardMove) => void;
  // The heading or heading and note above a list's items. Wrapped in the list's section.
  renderLaneHead?: (lane: SortLane<T>) => ReactNode;
  // A select in each item to move it to another list: the one-pointer way across lists
  // (WCAG 2.5.7). On by default.
  moveTo?: boolean;
  // A class of the site's own on a list's section (.cap-sortable-lane), for its look.
  laneClassName?: string | ((lane: SortLane<T>) => string | undefined);
  "aria-label"?: string;
}

const Grip = () => (
  <svg
    viewBox="0 0 16 16"
    width="16"
    height="16"
    fill="currentColor"
    aria-hidden="true"
    focusable="false"
  >
    <circle cx="6" cy="3.5" r="1.25" />
    <circle cx="10" cy="3.5" r="1.25" />
    <circle cx="6" cy="8" r="1.25" />
    <circle cx="10" cy="8" r="1.25" />
    <circle cx="6" cy="12.5" r="1.25" />
    <circle cx="10" cy="12.5" r="1.25" />
  </svg>
);
const Arrow = ({ up }: { up: boolean }) => (
  <svg
    viewBox="0 0 16 16"
    width="16"
    height="16"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    focusable="false"
  >
    <path d={up ? "M8 13V3M3.5 7.5 8 3l4.5 4.5" : "M8 3v10M3.5 8.5 8 13l4.5-4.5"} />
  </svg>
);

type Part = "handle" | "up" | "down" | "remove" | "move-to";

interface CoreInput<T> extends CoreProps<T> {
  lanes: readonly SortLane<T>[];
  board: boolean;
  onChange: (lists: Lists, move: BoardMove) => void;
  onAdd?: () => void;
  addLabel?: string;
  max?: number;
  moveTo?: boolean;
  renderLaneHead?: (lane: SortLane<T>) => ReactNode;
  laneClassName?: string | ((lane: SortLane<T>) => string | undefined);
  label: { "aria-label"?: string; "aria-labelledby"?: string };
}

function Core<T>({
  lanes,
  board,
  getId,
  getLabel,
  renderItem,
  renderHead,
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

  // React may move or remake the focused element when it reorders: put focus back where it was.
  useLayoutEffect(() => {
    const w = wantFocus.current;
    if (!w) return;
    wantFocus.current = null;
    if (w.el?.isConnected) {
      if (document.activeElement !== w.el) w.el.focus({ preventScroll: true });
      return;
    }
    const at = locate(live.current, w.id);
    let part = w.part;
    if (at && part === "up" && at.index === 0) part = "down";
    if (at && part === "down" && at.index === (live.current[at.list]?.length ?? 0) - 1) part = "up";
    const el =
      part === "handle"
        ? (handles.current.get(w.id) ?? controls.current.get(`${w.id}:up`))
        : controls.current.get(`${w.id}:${part}`);
    if (el && document.activeElement !== el) el.focus({ preventScroll: true });
  });

  // After Remove: focus goes to the item that took the removed one's place, or the one before it,
  // or the Add button; after Add: into the new item's first field.
  const afterRemove = useRef<{ list: string; index: number; total: number } | null>(null);
  const added = useRef<{ ids: Set<string> } | null>(null);
  useLayoutEffect(() => {
    const r = afterRemove.current;
    if (r && total < r.total) {
      afterRemove.current = null;
      const left = live.current[r.list] ?? [];
      const id = left[Math.min(r.index, left.length - 1)];
      // With no grip, the item's first button takes focus.
      const el =
        id === undefined
          ? addRef.current
          : (handles.current.get(id) ??
            itemEls.current
              .get(id)
              ?.querySelector<HTMLElement>(".cap-sortable-steps button:enabled"));
      el?.focus({ preventScroll: true });
    }
    const a = added.current;
    if (a && total > a.ids.size) {
      added.current = null;
      const fresh = laneIds.flatMap((l) => live.current[l] ?? []).filter((id) => !a.ids.has(id));
      const id = fresh[fresh.length - 1];
      if (id !== undefined) {
        const body = itemEls.current
          .get(id)
          ?.querySelector<HTMLElement>(
            ".cap-sortable-body :is(input, select, textarea, [contenteditable='true'], [tabindex='0'])",
          );
        (body ?? handles.current.get(id) ?? controls.current.get(`${id}:up`))?.focus();
        const it = byId.get(id);
        if (it !== undefined) say(text.added(getLabel(it), total));
      }
    }
  });

  const laneWords = (list: string) => laneOf.get(list)?.label ?? list;
  // Words for where an item landed: its place, and its list when that changed.
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

  // The move-to select: the end of the chosen list.
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
    say(text.removed(labelOf(id), total - 1));
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
    }, 3000);
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

  const setRef =
    (map: { current: Map<string, HTMLElement> }, key: string) => (el: HTMLElement | null) => {
      if (el) map.current.set(key, el);
      else map.current.delete(key);
    };

  // Leaving the list while an item is up puts it back.
  const onBlur = (e: FocusEvent<HTMLElement>) => {
    const to = e.relatedTarget as Node | null;
    if (lifted && to && !e.currentTarget.contains(to)) cancel();
  };

  const renderLane = (lane: SortLane<T>) => {
    const order = current[lane.id] ?? [];
    const laneEmpty = lane.empty ?? empty;
    const list = (
      // oxlint-disable-next-line jsx-a11y/no-noninteractive-element-interactions -- delegates the events of the controls inside it
      <ol
        key={lane.id}
        {...(board ? { "aria-label": lane.label } : label)}
        ref={board ? undefined : (el) => setRef(laneEls, lane.id)(el)}
        className={className ? `cap-sortable ${className}` : "cap-sortable"}
        data-layout={layout}
        data-sorting={dragging ? "" : undefined}
        data-readonly={readOnly ? "" : undefined}
        data-cap-ready=""
        start={start}
        onBlur={board ? undefined : onBlur}
      >
        {order.map((id, index) => {
          const item = byId.get(id)!;
          const up = lifted?.id === id;
          const words = labelOf(id);
          const state: SortState = { index, lifted: up, list: lane.id };
          const head = renderHead?.(item, state);
          const own = itemClassName?.(item, state);
          return (
            // oxlint-disable-next-line jsx-a11y/no-noninteractive-element-interactions -- Alt and an arrow anywhere in an item is the keyboard twin of dragging it; the buttons are the one-pointer way
            <li
              key={id}
              ref={(el) => setRef(itemEls, id)(el)}
              className={own ? `cap-sortable-item ${own}` : "cap-sortable-item"}
              data-value={id}
              data-lifted={up ? "" : undefined}
              data-dragging={dragging === id ? "" : undefined}
              data-has-head={head ? "" : undefined}
              onKeyDown={(e) => {
                if (
                  !altKeys ||
                  readOnly ||
                  busy ||
                  !e.altKey ||
                  e.ctrlKey ||
                  e.metaKey ||
                  e.shiftKey
                )
                  return;
                if (e.key !== "ArrowUp" && e.key !== "ArrowDown") return;
                // Alt+Down opens a select; leave it there.
                if (e.target instanceof HTMLSelectElement) return;
                e.preventDefault();
                step(
                  id,
                  e.key === "ArrowUp" ? -1 : 1,
                  "handle",
                  document.activeElement as HTMLElement | null,
                );
              }}
            >
              {readOnly || !grip ? null : (
                <button
                  ref={(el) => setRef(handles, id)(el)}
                  type="button"
                  className="cap-sortable-handle"
                  aria-pressed={up}
                  aria-describedby={helpId}
                  disabled={busy}
                  onKeyDown={(e) => onHandleKey(e, id)}
                  onPointerDown={(e) => onPointerDown(e, id)}
                >
                  <Grip />
                  <span className="cap-sr-only">Move {words}</span>
                </button>
              )}
              {head ? <div className="cap-sortable-head">{head}</div> : null}
              <div className="cap-sortable-body">{renderItem(item, state)}</div>
              {readOnly ? null : (
                <span className="cap-sortable-steps">
                  {(["up", "down"] as const).map((part) => (
                    <button
                      key={part}
                      ref={(el) => setRef(controls, `${id}:${part}`)(el)}
                      type={name ? "submit" : "button"}
                      name={name ? part : undefined}
                      value={name ? id : undefined}
                      className="cap-btn"
                      data-variant={steps === "quiet" ? "quiet" : undefined}
                      data-size="sm"
                      data-icon-only={steps === "labeled" ? undefined : ""}
                      data-cap-part={part}
                      aria-keyshortcuts={
                        altKeys ? `Alt+Arrow${part === "up" ? "Up" : "Down"}` : undefined
                      }
                      disabled={busy || (part === "up" ? index === 0 : index === order.length - 1)}
                      onClick={(e) => {
                        e.preventDefault();
                        step(id, part === "up" ? -1 : 1, part);
                      }}
                    >
                      {steps === "labeled" ? (
                        <>
                          <span className="cap-sr-only">Move {words} </span>
                          {part === "up" ? "Up" : "Down"}
                        </>
                      ) : (
                        <>
                          <Arrow up={part === "up"} />
                          <span className="cap-sr-only">
                            Move {words} {part}
                          </span>
                        </>
                      )}
                    </button>
                  ))}
                  {board && moveTo && lanes.length > 1 ? (
                    <MoveTo
                      id={id}
                      words={words}
                      value={lane.id}
                      lanes={lanes}
                      disabled={busy}
                      register={(el) => setRef(controls, `${id}:move-to`)(el)}
                      onMove={(list, el) => toLane(id, list, el)}
                    />
                  ) : null}
                  {renderControls?.(item, state)}
                  {onRemove ? (
                    <button
                      ref={(el) => setRef(controls, `${id}:remove`)(el)}
                      type={name ? "submit" : "button"}
                      name={name ? "remove" : undefined}
                      value={name ? id : undefined}
                      className="cap-btn"
                      data-variant="quiet"
                      data-size="sm"
                      data-cap-part="remove"
                      disabled={busy || total <= min}
                      onClick={(e) => {
                        e.preventDefault();
                        remove(id);
                      }}
                    >
                      Remove<span className="cap-sr-only"> {words}</span>
                    </button>
                  ) : null}
                </span>
              )}
              {name ? (
                <input type="hidden" name={board ? `${name}[${lane.id}]` : name} value={id} />
              ) : null}
            </li>
          );
        })}
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
        ref={(el) => setRef(laneEls, lane.id)(el)}
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

// The move-to select of an item in a board: the one-pointer way across lists.
function MoveTo<T>({
  id,
  words,
  value,
  lanes,
  disabled,
  register,
  onMove,
}: {
  id: string;
  words: string;
  value: string;
  lanes: readonly SortLane<T>[];
  disabled: boolean;
  register: (el: HTMLElement | null) => void;
  onMove: (list: string, el: HTMLElement) => void;
}) {
  const sid = useId();
  return (
    <>
      <label className="cap-sr-only" htmlFor={sid}>
        Move {words} to
      </label>
      <select
        id={sid}
        ref={register}
        className="cap-select"
        data-size="sm"
        data-cap-part="move-to"
        data-value={id}
        value={value}
        disabled={disabled}
        onChange={(e) => onMove(e.target.value, e.target)}
      >
        {lanes.map((l) => (
          <option key={l.id} value={l.id}>
            {l.label}
          </option>
        ))}
      </select>
    </>
  );
}

// One list in order.
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

// Several lists whose items move between them: a book's sections, a board's columns. Each list is
// a section with the host's head (`renderLaneHead`) over its ordered list; an item is dragged
// into another list, moved there by the arrow keys at the end of its list, or by its select.
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

export interface Row<V> {
  id: string;
  value: V;
  index: number;
}

// Stable ids for rows a host keeps as a plain array (a form's repeatable rows, with no id of their
// own). The ids follow each row as the list moves and removes them, so a row keeps its fields and its
// focus; a row the host adds gets a new one. Give `rows.items` to the list with `rows.getId`,
// `rows.onReorder` and `rows.onRemove`; `onChange` receives the new array.
export function useRows<V>(value: readonly V[], onChange: (next: V[]) => void) {
  const prefix = useId();
  const [state, setState] = useState(() => ({
    ids: value.map((_, i) => `${prefix}-${i}`),
    next: value.length,
  }));
  let ids = state.ids;
  // The host may add or drop rows itself (Add, a reset): ids grow at the end and shrink from it.
  if (ids.length !== value.length) {
    const kept = ids.slice(0, value.length);
    let next = state.next;
    while (kept.length < value.length) kept.push(`${prefix}-${next++}`);
    ids = kept;
    setState({ ids: kept, next });
  }
  const items: Row<V>[] = value.map((v, index) => ({ id: ids[index] ?? "", value: v, index }));
  const onReorder = (order: string[]) => {
    const byId = new Map(ids.map((id, i) => [id, value[i]] as const));
    setState((s) => ({ ...s, ids: [...order] }));
    onChange(order.map((id) => byId.get(id) as V));
  };
  const onRemove = (id: string) => {
    const i = ids.indexOf(id);
    if (i < 0) return;
    setState((s) => ({ ...s, ids: ids.filter((x) => x !== id) }));
    onChange(value.filter((_, j) => j !== i));
  };
  return { items, getId: (r: Row<V>) => r.id, onReorder, onRemove };
}
