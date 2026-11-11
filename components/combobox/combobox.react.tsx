import { Autocomplete as Free } from "@base-ui/react/autocomplete";
import { Combobox as Base } from "@base-ui/react/combobox";
import {
  Fragment,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
  useLayoutEffect,
} from "react";

export interface ComboboxOption {
  value: string;
  label: string;
  disabled?: boolean;
  // A heading to list this option under. Options without one come first, ungrouped.
  group?: string;
  // A short note beside the label, in muted text: the city beside an institution.
  hint?: string;
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
  // Where the popup is portaled. Inside a modal <dialog> pass the dialog, or the popup
  // renders under the top layer, out of sight.
  container?: HTMLElement | null;
  // For specimens and tests: open on mount, with this text typed.
  defaultOpen?: boolean;
  defaultInputValue?: string;
  // Options from a server as the person types, in place of filtering `items` here: `search`
  // gets the typed text and an AbortSignal (a newer keystroke aborts the older request) and
  // returns the matches. `items` then holds only options known before any search (the chosen
  // one, so its label shows). Waits `searchDelay` ms (200) after the last key, and asks
  // nothing for fewer than `minSearchLength` characters (1).
  search?: (query: string, signal: AbortSignal) => Promise<ComboboxOption[]>;
  searchDelay?: number;
  minSearchLength?: number;
  // What the list says before a search can run, and when one fails.
  searchHint?: string;
  searchFailedText?: string;
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

export interface ComboboxFreeTextProps extends Omit<ComboboxBaseProps, "items" | "emptyText"> {
  // Suggestions to filter here. With `search` they are not needed.
  items?: ComboboxOption[];
  // The typed text is the value: any text can be kept, and a suggestion only fills it in.
  value?: string;
  defaultValue?: string;
  onValueChange?: (text: string) => void;
  // A suggestion was picked, for filling the fields that come with it (an institution’s city).
  // It runs after onValueChange, so what it sets stands.
  onPick?: (item: ComboboxOption) => void;
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

const Chevron = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
    <path
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      d="m3.5 6 4.5 4.5L12.5 6"
    />
  </svg>
);

const Cross = ({ size = 16 }: { size?: number }) => (
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

const defaultEmpty = (query: string): ReactNode =>
  query.trim()
    ? `No match for “${query.trim()}”. Check the spelling, or clear the box to see every option.`
    : "Nothing to choose from yet.";

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

function Hint({ item }: { item: ComboboxOption }) {
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
function Popup({
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
                <span className="cap-combobox-spinner" aria-hidden="true" />
                {loadingText}
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

function useOptionSearch(
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

// Known options and found ones, each value once, the known first.
function pool(known: ComboboxOption[], found: ComboboxOption[]): ComboboxOption[] {
  const seen = new Set(found.map((i) => i.value));
  return [...found, ...known.filter((i) => !seen.has(i.value))];
}

function searchEmpty(found: Found, query: string, hint: string, failed: string): ReactNode {
  if (found.failed) return failed;
  if (found.short) return hint;
  return defaultEmpty(query);
}

function Field({
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

// One combobox: a labeled text box that filters a list, where only a listed value can be
// chosen. Typed text that matches nothing is not kept: when the list closes, the box shows
// the chosen value's label again (or nothing).
export function Combobox(props: ComboboxProps) {
  const {
    label,
    items,
    placeholder,
    emptyText,
    loading = false,
    loadingText = "Loading",
    help,
    error,
    disabled = false,
    required = false,
    name,
    container,
    defaultOpen,
    defaultInputValue,
    clearable = false,
    search,
    searchDelay = 200,
    minSearchLength = 1,
    searchHint = "Type to search.",
    searchFailedText = "The search failed. Check the connection and type again.",
  } = props;
  const [found, runSearch] = useOptionSearch(search, searchDelay, minSearchLength);
  // With a search, the chosen option is kept here, so its label stays when the results move on.
  const [picked, setPicked] = useState<ComboboxOption | null>(null);
  const all = useMemo(
    () => (search ? pool(picked ? [...items, picked] : items, found.items) : items),
    [search, items, picked, found.items],
  );
  const autoId = useId();
  const inputId = props.id ?? `${autoId}-input`;
  const helpId = `${autoId}-help`;
  const labelId = `${autoId}-label`;
  const errorId = `${autoId}-error`;

  const [own, setOwn] = useState<string | null>(props.defaultValue ?? null);
  const current = props.value !== undefined ? props.value : own;
  const selected = all.find((i) => i.value === current) ?? null;

  // The input's text is held here so that unlisted text never outlives the open list.
  const [query, setQuery] = useState<string>(defaultInputValue ?? selected?.label ?? "");
  const chosen = useRef<ComboboxOption | null>(selected);
  useLayoutEffect(() => {
    chosen.current = selected;
  });
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

  // The list shows what the search found; the chosen option is only looked up in `all`.
  const shown = search ? found.items : items;
  const list = useMemo(() => grouped(shown), [shown]);
  const isGrouped = shown.some((i) => i.group);
  const describedBy =
    [help != null ? helpId : "", error != null ? errorId : ""].filter(Boolean).join(" ") ||
    undefined;
  const empty = search
    ? searchEmpty(found, query, searchHint, searchFailedText)
    : typeof emptyText === "function"
      ? emptyText(query)
      : (emptyText ?? defaultEmpty(query));

  return (
    <Field
      label={label}
      labelId={labelId}
      inputId={inputId}
      required={required}
      help={help}
      helpId={helpId}
      error={error}
      errorId={errorId}
    >
      <Base.Root<ComboboxOption, false>
        items={list}
        value={selected}
        onValueChange={(item: ComboboxOption | null) => {
          chosen.current = item;
          if (search) setPicked(item);
          setQuery(item?.label ?? "");
          if (props.value === undefined) setOwn(item?.value ?? null);
          props.onValueChange?.(item?.value ?? null);
        }}
        inputValue={query}
        onInputValueChange={(next: string, details: { reason: string }) => {
          setQuery(next);
          if (search && details.reason !== "item-press") runSearch(next);
        }}
        filter={search ? null : undefined}
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
          <Base.Input
            id={inputId}
            className="cap-combobox-input"
            aria-labelledby={labelId}
            placeholder={placeholder}
            aria-invalid={error != null ? true : undefined}
            aria-describedby={describedBy}
            autoComplete="off"
          />
          {clearable && (
            <Base.Clear className="cap-combobox-clear" aria-label={`Clear ${label}`}>
              <Cross />
            </Base.Clear>
          )}
          <Base.Trigger className="cap-combobox-trigger" aria-label={`Show ${label} options`}>
            <Chevron />
          </Base.Trigger>
        </Base.InputGroup>
        <Popup
          isGrouped={isGrouped}
          loading={loading || found.loading}
          loadingText={search && loadingText === "Loading" ? "Searching" : loadingText}
          empty={empty}
          container={container}
          multiple={false}
        />
      </Base.Root>
    </Field>
  );
}

// A text box with suggestions: the typed text is the value, so a name that is not listed yet
// is kept as typed. A picked suggestion fills the box with its label and calls onPick. The
// list opens only when there is something to show, and says nothing while the text is short.
export function ComboboxFreeText(props: ComboboxFreeTextProps) {
  const {
    label,
    items = [],
    placeholder,
    loading = false,
    loadingText = "Searching",
    help,
    error,
    disabled = false,
    required = false,
    name,
    container,
    defaultOpen,
    search,
    searchDelay = 200,
    minSearchLength = 1,
    searchFailedText = "The search failed. Check the connection and type again.",
    onPick,
  } = props;
  const [found, runSearch] = useOptionSearch(search, searchDelay, minSearchLength);
  const autoId = useId();
  const inputId = props.id ?? `${autoId}-input`;
  const helpId = `${autoId}-help`;
  const labelId = `${autoId}-label`;
  const errorId = `${autoId}-error`;
  const [own, setOwn] = useState<string>(props.defaultValue ?? props.defaultInputValue ?? "");
  const text = props.value !== undefined ? props.value : own;
  const all = search ? found.items : items;
  const lit = useRef<ComboboxOption | null>(null);
  const list = useMemo(() => grouped(all), [all]);
  const isGrouped = all.some((i) => i.group);
  const describedBy =
    [help != null ? helpId : "", error != null ? errorId : ""].filter(Boolean).join(" ") ||
    undefined;

  return (
    <Field
      label={label}
      labelId={labelId}
      inputId={inputId}
      required={required}
      help={help}
      helpId={helpId}
      error={error}
      errorId={errorId}
    >
      <Free.Root<ComboboxOption>
        // Grouped lists work here as in Combobox; the root's types name only the flat form.
        items={list as ComboboxOption[]}
        value={text}
        onValueChange={(next: string, details: { reason: string }) => {
          if (props.value === undefined) setOwn(next);
          props.onValueChange?.(next);
          if (details.reason === "item-press") {
            // The highlighted option is the one pressed, by pointer or by Enter.
            const item = lit.current ?? all.find((i) => i.label === next);
            if (item) onPick?.(item);
          } else if (search) runSearch(next);
        }}
        onItemHighlighted={(item: ComboboxOption | undefined) => {
          lit.current = item ?? null;
        }}
        filter={search ? null : undefined}
        itemToStringValue={(item: ComboboxOption) => item.label}
        disabled={disabled}
        required={required}
        name={name}
        defaultOpen={defaultOpen}
      >
        <Free.InputGroup className="cap-combobox-group">
          <Free.Input
            id={inputId}
            className="cap-combobox-input"
            aria-labelledby={labelId}
            placeholder={placeholder}
            aria-invalid={error != null ? true : undefined}
            aria-describedby={describedBy}
            autoComplete="off"
          />
        </Free.InputGroup>
        <Free.Portal container={container ?? undefined}>
          <Free.Positioner className="cap-combobox-positioner" sideOffset={4} align="start">
            <Free.Popup className="cap-popover cap-combobox-popup" data-flush="">
              <Free.Status className="cap-combobox-status">
                {loading || found.loading ? (
                  <>
                    <span className="cap-combobox-spinner" aria-hidden="true" />
                    {loadingText}
                  </>
                ) : found.failed ? (
                  searchFailedText
                ) : null}
              </Free.Status>
              <Free.List className="cap-listbox cap-combobox-list" data-controlled="">
                {isGrouped
                  ? (group: Group) => (
                      <Free.Group
                        key={group.value || "none"}
                        items={group.items}
                        className="cap-listbox-group"
                      >
                        {group.value ? (
                          <Free.GroupLabel className="cap-listbox-label">
                            {group.value}
                          </Free.GroupLabel>
                        ) : null}
                        <Free.Collection>
                          {(item: ComboboxOption) => <FreeOption key={item.value} item={item} />}
                        </Free.Collection>
                      </Free.Group>
                    )
                  : (item: ComboboxOption) => <FreeOption key={item.value} item={item} />}
              </Free.List>
            </Free.Popup>
          </Free.Positioner>
        </Free.Portal>
      </Free.Root>
    </Field>
  );
}

function FreeOption({ item }: { item: ComboboxOption }) {
  return (
    <Free.Item value={item} disabled={item.disabled} className="cap-option">
      <span className="cap-option-label">{item.label}</span>
      <Hint item={item} />
    </Free.Item>
  );
}

// Several values: each chosen option is a chip in the box with its own remove button, and
// the input follows the chips. The list stays open after a choice, so more can be added.
export function ComboboxMultiple(props: ComboboxMultipleProps) {
  const {
    label,
    items,
    placeholder,
    emptyText,
    loading = false,
    loadingText = "Loading",
    help,
    error,
    disabled = false,
    required = false,
    name,
    container,
    defaultOpen,
    defaultInputValue,
  } = props;
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
    if (creatable)
      for (const v of current)
        if (!out.some((i) => i.value === v)) out.push({ value: v, label: v });
    return out;
  }, [items, made, creatable, current]);
  const selected = useMemo(
    () =>
      current.map((v) => known.find((i) => i.value === v)).filter((i): i is ComboboxOption => !!i),
    [current, known],
  );
  const [query, setQuery] = useState(defaultInputValue ?? "");

  const typed = tidy(query);
  const makeable =
    creatable && typed !== "" && !known.some((i) => i.label.toLowerCase() === typed.toLowerCase());
  const options = useMemo(
    () => (makeable ? [{ value: `${MAKE}${typed}`, label: createLabel(typed) }, ...known] : known),
    [makeable, typed, known, createLabel],
  );
  const list = useMemo(() => grouped(options), [options]);
  const isGrouped = options.some((i) => i.group);
  const describedBy =
    [help != null ? helpId : "", error != null ? errorId : ""].filter(Boolean).join(" ") ||
    undefined;
  const empty =
    typeof emptyText === "function" ? emptyText(query) : (emptyText ?? defaultEmpty(query));

  return (
    <Field
      label={label}
      labelId={labelId}
      inputId={inputId}
      required={required}
      help={help}
      helpId={helpId}
      error={error}
      errorId={errorId}
    >
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
        itemToStringLabel={(item: ComboboxOption) =>
          item.value.startsWith(MAKE) ? typed : item.label
        }
        itemToStringValue={(item: ComboboxOption) => item.value}
        disabled={disabled}
        required={required}
        name={name}
        defaultOpen={defaultOpen}
      >
        <Base.Chips
          className="cap-combobox-chips"
          ref={anchor}
          data-disabled={disabled ? "" : undefined}
        >
          <Base.Value>
            {(value: ComboboxOption[]) => (
              <Fragment>
                {value.map((item) => (
                  <Base.Chip key={item.value} className="cap-combobox-chip">
                    {item.label}
                    <Base.ChipRemove
                      className="cap-combobox-chip-remove"
                      aria-label={`Remove ${item.label}`}
                    >
                      <Cross size={12} />
                    </Base.ChipRemove>
                  </Base.Chip>
                ))}
                <Base.Input
                  id={inputId}
                  className="cap-combobox-input"
                  aria-labelledby={labelId}
                  placeholder={value.length ? undefined : placeholder}
                  aria-invalid={error != null ? true : undefined}
                  aria-describedby={describedBy}
                  autoComplete="off"
                />
              </Fragment>
            )}
          </Base.Value>
        </Base.Chips>
        <Popup
          isGrouped={isGrouped}
          loading={loading}
          loadingText={loadingText}
          empty={empty}
          container={container}
          anchor={anchor}
          multiple
        />
      </Base.Root>
    </Field>
  );
}
