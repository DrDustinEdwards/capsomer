import { useId, useLayoutEffect, useRef, useState, type KeyboardEvent, type PointerEvent, type ReactNode } from "react";
import { indexAtPoint, keyTarget, moveId, sortText, startPointerDrag, type Layout, type SortMove } from "./sortable-list.ts";

export { indexAtPoint, keyTarget, moveId, sortText } from "./sortable-list.ts";
export type { Layout, SortMove } from "./sortable-list.ts";

// The sortable list's HTML contract, rendered from props. The items are the caller's: a
// finished move calls `onReorder` with the new order, and the list shows the caller's
// `items` again on the next render, so a host that does not save the order sees it go back.
// While an item is up (keyboard) or under the pointer, the list holds a draft order of its
// own. With `name`, every item carries a hidden `name` input with its id, and Move up and
// Move down are submit buttons (`up=<id>`, `down=<id>`), so a server-rendered list inside a
// form reorders with no script. Nothing here sets a `style` prop.

export interface SortableListProps<T> {
  items: readonly T[];
  getId: (item: T) => string;
  // The words a person knows the item by: "Move {label}", "Picked up {label}".
  getLabel: (item: T) => string;
  // The item's own content, beside the handle and the buttons. No drag handle of its own.
  renderItem: (item: T, state: { index: number; lifted: boolean }) => ReactNode;
  onReorder: (order: string[], move: SortMove) => void;
  layout?: Layout;
  "aria-label"?: string;
  "aria-labelledby"?: string;
  // The form field name for the order; turns the buttons into submit buttons.
  name?: string;
  className?: string;
}

const Grip = () => (
  <svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor" aria-hidden="true" focusable="false">
    <circle cx="6" cy="3.5" r="1.25" />
    <circle cx="10" cy="3.5" r="1.25" />
    <circle cx="6" cy="8" r="1.25" />
    <circle cx="10" cy="8" r="1.25" />
    <circle cx="6" cy="12.5" r="1.25" />
    <circle cx="10" cy="12.5" r="1.25" />
  </svg>
);
const Arrow = ({ up }: { up: boolean }) => (
  <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
    <path d={up ? "M8 13V3M3.5 7.5 8 3l4.5 4.5" : "M8 3v10M3.5 8.5 8 13l4.5-4.5"} />
  </svg>
);

export function SortableList<T>({ items, getId, getLabel, renderItem, onReorder, layout = "rows", name, className, ...label }: SortableListProps<T>) {
  const ids = items.map(getId);
  const byId = new Map(items.map((it) => [getId(it), it]));
  const [draft, setDraft] = useState<string[] | null>(null);
  const [lifted, setLifted] = useState<{ id: string; from: number } | null>(null);
  const [dragging, setDragging] = useState<string | null>(null);
  const [said, setSaid] = useState("");
  const order = (draft ?? ids).filter((id) => byId.has(id));
  const helpId = useId();
  const handles = useRef(new Map<string, HTMLElement>());
  const steps = useRef(new Map<string, HTMLButtonElement>());
  const itemEls = useRef(new Map<string, HTMLElement>());
  const wantFocus = useRef<{ id: string; part: "handle" | "up" | "down" } | null>(null);
  const live = useRef<string[]>(order);
  live.current = order;

  // React may move the focused element when it reorders: put focus back where it was.
  useLayoutEffect(() => {
    const w = wantFocus.current;
    if (!w) return;
    wantFocus.current = null;
    const i = live.current.indexOf(w.id);
    let part = w.part;
    if (part === "up" && i === 0) part = "down";
    if (part === "down" && i === live.current.length - 1) part = "up";
    const el = part === "handle" ? handles.current.get(w.id) : steps.current.get(`${w.id}:${part}`);
    if (el && document.activeElement !== el) el.focus({ preventScroll: true });
  });

  const say = (text: string) => setSaid((prev) => (prev === text ? `${text} ` : text));
  const labelOf = (id: string) => {
    const it = byId.get(id);
    return it === undefined ? id : getLabel(it);
  };
  const finish = (next: string[], id: string, from: number) => {
    const to = next.indexOf(id);
    setDraft(null);
    if (to !== from) onReorder(next, { id, from, to });
  };

  const onHandleKey = (e: KeyboardEvent, id: string) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const count = order.length;
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      if (lifted?.id === id) {
        const to = order.indexOf(id);
        say(sortText.drop(labelOf(id), to + 1, count, to !== lifted.from));
        setLifted(null);
        finish(order, id, lifted.from);
      } else {
        const from = ids.indexOf(id);
        setDraft(null);
        setLifted({ id, from });
        say(sortText.lift(labelOf(id), from + 1, count));
      }
      return;
    }
    if (lifted?.id !== id) return;
    if (e.key === "Escape") {
      e.preventDefault();
      cancel();
      return;
    }
    const to = keyTarget(e.key, order.indexOf(id), count);
    if (to === null) return;
    e.preventDefault();
    setDraft(moveId(order, id, to));
    say(sortText.over(labelOf(id), to + 1, count));
    wantFocus.current = { id, part: "handle" };
  };
  const cancel = () => {
    if (!lifted) return;
    say(sortText.cancel(labelOf(lifted.id), lifted.from + 1, ids.length));
    setLifted(null);
    setDraft(null);
    wantFocus.current = { id: lifted.id, part: "handle" };
  };

  const step = (id: string, by: -1 | 1) => {
    const from = ids.indexOf(id);
    const to = from + by;
    if (to < 0 || to >= ids.length) return;
    setLifted(null);
    const next = moveId(ids, id, to);
    say(sortText.step(labelOf(id), to + 1, ids.length));
    wantFocus.current = { id, part: by < 0 ? "up" : "down" };
    finish(next, id, from);
  };

  const onPointerDown = (e: PointerEvent, id: string) => {
    const from = ids.indexOf(id);
    let current = ids;
    startPointerDrag(e.nativeEvent, {
      onStart() {
        setLifted(null);
        setDragging(id);
      },
      onMove(x, y) {
        const others = current.filter((k) => k !== id).map((k) => itemEls.current.get(k)!.getBoundingClientRect());
        const to = indexAtPoint(others, x, y, layout);
        if (current.indexOf(id) === to) return;
        current = moveId(current, id, to);
        setDraft(current);
      },
      onDrop() {
        setDragging(null);
        const to = current.indexOf(id);
        say(sortText.drop(labelOf(id), to + 1, ids.length, to !== from));
        finish(current, id, from);
      },
      onCancel() {
        setDragging(null);
        setDraft(null);
        say(sortText.cancel(labelOf(id), from + 1, ids.length));
      },
    });
  };

  return (
    <>
      <ol
        {...label}
        className={className ? `cap-sortable ${className}` : "cap-sortable"}
        data-layout={layout}
        data-sorting={dragging ? "" : undefined}
        data-cap-ready=""
        onBlur={(e) => {
          const to = e.relatedTarget as Node | null;
          if (lifted && to && !e.currentTarget.contains(to)) cancel();
        }}
      >
        {order.map((id, index) => {
          const item = byId.get(id)!;
          const up = lifted?.id === id;
          const text = labelOf(id);
          return (
            <li
              key={id}
              ref={(el) => {
                if (el) itemEls.current.set(id, el);
                else itemEls.current.delete(id);
              }}
              className="cap-sortable-item"
              data-value={id}
              data-lifted={up ? "" : undefined}
              data-dragging={dragging === id ? "" : undefined}
            >
              <button
                ref={(el) => {
                  if (el) handles.current.set(id, el);
                  else handles.current.delete(id);
                }}
                type="button"
                className="cap-sortable-handle"
                aria-pressed={up}
                aria-describedby={helpId}
                onKeyDown={(e) => onHandleKey(e, id)}
                onPointerDown={(e) => onPointerDown(e, id)}
              >
                <Grip />
                <span className="cap-sr-only">Move {text}</span>
              </button>
              <div className="cap-sortable-body">{renderItem(item, { index, lifted: up })}</div>
              <span className="cap-sortable-steps">
                {(["up", "down"] as const).map((part) => (
                  <button
                    key={part}
                    ref={(el) => {
                      if (el) steps.current.set(`${id}:${part}`, el);
                      else steps.current.delete(`${id}:${part}`);
                    }}
                    type={name ? "submit" : "button"}
                    name={name ? part : undefined}
                    value={name ? id : undefined}
                    className="cap-btn"
                    data-variant="quiet"
                    data-size="sm"
                    data-icon-only=""
                    data-cap-part={part}
                    disabled={part === "up" ? index === 0 : index === order.length - 1}
                    onClick={(e) => {
                      e.preventDefault();
                      step(id, part === "up" ? -1 : 1);
                    }}
                  >
                    <Arrow up={part === "up"} />
                    <span className="cap-sr-only">
                      Move {text} {part}
                    </span>
                  </button>
                ))}
              </span>
              {name ? <input type="hidden" name={name} value={id} /> : null}
            </li>
          );
        })}
      </ol>
      <p className="cap-sr-only" id={helpId}>
        {sortText.help}
      </p>
      <div className="cap-sr-only" role="status" aria-atomic="true" data-cap-part="announce">
        {said}
      </div>
    </>
  );
}
