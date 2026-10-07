import { Combobox as Base } from "@base-ui/react/combobox";
import { Fragment, useEffect, useId, useMemo, useRef, useState, type ReactNode, type RefObject } from "react";

export interface ComboboxOption {
  value: string;
  label: string;
  disabled?: boolean;
  // A heading to list this option under. Options without one come first, ungrouped.
  group?: string;
}

interface Group {
  value: string;
  items: ComboboxOption[];
}

export interface ComboboxBaseProps {
  // The visible label above the box. Required: a combobox always has one.
  label: string;
  items: ComboboxOption[];
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

export interface ComboboxProps extends ComboboxBaseProps {
  // The chosen value, controlled. Leave undefined to let the combobox hold it
  // (defaultValue). null is "nothing chosen".
  value?: string | null;
  defaultValue?: string | null;
  onValueChange?: (value: string | null) => void;
  // A button in the box that clears the chosen value. It shows only while there is one.
  clearable?: boolean;
}

export interface ComboboxMultipleProps extends ComboboxBaseProps {
  // The chosen values, controlled. Leave undefined to let the combobox hold them.
  values?: string[];
  defaultValues?: string[];
  onValuesChange?: (values: string[]) => void;
  // A tag field: typed text that is not in `items` can be added as a value of its own. A first
  // row, `Create “text”`, offers it; Enter takes it (text that matches an item, ignoring case, picks
  // that item instead, so a tag is never made twice). The value of a made one is its text.
  creatable?: boolean;
  // The words of the create row, from the typed text.
  createLabel?: (text: string) => string;
}

// A made value's id in the list, before it becomes a value: the prefix plus its text.
const MAKE = "\u0001make:";
const tidy = (text: string) => text.trim().replace(/\s+/g, " ");

const Check = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
    <path fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="m3.5 8.5 3 3 6-7" />
  </svg>
);

const Chevron = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
    <path fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" d="m3.5 6 4.5 4.5L12.5 6" />
  </svg>
);

const Cross = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" aria-hidden="true" focusable="false">
    <path fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" d="M4 4l8 8M12 4l-8 8" />
  </svg>
);

const ErrorGlyph = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
    <path fill="currentColor" d="M5 1h6l4 4v6l-4 4H5l-4-4V5z" />
    <path fill="var(--surface)" d="M7.2 4h1.6v5H7.2zM7.2 10.4h1.6V12H7.2z" />
  </svg>
);

const defaultEmpty = (query: string): ReactNode => (query.trim() ? `No match for “${query.trim()}”. Check the spelling, or clear the box to see every option.` : "Nothing to choose from yet.");

// Options with a `group` are listed under that heading, in the order each heading first
// appears; the rest come first, with no heading. With no group anywhere the list is flat.
function grouped(items: ComboboxOption[]): ComboboxOption[] | Group[] {
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

function Option({ item }: { item: ComboboxOption }) {
  return (
    <Base.Item key={item.value} value={item} disabled={item.disabled} className="cap-option">
      <span className="cap-option-label">{item.label}</span>
      <Base.ItemIndicator className="cap-option-indicator">
        <Check />
      </Base.ItemIndicator>
    </Base.Item>
  );
}

// The popup: the shared popover surface around the shared listbox, with the loading and
// empty messages in Base UI's own regions so a change is announced.
function Popup({ isGrouped, loading, loadingText, empty, container, anchor, multiple }: { isGrouped: boolean; loading: boolean; loadingText: string; empty: ReactNode; container?: HTMLElement | null; anchor?: RefObject<HTMLElement | null>; multiple: boolean }) {
  return (
    <Base.Portal container={container ?? undefined}>
      <Base.Positioner className="cap-combobox-positioner" sideOffset={4} align="start" anchor={anchor}>
        <Base.Popup className="cap-popover cap-combobox-popup" data-flush="">
          <Base.Status className="cap-combobox-status">
            {loading ? (
              <>
                <span className="cap-combobox-spinner" aria-hidden="true" />
                {loadingText}
              </>
            ) : null}
          </Base.Status>
          <Base.Empty className="cap-listbox-empty cap-combobox-empty">{loading ? null : empty}</Base.Empty>
          <Base.List className="cap-listbox cap-combobox-list" data-controlled="" data-selection={multiple ? "multi" : "single"}>
            {isGrouped
              ? (group: Group) => (
                  <Base.Group key={group.value || "none"} items={group.items} className="cap-listbox-group">
                    {group.value ? <Base.GroupLabel className="cap-listbox-label">{group.value}</Base.GroupLabel> : null}
                    <Base.Collection>{(item: ComboboxOption) => <Option key={item.value} item={item} />}</Base.Collection>
                  </Base.Group>
                )
              : (item: ComboboxOption) => <Option key={item.value} item={item} />}
          </Base.List>
        </Base.Popup>
      </Base.Positioner>
    </Base.Portal>
  );
}

function Field({ label, labelId, inputId, required, help, helpId, error, errorId, children }: { label: string; labelId: string; inputId: string; required: boolean; help?: ReactNode; helpId: string; error?: ReactNode; errorId: string; children: ReactNode }) {
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

// One combobox: a labelled text box that filters a list, where only a listed value can be
// chosen. Typed text that matches nothing is not kept: when the list closes, the box shows
// the chosen value's label again (or nothing).
export function Combobox(props: ComboboxProps) {
  const { label, items, placeholder, emptyText, loading = false, loadingText = "Loading", help, error, disabled = false, required = false, name, container, defaultOpen, defaultInputValue, clearable = false } = props;
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

  const list = useMemo(() => grouped(items), [items]);
  const isGrouped = items.some((i) => i.group);
  const describedBy = [help != null ? helpId : "", error != null ? errorId : ""].filter(Boolean).join(" ") || undefined;
  const empty = typeof emptyText === "function" ? emptyText(query) : (emptyText ?? defaultEmpty(query));

  return (
    <Field label={label} labelId={labelId} inputId={inputId} required={required} help={help} helpId={helpId} error={error} errorId={errorId}>
      <Base.Root<ComboboxOption, false>
        items={list}
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
          {clearable && (
            <Base.Clear className="cap-combobox-clear" aria-label={`Clear ${label}`}>
              <Cross />
            </Base.Clear>
          )}
          <Base.Trigger className="cap-combobox-trigger" aria-label={`Show ${label} options`}>
            <Chevron />
          </Base.Trigger>
        </Base.InputGroup>
        <Popup isGrouped={isGrouped} loading={loading} loadingText={loadingText} empty={empty} container={container} multiple={false} />
      </Base.Root>
    </Field>
  );
}

// Several values: each chosen option is a chip in the box with its own remove button, and
// the input follows the chips. The list stays open after a choice, so more can be added.
export function ComboboxMultiple(props: ComboboxMultipleProps) {
  const { label, items, placeholder, emptyText, loading = false, loadingText = "Loading", help, error, disabled = false, required = false, name, container, defaultOpen, defaultInputValue } = props;
  const autoId = useId();
  const inputId = props.id ?? `${autoId}-input`;
  const helpId = `${autoId}-help`;
  const labelId = `${autoId}-label`;
  const errorId = `${autoId}-error`;
  const anchor = useRef<HTMLDivElement | null>(null);

  const { creatable = false, createLabel = (text: string) => `Create “${text}”` } = props;
  const [own, setOwn] = useState<string[]>(props.defaultValues ?? []);
  const current = props.values !== undefined ? props.values : own;
  // Tags made by typing: they are not in `items`, so they are kept here (or come back in
  // `values`, which are shown as chips whether or not they are listed).
  const [made, setMade] = useState<ComboboxOption[]>([]);
  const known = useMemo(() => {
    const out = [...items];
    for (const m of made) if (!out.some((i) => i.value === m.value)) out.push(m);
    if (creatable) for (const v of current) if (!out.some((i) => i.value === v)) out.push({ value: v, label: v });
    return out;
  }, [items, made, creatable, current]);
  const selected = useMemo(() => current.map((v) => known.find((i) => i.value === v)).filter((i): i is ComboboxOption => !!i), [current, known]);
  const [query, setQuery] = useState(defaultInputValue ?? "");

  const typed = tidy(query);
  const makeable = creatable && typed !== "" && !known.some((i) => i.label.toLowerCase() === typed.toLowerCase());
  const options = useMemo(() => (makeable ? [{ value: `${MAKE}${typed}`, label: createLabel(typed) }, ...known] : known), [makeable, typed, known, createLabel]);
  const list = useMemo(() => grouped(options), [options]);
  const isGrouped = options.some((i) => i.group);
  const describedBy = [help != null ? helpId : "", error != null ? errorId : ""].filter(Boolean).join(" ") || undefined;
  const empty = typeof emptyText === "function" ? emptyText(query) : (emptyText ?? defaultEmpty(query));

  return (
    <Field label={label} labelId={labelId} inputId={inputId} required={required} help={help} helpId={helpId} error={error} errorId={errorId}>
      <Base.Root<ComboboxOption, true>
        multiple
        items={list}
        value={selected}
        onValueChange={(next: ComboboxOption[]) => {
          const values: string[] = [];
          const fresh: ComboboxOption[] = [];
          for (const i of next) {
            if (!i.value.startsWith(MAKE)) {
              values.push(i.value);
              continue;
            }
            const text = i.value.slice(MAKE.length);
            if (!values.includes(text)) values.push(text);
            fresh.push({ value: text, label: text });
          }
          if (fresh.length) {
            setMade((m) => [...m, ...fresh.filter((f) => !m.some((x) => x.value === f.value))]);
            setQuery("");
          }
          if (props.values === undefined) setOwn(values);
          props.onValuesChange?.(values);
        }}
        inputValue={query}
        onInputValueChange={(next: string) => setQuery(next)}
        autoHighlight={creatable}
        isItemEqualToValue={(a: ComboboxOption, b: ComboboxOption) => a.value === b.value}
        itemToStringLabel={(item: ComboboxOption) => (item.value.startsWith(MAKE) ? typed : item.label)}
        itemToStringValue={(item: ComboboxOption) => item.value}
        disabled={disabled}
        required={required}
        name={name}
        defaultOpen={defaultOpen}
      >
        <Base.Chips className="cap-combobox-chips" ref={anchor} data-disabled={disabled ? "" : undefined}>
          <Base.Value>
            {(value: ComboboxOption[]) => (
              <Fragment>
                {value.map((item) => (
                  <Base.Chip key={item.value} className="cap-combobox-chip">
                    {item.label}
                    <Base.ChipRemove className="cap-combobox-chip-remove" aria-label={`Remove ${item.label}`}>
                      <Cross size={12} />
                    </Base.ChipRemove>
                  </Base.Chip>
                ))}
                <Base.Input id={inputId} className="cap-combobox-input" aria-labelledby={labelId} placeholder={value.length ? undefined : placeholder} aria-invalid={error != null ? true : undefined} aria-describedby={describedBy} autoComplete="off" />
              </Fragment>
            )}
          </Base.Value>
        </Base.Chips>
        <Popup isGrouped={isGrouped} loading={loading} loadingText={loadingText} empty={empty} container={container} anchor={anchor} multiple />
      </Base.Root>
    </Field>
  );
}
