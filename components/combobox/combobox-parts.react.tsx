import { Combobox as Base } from "@base-ui/react/combobox";
import { useCallback, useEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import { Spinner } from "../skeleton/skeleton.react.tsx";
import type { ComboboxBaseProps, ComboboxOption } from "./combobox.react.tsx";

export interface Group {
  value: string;
  items: ComboboxOption[];
}

// A made value's id in the list, before it becomes a value: the prefix plus its text.
export const MAKE = "\u0001make:";
export const tidy = (text: string) => text.trim().replace(/\s+/g, " ");

const Check = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
    <path
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      d="m3.5 8.5 3 3 6-7"
    />
  </svg>
);

export const Cross = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" aria-hidden="true" focusable="false">
    <path
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      d="M4 4l8 8M12 4l-8 8"
    />
  </svg>
);

const ErrorGlyph = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
    <path fill="currentColor" d="M5 1h6l4 4v6l-4 4H5l-4-4V5z" />
    <path fill="var(--surface)" d="M7.2 4h1.6v5H7.2zM7.2 10.4h1.6V12H7.2z" />
  </svg>
);

export const defaultEmpty = (query: string): ReactNode =>
  query.trim()
    ? `No match for “${query.trim()}”. Check the spelling, or clear the box to see every option.`
    : "Nothing to choose from yet.";

// Options with a `group` are listed under that heading, in the order each heading first
// appears; the rest come first, with no heading. With no group anywhere the list is flat.
export function grouped(items: ComboboxOption[]): ComboboxOption[] | Group[] {
  if (!items.some((i) => i.group)) return items;
  const out: Group[] = [];
  const plain = items.filter((i) => !i.group);
  if (plain.length) out.push({ value: "", items: plain });
  for (const item of items) {
    if (!item.group) continue;
    let g = out.find((x) => x.value === item.group);
    if (!g) {
      g = { value: item.group, items: [] };
      out.push(g);
    }
    g.items.push(item);
  }
  return out;
}

export function Hint({ item }: { item: ComboboxOption }) {
  return item.hint ? (
    <span className="cap-option-keys">
      <span className="cap-option-hint">{item.hint}</span>
    </span>
  ) : null;
}

function Option({ item }: { item: ComboboxOption }) {
  return (
    <Base.Item key={item.value} value={item} disabled={item.disabled} className="cap-option">
      <span className="cap-option-label">{item.label}</span>
      <Hint item={item} />
      <Base.ItemIndicator className="cap-option-indicator">
        <Check />
      </Base.ItemIndicator>
    </Base.Item>
  );
}

// The popup: the shared popover surface around the shared listbox, with the loading and
// empty messages in Base UI's own regions so a change is announced.
export function Popup({
  isGrouped,
  loading,
  loadingText,
  empty,
  container,
  anchor,
  multiple,
}: {
  isGrouped: boolean;
  loading: boolean;
  loadingText: string;
  empty: ReactNode;
  container?: HTMLElement | null;
  anchor?: RefObject<HTMLElement | null>;
  multiple: boolean;
}) {
  return (
    <Base.Portal container={container ?? undefined}>
      <Base.Positioner
        className="cap-combobox-positioner"
        sideOffset={4}
        align="start"
        anchor={anchor}
      >
        <Base.Popup className="cap-popover cap-combobox-popup" data-flush="">
          <Base.Status className="cap-combobox-status">
            {loading ? (
              <>
                <Spinner label={loadingText} />
              </>
            ) : null}
          </Base.Status>
          <Base.Empty className="cap-listbox-empty cap-combobox-empty">
            {loading ? null : empty}
          </Base.Empty>
          <Base.List
            className="cap-listbox cap-combobox-list"
            data-controlled=""
            data-selection={multiple ? "multi" : "single"}
          >
            {isGrouped
              ? (group: Group) => (
                  <Base.Group
                    key={group.value || "none"}
                    items={group.items}
                    className="cap-listbox-group"
                  >
                    {group.value ? (
                      <Base.GroupLabel className="cap-listbox-label">{group.value}</Base.GroupLabel>
                    ) : null}
                    <Base.Collection>
                      {(item: ComboboxOption) => <Option key={item.value} item={item} />}
                    </Base.Collection>
                  </Base.Group>
                )
              : (item: ComboboxOption) => <Option key={item.value} item={item} />}
          </Base.List>
        </Base.Popup>
      </Base.Positioner>
    </Base.Portal>
  );
}

// The options a search found for the typed text. The request runs from the input's change,
// not an effect: a newer keystroke clears the wait and aborts the older request, so results
// never arrive out of order. A failure says so instead of looking like "no match".
interface Found {
  items: ComboboxOption[];
  loading: boolean;
  failed: boolean;
  short: boolean;
}
const NOTHING: Found = { items: [], loading: false, failed: false, short: true };

export function useOptionSearch(
  search: ComboboxBaseProps["search"],
  delay: number,
  min: number,
): [Found, (query: string) => void] {
  const [found, setFound] = useState<Found>(NOTHING);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const request = useRef<AbortController | null>(null);
  useEffect(
    () => () => {
      clearTimeout(timer.current);
      request.current?.abort();
    },
    [],
  );
  const run = useCallback(
    (query: string) => {
      if (!search) return;
      clearTimeout(timer.current);
      request.current?.abort();
      const q = tidy(query);
      if (q.length < min) {
        setFound(NOTHING);
        return;
      }
      const controller = new AbortController();
      request.current = controller;
      setFound((f) => ({ ...f, loading: true, failed: false, short: false }));
      timer.current = setTimeout(() => {
        search(q, controller.signal).then(
          (items) => {
            if (!controller.signal.aborted)
              setFound({ items, loading: false, failed: false, short: false });
          },
          () => {
            if (!controller.signal.aborted)
              setFound({ items: [], loading: false, failed: true, short: false });
          },
        );
      }, delay);
    },
    [search, delay, min],
  );
  return [found, run];
}

// Found options and known ones, each value once, the found first (the search's own order), then
// the known options it did not return (the chosen one, so its label shows).
export function pool(known: ComboboxOption[], found: ComboboxOption[]): ComboboxOption[] {
  const seen = new Set(found.map((i) => i.value));
  return [...found, ...known.filter((i) => !seen.has(i.value))];
}

export function searchEmpty(found: Found, query: string, hint: string, failed: string): ReactNode {
  if (found.failed) return failed;
  if (found.short) return hint;
  return defaultEmpty(query);
}

export function Field({
  label,
  labelId,
  inputId,
  required,
  help,
  helpId,
  error,
  errorId,
  children,
}: {
  label: string;
  labelId: string;
  inputId: string;
  required: boolean;
  help?: ReactNode;
  helpId: string;
  error?: ReactNode;
  errorId: string;
  children: ReactNode;
}) {
  return (
    <div className="cap-combobox" data-cap="combobox">
      <label className="cap-combobox-label" id={labelId} htmlFor={inputId}>
        {label}
        {required && " (required)"}
      </label>
      {help != null && (
        <p className="cap-combobox-help" id={helpId}>
          {help}
        </p>
      )}
      {children}
      {error != null && (
        <p className="cap-combobox-error" id={errorId}>
          <ErrorGlyph />
          {error}
        </p>
      )}
    </div>
  );
}
