import {
  Fragment,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
} from "react";
import {
  groupText,
  indexAtPoint,
  keyTargetAcross,
  locate,
  moveAcross,
  startPointerDrag,
  type Group,
  type GroupMove,
} from "./sortable-list.ts";
import { Arrow, Grip } from "./sortable-icons.react.tsx";

// Items in several lists that move within and between them: the sections of a book, the sessions
// of a program. One handle per item picks it up (Space or Enter) and the arrows carry it past a
// list's end into the next; Move up and Move down step it the same way; "Move to" sends it to the
// end of another list; a pointer drags it anywhere, an empty list included. Every move is said in
// one live region, and focus stays on the control that moved it. The host keeps the order: a
// finished move calls `onChange`, and the lists show the caller's `groups` again on the next render.

export interface SortableGroupsProps<T> {
  // Each list: its id, its heading, and its items in order.
  groups: ReadonlyArray<{ id: string; label: string; items: readonly T[] }>;
  getId: (item: T) => string;
  getLabel: (item: T) => string;
  renderItem: (item: T, state: { group: string; index: number; lifted: boolean }) => ReactNode;
  onChange: (groups: Group[], move: GroupMove) => void;
  // The heading level of each list's label. Default 3.
  level?: 2 | 3 | 4;
  // What an empty list says: "No abstracts in this section yet."
  emptyText?: string;
  // Say each move in the page's own live region instead of the groups' own.
  announce?: (text: string) => void;
  disabled?: boolean;
}

type Part = "handle" | "up" | "down" | "to";

export function SortableGroups<T>({
  groups,
  getId,
  getLabel,
  renderItem,
  onChange,
  level = 3,
  emptyText = "Nothing here yet.",
  announce,
  disabled,
}: SortableGroupsProps<T>) {
  const base: Group[] = groups.map((g) => ({ id: g.id, items: g.items.map(getId) }));
  const byId = new Map(groups.flatMap((g) => g.items.map((it) => [getId(it), it] as const)));
  const nameOf = new Map(groups.map((g) => [g.id, g.label]));
  const [draft, setDraft] = useState<Group[] | null>(null);
  const [lifted, setLifted] = useState<{ id: string; group: string; from: number } | null>(null);
  const [dragging, setDragging] = useState<string | null>(null);
  const [said, setSaid] = useState("");
  const order = draft ?? base;
  const helpId = useId();
  const uid = useId();
  const controls = useRef(new Map<string, HTMLElement>());
  const lists = useRef(new Map<string, HTMLElement>());
  const items = useRef(new Map<string, HTMLElement>());
  const wantFocus = useRef<{ id: string; part: Part } | null>(null);

  useLayoutEffect(() => {
    const w = wantFocus.current;
    if (!w) return;
    wantFocus.current = null;
    const at = locate(order, w.id);
    let part = w.part;
    if (at) {
      const first = at.group === 0 && at.index === 0;
      const last = at.group === order.length - 1 && at.index === order[at.group]!.items.length - 1;
      if (part === "up" && first) part = "down";
      if (part === "down" && last) part = "up";
    }
    const el = controls.current.get(`${w.id}:${part}`);
    if (el && document.activeElement !== el) el.focus({ preventScroll: true });
  });

  const say = (text: string) =>
    announce ? announce(text) : setSaid((prev) => (prev === text ? `${text} ` : text));
  const labelOf = (id: string) => {
    const it = byId.get(id);
    return it === undefined ? id : getLabel(it);
  };
  const where = (g: Group[], id: string) => {
    const at = locate(g, id)!;
    const group = g[at.group]!;
    return {
      group: group.id,
      name: nameOf.get(group.id) ?? group.id,
      index: at.index,
      count: group.items.length,
    };
  };
  const finish = (next: Group[], id: string, fromGroup: string, from: number) => {
    setDraft(null);
    const w = where(next, id);
    if (w.group !== fromGroup || w.index !== from)
      onChange(next, { id, fromGroup, from, toGroup: w.group, to: w.index });
  };

  const onHandleKey = (e: KeyboardEvent, id: string) => {
    if (e.ctrlKey || e.metaKey || e.altKey || disabled) return;
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      if (lifted?.id === id) {
        const w = where(order, id);
        say(groupText.drop(labelOf(id), w.name, w.index + 1, w.count));
        setLifted(null);
        finish(order, id, lifted.group, lifted.from);
      } else {
        const w = where(base, id);
        setDraft(null);
        setLifted({ id, group: w.group, from: w.index });
        say(groupText.lift(labelOf(id), w.name, w.index + 1, w.count));
      }
      return;
    }
    if (lifted?.id !== id) return;
    if (e.key === "Escape") {
      e.preventDefault();
      cancel();
      return;
    }
    const to = keyTargetAcross(e.key, order, id);
    if (!to) return;
    e.preventDefault();
    const next = moveAcross(order, id, order[to.group]!.id, to.index);
    setDraft(next);
    const w = where(next, id);
    say(groupText.where(labelOf(id), w.name, w.index + 1, w.count));
    wantFocus.current = { id, part: "handle" };
  };
  const cancel = () => {
    if (!lifted) return;
    const w = where(base, lifted.id);
    say(groupText.cancel(labelOf(lifted.id), w.name, w.index + 1, w.count));
    setLifted(null);
    setDraft(null);
    wantFocus.current = { id: lifted.id, part: "handle" };
  };
  const moveTo = (id: string, group: string, index: number, part: Part) => {
    const from = where(base, id);
    setLifted(null);
    const next = moveAcross(base, id, group, index);
    const w = where(next, id);
    say(groupText.moved(labelOf(id), w.name, w.index + 1, w.count));
    wantFocus.current = { id, part };
    finish(next, id, from.group, from.index);
  };
  const step = (id: string, key: "ArrowUp" | "ArrowDown") => {
    const to = keyTargetAcross(key, base, id);
    if (to) moveTo(id, base[to.group]!.id, to.index, key === "ArrowUp" ? "up" : "down");
  };

  const onPointerDown = (e: PointerEvent, id: string) => {
    if (disabled) return;
    const from = where(base, id);
    let current = base;
    startPointerDrag(e.nativeEvent, {
      onStart() {
        setLifted(null);
        setDragging(id);
      },
      onMove(x, y) {
        // The list under the pointer, else the nearest by height.
        let target = current[0]?.id;
        let best = Infinity;
        for (const g of current) {
          const r = lists.current.get(g.id)?.getBoundingClientRect();
          if (!r) continue;
          const d = y < r.top ? r.top - y : y > r.bottom ? y - r.bottom : 0;
          if (d < best) {
            best = d;
            target = g.id;
          }
        }
        const group = current.find((g) => g.id === target);
        if (!group) return;
        const others = group.items
          .filter((k) => k !== id)
          .map((k) => items.current.get(k)!.getBoundingClientRect());
        const to = indexAtPoint(others, x, y, "rows");
        const at = locate(current, id)!;
        if (current[at.group]!.id === group.id && at.index === to) return;
        current = moveAcross(current, id, group.id, to);
        setDraft(current);
      },
      onDrop() {
        setDragging(null);
        const w = where(current, id);
        say(groupText.drop(labelOf(id), w.name, w.index + 1, w.count));
        finish(current, id, from.group, from.index);
      },
      onCancel() {
        setDragging(null);
        setDraft(null);
        say(groupText.cancel(labelOf(id), from.name, from.index + 1, from.count));
      },
    });
  };

  const Heading = `h${level}` as "h2" | "h3" | "h4";
  const ref = (key: string) => (el: HTMLElement | null) => {
    if (el) controls.current.set(key, el);
    else controls.current.delete(key);
  };
  const total = order.length;
  return (
    <div className="cap-sortable-groups" data-sorting={dragging ? "" : undefined}>
      {order.map((g, gi) => {
        const headingId = `${uid}-g${gi}`;
        return (
          <section key={g.id} className="cap-sortable-group" aria-labelledby={headingId}>
            <Heading className="cap-sortable-group-label" id={headingId}>
              {nameOf.get(g.id)} <span className="cap-sortable-group-count">{g.items.length}</span>
            </Heading>
            {/* oxlint-disable-next-line jsx-a11y/no-noninteractive-element-interactions -- delegates the events of the controls inside it */}
            <ol
              ref={(el) => {
                if (el) lists.current.set(g.id, el);
                else lists.current.delete(g.id);
              }}
              className="cap-sortable"
              data-layout="rows"
              aria-labelledby={headingId}
              data-cap-ready=""
              data-empty={g.items.length === 0 ? "" : undefined}
              onBlur={(e) => {
                const to = e.relatedTarget as Node | null;
                const root = e.currentTarget.closest(".cap-sortable-groups");
                if (lifted && to && root && !root.contains(to)) cancel();
              }}
            >
              {g.items.length === 0 ? <li className="cap-sortable-empty">{emptyText}</li> : null}
              {g.items.map((id, index) => {
                const item = byId.get(id);
                if (item === undefined) return null;
                const up = lifted?.id === id;
                const text = labelOf(id);
                const first = gi === 0 && index === 0;
                const last = gi === total - 1 && index === g.items.length - 1;
                return (
                  <li
                    key={id}
                    ref={(el) => {
                      if (el) items.current.set(id, el);
                      else items.current.delete(id);
                    }}
                    className="cap-sortable-item"
                    data-value={id}
                    data-lifted={up ? "" : undefined}
                    data-dragging={dragging === id ? "" : undefined}
                  >
                    <button
                      ref={ref(`${id}:handle`)}
                      type="button"
                      className="cap-sortable-handle"
                      aria-pressed={up}
                      aria-describedby={helpId}
                      disabled={disabled}
                      onKeyDown={(e) => onHandleKey(e, id)}
                      onPointerDown={(e) => onPointerDown(e, id)}
                    >
                      <Grip />
                      <span className="cap-sr-only">Move {text}</span>
                    </button>
                    <div className="cap-sortable-body">
                      {renderItem(item, { group: g.id, index, lifted: up })}
                    </div>
                    <span className="cap-sortable-steps">
                      {total > 1 ? (
                        <select
                          ref={ref(`${id}:to`)}
                          className="cap-select"
                          data-size="sm"
                          aria-label={`Move ${text} to section`}
                          value=""
                          disabled={disabled}
                          onChange={(e) => {
                            const to = e.target.value;
                            const dest = order.find((x) => x.id === to);
                            if (dest) moveTo(id, to, dest.items.length, "to");
                          }}
                        >
                          <option value="">Move to</option>
                          {order
                            .filter((x) => x.id !== g.id)
                            .map((x) => (
                              <option key={x.id} value={x.id}>
                                {nameOf.get(x.id)}
                              </option>
                            ))}
                        </select>
                      ) : null}
                      {(["up", "down"] as const).map((part) => (
                        <Fragment key={part}>
                          <button
                            ref={ref(`${id}:${part}`)}
                            type="button"
                            className="cap-btn"
                            data-variant="quiet"
                            data-size="sm"
                            data-icon-only=""
                            data-cap-part={part}
                            disabled={disabled || (part === "up" ? first : last)}
                            onClick={() => step(id, part === "up" ? "ArrowUp" : "ArrowDown")}
                          >
                            <Arrow up={part === "up"} />
                            <span className="cap-sr-only">
                              Move {text} {part}
                            </span>
                          </button>
                        </Fragment>
                      ))}
                    </span>
                  </li>
                );
              })}
            </ol>
          </section>
        );
      })}
      <p className="cap-sr-only" id={helpId}>
        {groupText.help}
      </p>
      {announce ? null : (
        <div className="cap-sr-only" role="status" aria-atomic="true" data-cap-part="announce">
          {said}
        </div>
      )}
    </div>
  );
}
