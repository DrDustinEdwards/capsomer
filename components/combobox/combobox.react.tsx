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
import { Icon, iconChevronDown } from "../icons/icons.react.tsx";
import { Spinner } from "../skeleton/skeleton.react.tsx";

export interface ComboboxOption {
  value: string;
  label: string;
  disabled?: boolean;
  group?: string;
  hint?: string;
}

interface Group {
  value: string;
  items: ComboboxOption[];
}

export interface ComboboxBaseProps {
  label: string;
  items: ComboboxOption[];
  placeholder?: string;
  // What an empty result says. A function gets the typed text, to name the filter.
  emptyText?: ReactNode | ((query: string) => ReactNode);
  loading?: boolean;
  loadingText?: string;
  help?: ReactNode;
  error?: ReactNode;
  disabled?: boolean;
  required?: boolean;
  name?: string;
  id?: string;
  // Where the popup is portaled. Inside a modal <dialog> pass the dialog, or the popup renders under the top layer.
  container?: HTMLElement | null;
  defaultOpen?: boolean;
  defaultInputValue?: string;
  // Options from a server as the person types, in place of filtering `items`: `search` gets the typed text
  // and an AbortSignal and returns the matches; `items` holds only options known before a search (the chosen one).
  search?: (query: string, signal: AbortSignal) => Promise<ComboboxOption[]>;
  searchDelay?: number;
  minSearchLength?: number;
  searchHint?: string;
  searchFailedText?: string;
}

export interface ComboboxProps extends ComboboxBaseProps {
  // The chosen value, controlled; undefined lets the combobox hold it. null is nothing chosen.
  value?: string | null;
  defaultValue?: string | null;
  onValueChange?: (value: string | null) => void;
  clearable?: boolean;
}

export interface ComboboxFreeTextProps extends Omit<
  ComboboxBaseProps,
  "items" | "emptyText" | "searchHint"
> {
  items?: ComboboxOption[];
  // The typed text is the value; a suggestion only fills it in.
  value?: string;
  defaultValue?: string;
  onValueChange?: (text: string) => void;
  // A suggestion was picked; runs after onValueChange, so what it sets stands.
  onPick?: (item: ComboboxOption) => void;
}

export interface ComboboxMultipleProps extends ComboboxBaseProps {
  values?: string[];
  defaultValues?: string[];
  onValuesChange?: (values: string[]) => void;
  // A tag field: typed text not in `items` is offered as a `Create “text”` row (Enter takes it; text matching
  // an item, ignoring case, picks that item, so a tag is never made twice).
  creatable?: boolean;
  createLabel?: (text: string) => string;
}

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

// Options with a `group` are listed under their heading in order of first appearance; the rest come first.
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

// The popup: loading and empty messages sit in Base UI's own regions so a change is announced.
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

// The options a search found. The request runs from the input's change, not an effect, so a newer
// keystroke aborts the older request and results never arrive out of order. A failure is not "no match".
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

// One combobox: only a listed value can be chosen; unmatched typed text is not kept (the box shows the
// chosen label again when the list closes).
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
            <Icon d={iconChevronDown} />
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

// A text box with suggestions: the typed text is the value, so a name not listed is kept as typed.
// The list opens only when there is something to show.
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
        items={list as ComboboxOption[]}
        value={text}
        onValueChange={(next: string, details: { reason: string }) => {
          if (props.value === undefined) setOwn(next);
          props.onValueChange?.(next);
          if (details.reason === "item-press") {
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
                    <Spinner label={loadingText} />
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

// Several values as chips with remove buttons; the list stays open after a choice.
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
  // Tags made by typing are not in `items`, so they are kept here.
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
