// One item of a sortable list: its handle, its content, its Move up and Move down buttons and Remove
// (sortable-list.react.tsx owns the state and says what each does).
import { useId, type KeyboardEvent, type PointerEvent, type ReactNode } from "react";
import type { SortLane, SortState } from "./sortable-list-types.ts";

export type Part = "handle" | "up" | "down" | "remove" | "move-to";

/** What the list hands each item: its own settings and what the item calls back. */
export interface ItemCtx<T> {
  renderItem: (item: T, state: SortState) => ReactNode;
  renderFoot?: (item: T, state: SortState) => ReactNode;
  byId: Map<string, T>;
  lifted: { id: string; from: number; fromList: string } | null;
  dragging: string | null;
  labelOf: (id: string) => string;
  renderHead?: (item: T, state: SortState) => ReactNode;
  itemClassName?: (item: T, state: SortState) => string | undefined;
  altKeys: boolean;
  readOnly: boolean;
  busy: boolean;
  grip: boolean;
  helpId: string;
  board: boolean;
  moveTo: boolean;
  lanes: readonly SortLane<T>[];
  steps: "quiet" | "bordered" | "labeled";
  name?: string;
  removeStyle: "quiet" | "bordered";
  min: number;
  onRemove?: (id: string, at: { index: number; list: string }) => void;
  renderControls?: (item: T, state: SortState) => ReactNode;
  step: (id: string, by: -1 | 1, part: Part, keep?: HTMLElement | null) => void;
  remove: (id: string) => void;
  toLane: (id: string, list: string, el: HTMLElement) => void;
  onHandleKey: (e: KeyboardEvent, id: string) => void;
  onPointerDown: (e: PointerEvent, id: string) => void;
  // The ref callback of an item's element ("item"), its handle, or one of its controls ("up", "down", "move-to", "remove").
  refFor: (kind: "item" | "handle" | "control", key: string) => (el: HTMLElement | null) => void;
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

export function SortItem<T>({
  c,
  lane,
  order,
  id,
  index,
}: {
  c: ItemCtx<T>;
  lane: SortLane<T>;
  order: string[];
  id: string;
  index: number;
}) {
  const {
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
  } = c;
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
      ref={refFor("item", id)}
      className={own ? `cap-sortable-item ${own}` : "cap-sortable-item"}
      data-value={id}
      data-lifted={up ? "" : undefined}
      data-dragging={dragging === id ? "" : undefined}
      data-has-head={head ? "" : undefined}
      onKeyDown={(e) => {
        if (!altKeys || readOnly || busy || !e.altKey || e.ctrlKey || e.metaKey || e.shiftKey)
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
          ref={refFor("handle", id)}
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
              ref={refFor("control", `${id}:${part}`)}
              type={name ? "submit" : "button"}
              name={name ? part : undefined}
              value={name ? id : undefined}
              className="cap-btn"
              data-variant={steps === "quiet" ? "quiet" : undefined}
              data-size="sm"
              data-icon-only={steps === "labeled" ? undefined : ""}
              data-cap-part={part}
              aria-keyshortcuts={altKeys ? `Alt+Arrow${part === "up" ? "Up" : "Down"}` : undefined}
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
              register={refFor("control", `${id}:move-to`)}
              onMove={(list, el) => toLane(id, list, el)}
            />
          ) : null}
          {renderControls?.(item, state)}
          {onRemove ? (
            <button
              ref={refFor("control", `${id}:remove`)}
              type={name ? "submit" : "button"}
              name={name ? "remove" : undefined}
              value={name ? id : undefined}
              className="cap-btn"
              data-variant={removeStyle === "quiet" ? "quiet" : undefined}
              data-size="sm"
              data-cap-part="remove"
              disabled={busy || order.length <= min}
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
      {renderFoot ? <div className="cap-sortable-foot">{renderFoot(item, state)}</div> : null}
      {name ? <input type="hidden" name={board ? `${name}[${lane.id}]` : name} value={id} /> : null}
    </li>
  );
}
