import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { useHydrated } from "../hooks/hooks.react.tsx";
import { useOptionalMessage } from "../message/message.react.tsx";
import { changeText, moveRow, rowFieldName } from "./repeater-field.ts";

const FOCUSABLE = "input:not([type='hidden']), select, textarea, button, [tabindex]";

export interface RepeaterRowApi<T> {
  // The row's index and its label ("Link 2"), for the labels of its fields.
  index: number;
  label: string;
  // Change some of the row's values.
  set: (patch: Partial<T>) => void;
  // The posted name of one of its fields (`links[2][url]`), for a form that posts without script.
  name: (key: string) => string;
}

export interface RepeaterFieldProps<T> {
  // The group's name, as its legend ("Links").
  legend: ReactNode;
  help?: ReactNode;
  error?: ReactNode;
  rows: T[];
  onChange: (rows: T[]) => void;
  // A new, empty row.
  newRow: () => T;
  // The row's name ("Link 2"), from its place: its group's name, and in each button's name.
  rowLabel: (index: number, row: T) => string;
  // The row's fields: labeled controls, named with api.name(key) when the form posts.
  children: (row: T, api: RepeaterRowApi<T>) => ReactNode;
  // The add button's words. Default "Add another".
  addLabel?: string;
  min?: number;
  max?: number;
  // Move up and Move down on each row.
  reorder?: boolean;
  // The field name the rows post under. With `json`, script posts them as one JSON array in a
  // hidden input of this name; rowsFromForm reads either form.
  name?: string;
  json?: boolean;
  // Empty rows added before script runs, so a form with no script can take a new row (default
  // 1 when `name` is set): the add and remove buttons need script.
  spare?: number;
}

// A list of rows of fields a person adds to, removes from and reorders: links, authors,
// materials. Each row is a group named by its place; the buttons name the row they act on;
// focus goes to the new row, the row after a removed one, or follows a moved row; and each
// change is said in the status region when the app has a MessageProvider.
export function RepeaterField<T>({
  legend,
  help,
  error,
  rows,
  onChange,
  newRow,
  rowLabel,
  children,
  addLabel = "Add another",
  min = 0,
  max = Infinity,
  reorder = false,
  name,
  json = false,
  spare,
}: RepeaterFieldProps<T>) {
  const base = useId();
  const ready = useHydrated();
  const message = useOptionalMessage();
  const list = useRef<HTMLOListElement>(null);
  const add = useRef<HTMLButtonElement>(null);
  // Stable keys beside the rows, kept in step by every change made here.
  const [ids, setIds] = useState(() => ({ list: rows.map((_, i) => i), next: rows.length }));
  let keys = ids.list;
  if (keys.length !== rows.length) {
    const list = keys.slice(0, rows.length);
    let next = ids.next;
    while (list.length < rows.length) list.push(next++);
    setIds({ list, next });
    keys = list;
  }
  // After a change, where focus goes: a row's first control, a row's button, or Add.
  const focusNext = useRef<{ row: number; part?: string } | "add" | null>(null);
  useEffect(() => {
    const want = focusNext.current;
    focusNext.current = null;
    if (!want) return;
    if (want === "add") return add.current?.focus();
    const item = list.current?.children[want.row];
    // A move stays on its button; at the end of the list, where it turns off, on the other one.
    const parts = want.part ? [want.part, want.part === "move-up" ? "move-down" : "move-up"] : [];
    const target = parts
      .map((part) => item?.querySelector<HTMLElement>(`[data-cap-part='${part}']:not(:disabled)`))
      .find(Boolean);
    (target ?? item?.querySelector<HTMLElement>(FOCUSABLE))?.focus();
  });

  const extra = !ready && name ? (spare ?? 1) : 0;
  const shown: T[] = [
    ...rows,
    ...Array.from({ length: Math.max(0, Math.min(extra, max - rows.length)) }, newRow),
  ];
  const hasError = error != null && error !== false && error !== "";
  const say = (text: string) => message?.say(text, { clears: true });

  const change = (next: T[], list: number[]) => {
    setIds((was) => ({ list, next: Math.max(was.next, ...list.map((k) => k + 1)) }));
    onChange(next);
  };

  return (
    <fieldset
      className="cap-field cap-repeater"
      aria-describedby={
        [hasError ? `${base}-error` : null, help ? `${base}-help` : null]
          .filter(Boolean)
          .join(" ") || undefined
      }
      data-invalid={hasError ? "true" : undefined}
    >
      <legend className="cap-field-label">{legend}</legend>
      {help ? (
        <p className="cap-field-help" id={`${base}-help`}>
          {help}
        </p>
      ) : null}
      <ol className="cap-repeater-list" ref={list}>
        {shown.map((row, i) => {
          const label = rowLabel(i, row);
          const api: RepeaterRowApi<T> = {
            index: i,
            label,
            set: (patch) => onChange(rows.map((r, j) => (j === i ? { ...r, ...patch } : r))),
            name: (key) => (name ? rowFieldName(name, i, key) : key),
          };
          const move = (by: -1 | 1) => {
            const to = i + by;
            change(moveRow(rows, i, to), moveRow(keys, i, to));
            focusNext.current = { row: to, part: by < 0 ? "move-up" : "move-down" };
            say(changeText(by < 0 ? "up" : "down", label, rowLabel(to, row)));
          };
          return (
            <li className="cap-repeater-row" key={keys[i] ?? `spare-${i}`}>
              <fieldset className="cap-repeater-group" aria-label={label}>
                <div className="cap-repeater-fields">{children(row, api)}</div>
                <div className="cap-repeater-actions" hidden={!ready}>
                  {reorder ? (
                    <>
                      <button
                        type="button"
                        className="cap-btn"
                        data-size="sm"
                        data-variant="quiet"
                        data-cap-part="move-up"
                        disabled={i === 0}
                        onClick={() => move(-1)}
                      >
                        Move up<span className="cap-sr-only"> {label}</span>
                      </button>
                      <button
                        type="button"
                        className="cap-btn"
                        data-size="sm"
                        data-variant="quiet"
                        data-cap-part="move-down"
                        disabled={i === rows.length - 1}
                        onClick={() => move(1)}
                      >
                        Move down<span className="cap-sr-only"> {label}</span>
                      </button>
                    </>
                  ) : null}
                  <button
                    type="button"
                    className="cap-btn"
                    data-size="sm"
                    data-variant="quiet"
                    data-cap-part="remove"
                    disabled={rows.length <= min}
                    onClick={() => {
                      change(
                        rows.filter((_, j) => j !== i),
                        keys.filter((_, j) => j !== i),
                      );
                      focusNext.current =
                        rows.length - 1 > 0 ? { row: Math.min(i, rows.length - 2) } : "add";
                      say(changeText("removed", label));
                    }}
                  >
                    Remove<span className="cap-sr-only"> {label}</span>
                  </button>
                </div>
              </fieldset>
            </li>
          );
        })}
      </ol>
      {json && name && ready ? (
        <input type="hidden" name={name} value={JSON.stringify(rows)} />
      ) : null}
      <div className="cap-repeater-add" hidden={!ready}>
        <button
          type="button"
          className="cap-btn"
          data-size="sm"
          ref={add}
          disabled={rows.length >= max}
          onClick={() => {
            const row = newRow();
            change([...rows, row], [...keys, ids.next]);
            focusNext.current = { row: rows.length };
            say(changeText("added", rowLabel(rows.length, row)));
          }}
        >
          {addLabel}
        </button>
      </div>
      <p className="cap-field-error" id={`${base}-error`} hidden={!hasError}>
        {hasError ? error : null}
      </p>
    </fieldset>
  );
}
