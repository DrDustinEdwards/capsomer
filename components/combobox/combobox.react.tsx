import { Combobox as Base } from "@base-ui/react/combobox";
import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  useLayoutEffect,
} from "react";
import { Icon, iconChevronDown } from "../icons/icons.react.tsx";

import {
  Cross,
  defaultEmpty,
  grouped,
  Popup,
  useOptionSearch,
  pool,
  searchEmpty,
  Field,
} from "./combobox-parts.react.tsx";

export interface ComboboxOption {
  value: string;
  label: string;
  disabled?: boolean;
  // A heading to list this option under. Options without one come first, ungrouped.
  group?: string;
  // A short note beside the label, in muted text: the city beside an institution.
  hint?: string;
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

// No searchHint: a free text box says nothing while the text is short.
export interface ComboboxFreeTextProps extends Omit<
  ComboboxBaseProps,
  "items" | "emptyText" | "searchHint"
> {
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

export { ComboboxFreeText, ComboboxMultiple } from "./combobox-multi.react.tsx";
