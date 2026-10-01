import { Combobox as Base } from "@base-ui/react/combobox";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";

export interface ComboboxOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface ComboboxProps {
  // The visible label above the box. Required: a combobox always has one.
  label: string;
  items: ComboboxOption[];
  // The chosen value, controlled. Leave undefined to let the combobox hold it
  // (defaultValue). null is "nothing chosen".
  value?: string | null;
  defaultValue?: string | null;
  onValueChange?: (value: string | null) => void;
  // An example only, never the label (patterns.md, "Form").
  placeholder?: string;
  // What an empty result says. A function gets the typed text, to name the filter.
  emptyText?: ReactNode | ((query: string) => ReactNode);
  // The items are still arriving: the popup says so instead of "no match".
  loading?: boolean;
  loadingText?: string;
  // Help under the label, outside the box; also where a disabled box says why.
  help?: ReactNode;
  // The error, beside the field: marks the box invalid and describes it.
  error?: ReactNode;
  disabled?: boolean;
  required?: boolean;
  // The form field name of the hidden input that carries the value.
  name?: string;
  id?: string;
  // Where the popup is portalled. Inside a modal <dialog> pass the dialog, or the popup
  // renders under the top layer, out of sight.
  container?: HTMLElement | null;
  // For specimens and tests: open on mount, with this text typed.
  defaultOpen?: boolean;
  defaultInputValue?: string;
}

const Check = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
    <path fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="m3.5 8.5 3 3 6-7" />
  </svg>
);

const Chevron = () => (
  <svg width="12" height="12" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
    <path fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" d="m3.5 6 4.5 4.5L12.5 6" />
  </svg>
);

const ErrorGlyph = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
    <path fill="currentColor" d="M5 1h6l4 4v6l-4 4H5l-4-4V5z" />
    <path fill="var(--surface)" d="M7.2 4h1.6v5H7.2zM7.2 10.4h1.6V12H7.2z" />
  </svg>
);

const defaultEmpty = (query: string): ReactNode => (query.trim() ? `No match for “${query.trim()}”. Check the spelling, or clear the box to see every option.` : "Nothing to choose from yet.");

// One combobox: a labelled text box that filters a list, where only a listed value can be
// chosen. Typed text that matches nothing is not kept: when the list closes, the box shows
// the chosen value's label again (or nothing).
export function Combobox(props: ComboboxProps) {
  const { label, items, placeholder, emptyText, loading = false, loadingText = "Loading", help, error, disabled = false, required = false, name, container, defaultOpen, defaultInputValue } = props;
  const autoId = useId();
  const inputId = props.id ?? `${autoId}-input`;
  const helpId = `${autoId}-help`;
  const labelId = `${autoId}-label`;
  const errorId = `${autoId}-error`;

  const [own, setOwn] = useState<string | null>(props.defaultValue ?? null);
  const current = props.value !== undefined ? props.value : own;
  const selected = items.find((i) => i.value === current) ?? null;

  // The input's text is held here so that unlisted text never outlives the open list.
  const [query, setQuery] = useState<string>(defaultInputValue ?? selected?.label ?? "");
  const chosen = useRef<ComboboxOption | null>(selected);
  chosen.current = selected;
  const open = useRef<boolean>(defaultOpen ?? false);

  // Items that arrive after the value (loading, then loaded) bring the chosen label with
  // them. Skipped on mount, so defaultInputValue stands.
  const mounted = useRef(false);
  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    if (!open.current) setQuery(selected?.label ?? "");
  }, [selected?.label]);

  const describedBy = [help != null ? helpId : "", error != null ? errorId : ""].filter(Boolean).join(" ") || undefined;
  const empty = typeof emptyText === "function" ? emptyText(query) : (emptyText ?? defaultEmpty(query));

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
      <Base.Root<ComboboxOption, false>
        items={items}
        value={selected}
        onValueChange={(item: ComboboxOption | null) => {
          chosen.current = item;
          setQuery(item?.label ?? "");
          if (props.value === undefined) setOwn(item?.value ?? null);
          props.onValueChange?.(item?.value ?? null);
        }}
        inputValue={query}
        onInputValueChange={(next: string) => setQuery(next)}
        onOpenChange={(next: boolean) => {
          open.current = next;
          if (!next) setQuery(chosen.current?.label ?? "");
        }}
        isItemEqualToValue={(a: ComboboxOption, b: ComboboxOption) => a.value === b.value}
        itemToStringLabel={(item: ComboboxOption) => item.label}
        itemToStringValue={(item: ComboboxOption) => item.value}
        disabled={disabled}
        required={required}
        name={name}
        defaultOpen={defaultOpen}
      >
        <Base.InputGroup className="cap-combobox-group">
          <Base.Input id={inputId} className="cap-combobox-input" aria-labelledby={labelId} placeholder={placeholder} aria-invalid={error != null ? true : undefined} aria-describedby={describedBy} autoComplete="off" />
          <Base.Trigger className="cap-combobox-trigger" aria-label={`Show ${label} options`}>
            <Chevron />
          </Base.Trigger>
        </Base.InputGroup>
        {error != null && (
          <p className="cap-combobox-error" id={errorId}>
            <ErrorGlyph />
            {error}
          </p>
        )}
        <Base.Portal container={container ?? undefined}>
          <Base.Positioner className="cap-combobox-positioner" sideOffset={4} align="start">
            <Base.Popup className="cap-combobox-popup">
              <Base.Status className="cap-combobox-status">
                {loading ? (
                  <>
                    <span className="cap-combobox-spinner" aria-hidden="true" />
                    {loadingText}
                  </>
                ) : null}
              </Base.Status>
              <Base.Empty className="cap-combobox-empty">{loading ? null : empty}</Base.Empty>
              <Base.List className="cap-combobox-list">
                {(item: ComboboxOption) => (
                  <Base.Item key={item.value} value={item} disabled={item.disabled} className="cap-combobox-item">
                    <Base.ItemIndicator className="cap-combobox-check">
                      <Check />
                    </Base.ItemIndicator>
                    <span className="cap-combobox-item-label">{item.label}</span>
                  </Base.Item>
                )}
              </Base.List>
            </Base.Popup>
          </Base.Positioner>
        </Base.Portal>
      </Base.Root>
    </div>
  );
}
