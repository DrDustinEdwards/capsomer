import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { Autocomplete as Free } from "@base-ui/react/autocomplete";
import { Combobox as Base } from "@base-ui/react/combobox";
import { Fragment, useCallback, useEffect, useId, useMemo, useRef, useState, useLayoutEffect, } from "react";
// A made value's id in the list, before it becomes a value: the prefix plus its text.
const MAKE = "\u0001make:";
const tidy = (text) => text.trim().replace(/\s+/g, " ");
const Check = () => (_jsx("svg", { width: "16", height: "16", viewBox: "0 0 16 16", "aria-hidden": "true", focusable: "false", children: _jsx("path", { fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", d: "m3.5 8.5 3 3 6-7" }) }));
const Chevron = () => (_jsx("svg", { width: "16", height: "16", viewBox: "0 0 16 16", "aria-hidden": "true", focusable: "false", children: _jsx("path", { fill: "none", stroke: "currentColor", strokeWidth: "1.8", strokeLinecap: "round", strokeLinejoin: "round", d: "m3.5 6 4.5 4.5L12.5 6" }) }));
const Cross = ({ size = 16 }) => (_jsx("svg", { width: size, height: size, viewBox: "0 0 16 16", "aria-hidden": "true", focusable: "false", children: _jsx("path", { fill: "none", stroke: "currentColor", strokeWidth: "1.8", strokeLinecap: "round", d: "M4 4l8 8M12 4l-8 8" }) }));
const ErrorGlyph = () => (_jsxs("svg", { width: "14", height: "14", viewBox: "0 0 16 16", "aria-hidden": "true", focusable: "false", children: [_jsx("path", { fill: "currentColor", d: "M5 1h6l4 4v6l-4 4H5l-4-4V5z" }), _jsx("path", { fill: "var(--surface)", d: "M7.2 4h1.6v5H7.2zM7.2 10.4h1.6V12H7.2z" })] }));
const defaultEmpty = (query) => query.trim()
    ? `No match for “${query.trim()}”. Check the spelling, or clear the box to see every option.`
    : "Nothing to choose from yet.";
// Options with a `group` are listed under that heading, in the order each heading first
// appears; the rest come first, with no heading. With no group anywhere the list is flat.
function grouped(items) {
    if (!items.some((i) => i.group))
        return items;
    const out = [];
    const plain = items.filter((i) => !i.group);
    if (plain.length)
        out.push({ value: "", items: plain });
    for (const item of items) {
        if (!item.group)
            continue;
        let g = out.find((x) => x.value === item.group);
        if (!g) {
            g = { value: item.group, items: [] };
            out.push(g);
        }
        g.items.push(item);
    }
    return out;
}
function Hint({ item }) {
    return item.hint ? (_jsx("span", { className: "cap-option-keys", children: _jsx("span", { className: "cap-option-hint", children: item.hint }) })) : null;
}
function Option({ item }) {
    return (_jsxs(Base.Item, { value: item, disabled: item.disabled, className: "cap-option", children: [_jsx("span", { className: "cap-option-label", children: item.label }), _jsx(Hint, { item: item }), _jsx(Base.ItemIndicator, { className: "cap-option-indicator", children: _jsx(Check, {}) })] }, item.value));
}
// The popup: the shared popover surface around the shared listbox, with the loading and
// empty messages in Base UI's own regions so a change is announced.
function Popup({ isGrouped, loading, loadingText, empty, container, anchor, multiple, }) {
    return (_jsx(Base.Portal, { container: container ?? undefined, children: _jsx(Base.Positioner, { className: "cap-combobox-positioner", sideOffset: 4, align: "start", anchor: anchor, children: _jsxs(Base.Popup, { className: "cap-popover cap-combobox-popup", "data-flush": "", children: [_jsx(Base.Status, { className: "cap-combobox-status", children: loading ? (_jsxs(_Fragment, { children: [_jsx("span", { className: "cap-combobox-spinner", "aria-hidden": "true" }), loadingText] })) : null }), _jsx(Base.Empty, { className: "cap-listbox-empty cap-combobox-empty", children: loading ? null : empty }), _jsx(Base.List, { className: "cap-listbox cap-combobox-list", "data-controlled": "", "data-selection": multiple ? "multi" : "single", children: isGrouped
                            ? (group) => (_jsxs(Base.Group, { items: group.items, className: "cap-listbox-group", children: [group.value ? (_jsx(Base.GroupLabel, { className: "cap-listbox-label", children: group.value })) : null, _jsx(Base.Collection, { children: (item) => _jsx(Option, { item: item }, item.value) })] }, group.value || "none"))
                            : (item) => _jsx(Option, { item: item }, item.value) })] }) }) }));
}
const NOTHING = { items: [], loading: false, failed: false, short: true };
function useOptionSearch(search, delay, min) {
    const [found, setFound] = useState(NOTHING);
    const timer = useRef(undefined);
    const request = useRef(null);
    useEffect(() => () => {
        clearTimeout(timer.current);
        request.current?.abort();
    }, []);
    const run = useCallback((query) => {
        if (!search)
            return;
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
            search(q, controller.signal).then((items) => {
                if (!controller.signal.aborted)
                    setFound({ items, loading: false, failed: false, short: false });
            }, () => {
                if (!controller.signal.aborted)
                    setFound({ items: [], loading: false, failed: true, short: false });
            });
        }, delay);
    }, [search, delay, min]);
    return [found, run];
}
// Known options and found ones, each value once, the known first.
function pool(known, found) {
    const seen = new Set(found.map((i) => i.value));
    return [...found, ...known.filter((i) => !seen.has(i.value))];
}
function searchEmpty(found, query, hint, failed) {
    if (found.failed)
        return failed;
    if (found.short)
        return hint;
    return defaultEmpty(query);
}
function Field({ label, labelId, inputId, required, help, helpId, error, errorId, children, }) {
    return (_jsxs("div", { className: "cap-combobox", "data-cap": "combobox", children: [_jsxs("label", { className: "cap-combobox-label", id: labelId, htmlFor: inputId, children: [label, required && " (required)"] }), help != null && (_jsx("p", { className: "cap-combobox-help", id: helpId, children: help })), children, error != null && (_jsxs("p", { className: "cap-combobox-error", id: errorId, children: [_jsx(ErrorGlyph, {}), error] }))] }));
}
// One combobox: a labeled text box that filters a list, where only a listed value can be
// chosen. Typed text that matches nothing is not kept: when the list closes, the box shows
// the chosen value's label again (or nothing).
export function Combobox(props) {
    const { label, items, placeholder, emptyText, loading = false, loadingText = "Loading", help, error, disabled = false, required = false, name, container, defaultOpen, defaultInputValue, clearable = false, search, searchDelay = 200, minSearchLength = 1, searchHint = "Type to search.", searchFailedText = "The search failed. Check the connection and type again.", } = props;
    const [found, runSearch] = useOptionSearch(search, searchDelay, minSearchLength);
    // With a search, the chosen option is kept here, so its label stays when the results move on.
    const [picked, setPicked] = useState(null);
    const all = useMemo(() => (search ? pool(picked ? [...items, picked] : items, found.items) : items), [search, items, picked, found.items]);
    const autoId = useId();
    const inputId = props.id ?? `${autoId}-input`;
    const helpId = `${autoId}-help`;
    const labelId = `${autoId}-label`;
    const errorId = `${autoId}-error`;
    const [own, setOwn] = useState(props.defaultValue ?? null);
    const current = props.value !== undefined ? props.value : own;
    const selected = all.find((i) => i.value === current) ?? null;
    // The input's text is held here so that unlisted text never outlives the open list.
    const [query, setQuery] = useState(defaultInputValue ?? selected?.label ?? "");
    const chosen = useRef(selected);
    useLayoutEffect(() => {
        chosen.current = selected;
    });
    const open = useRef(defaultOpen ?? false);
    // Items that arrive after the value (loading, then loaded) bring the chosen label with
    // them. Skipped on mount, so defaultInputValue stands.
    const mounted = useRef(false);
    useEffect(() => {
        if (!mounted.current) {
            mounted.current = true;
            return;
        }
        if (!open.current)
            setQuery(selected?.label ?? "");
    }, [selected?.label]);
    // The list shows what the search found; the chosen option is only looked up in `all`.
    const shown = search ? found.items : items;
    const list = useMemo(() => grouped(shown), [shown]);
    const isGrouped = shown.some((i) => i.group);
    const describedBy = [help != null ? helpId : "", error != null ? errorId : ""].filter(Boolean).join(" ") ||
        undefined;
    const empty = search
        ? searchEmpty(found, query, searchHint, searchFailedText)
        : typeof emptyText === "function"
            ? emptyText(query)
            : (emptyText ?? defaultEmpty(query));
    return (_jsx(Field, { label: label, labelId: labelId, inputId: inputId, required: required, help: help, helpId: helpId, error: error, errorId: errorId, children: _jsxs(Base.Root, { items: list, value: selected, onValueChange: (item) => {
                chosen.current = item;
                if (search)
                    setPicked(item);
                setQuery(item?.label ?? "");
                if (props.value === undefined)
                    setOwn(item?.value ?? null);
                props.onValueChange?.(item?.value ?? null);
            }, inputValue: query, onInputValueChange: (next, details) => {
                setQuery(next);
                if (search && details.reason !== "item-press")
                    runSearch(next);
            }, filter: search ? null : undefined, onOpenChange: (next) => {
                open.current = next;
                if (!next)
                    setQuery(chosen.current?.label ?? "");
            }, isItemEqualToValue: (a, b) => a.value === b.value, itemToStringLabel: (item) => item.label, itemToStringValue: (item) => item.value, disabled: disabled, required: required, name: name, defaultOpen: defaultOpen, children: [_jsxs(Base.InputGroup, { className: "cap-combobox-group", children: [_jsx(Base.Input, { id: inputId, className: "cap-combobox-input", "aria-labelledby": labelId, placeholder: placeholder, "aria-invalid": error != null ? true : undefined, "aria-describedby": describedBy, autoComplete: "off" }), clearable && (_jsx(Base.Clear, { className: "cap-combobox-clear", "aria-label": `Clear ${label}`, children: _jsx(Cross, {}) })), _jsx(Base.Trigger, { className: "cap-combobox-trigger", "aria-label": `Show ${label} options`, children: _jsx(Chevron, {}) })] }), _jsx(Popup, { isGrouped: isGrouped, loading: loading || found.loading, loadingText: search && loadingText === "Loading" ? "Searching" : loadingText, empty: empty, container: container, multiple: false })] }) }));
}
// A text box with suggestions: the typed text is the value, so a name that is not listed yet
// is kept as typed. A picked suggestion fills the box with its label and calls onPick. The
// list opens only when there is something to show, and says nothing while the text is short.
export function ComboboxFreeText(props) {
    const { label, items = [], placeholder, loading = false, loadingText = "Searching", help, error, disabled = false, required = false, name, container, defaultOpen, search, searchDelay = 200, minSearchLength = 1, searchFailedText = "The search failed. Check the connection and type again.", onPick, } = props;
    const [found, runSearch] = useOptionSearch(search, searchDelay, minSearchLength);
    const autoId = useId();
    const inputId = props.id ?? `${autoId}-input`;
    const helpId = `${autoId}-help`;
    const labelId = `${autoId}-label`;
    const errorId = `${autoId}-error`;
    const [own, setOwn] = useState(props.defaultValue ?? props.defaultInputValue ?? "");
    const text = props.value !== undefined ? props.value : own;
    const all = search ? found.items : items;
    const lit = useRef(null);
    const list = useMemo(() => grouped(all), [all]);
    const isGrouped = all.some((i) => i.group);
    const describedBy = [help != null ? helpId : "", error != null ? errorId : ""].filter(Boolean).join(" ") ||
        undefined;
    return (_jsx(Field, { label: label, labelId: labelId, inputId: inputId, required: required, help: help, helpId: helpId, error: error, errorId: errorId, children: _jsxs(Free.Root, { 
            // Grouped lists work here as in Combobox; the root's types name only the flat form.
            items: list, value: text, onValueChange: (next, details) => {
                if (props.value === undefined)
                    setOwn(next);
                props.onValueChange?.(next);
                if (details.reason === "item-press") {
                    // The highlighted option is the one pressed, by pointer or by Enter.
                    const item = lit.current ?? all.find((i) => i.label === next);
                    if (item)
                        onPick?.(item);
                }
                else if (search)
                    runSearch(next);
            }, onItemHighlighted: (item) => {
                lit.current = item ?? null;
            }, filter: search ? null : undefined, itemToStringValue: (item) => item.label, disabled: disabled, required: required, name: name, defaultOpen: defaultOpen, children: [_jsx(Free.InputGroup, { className: "cap-combobox-group", children: _jsx(Free.Input, { id: inputId, className: "cap-combobox-input", "aria-labelledby": labelId, placeholder: placeholder, "aria-invalid": error != null ? true : undefined, "aria-describedby": describedBy, autoComplete: "off" }) }), _jsx(Free.Portal, { container: container ?? undefined, children: _jsx(Free.Positioner, { className: "cap-combobox-positioner", sideOffset: 4, align: "start", children: _jsxs(Free.Popup, { className: "cap-popover cap-combobox-popup", "data-flush": "", children: [_jsx(Free.Status, { className: "cap-combobox-status", children: loading || found.loading ? (_jsxs(_Fragment, { children: [_jsx("span", { className: "cap-combobox-spinner", "aria-hidden": "true" }), loadingText] })) : found.failed ? (searchFailedText) : null }), _jsx(Free.List, { className: "cap-listbox cap-combobox-list", "data-controlled": "", children: isGrouped
                                        ? (group) => (_jsxs(Free.Group, { items: group.items, className: "cap-listbox-group", children: [group.value ? (_jsx(Free.GroupLabel, { className: "cap-listbox-label", children: group.value })) : null, _jsx(Free.Collection, { children: (item) => _jsx(FreeOption, { item: item }, item.value) })] }, group.value || "none"))
                                        : (item) => _jsx(FreeOption, { item: item }, item.value) })] }) }) })] }) }));
}
function FreeOption({ item }) {
    return (_jsxs(Free.Item, { value: item, disabled: item.disabled, className: "cap-option", children: [_jsx("span", { className: "cap-option-label", children: item.label }), _jsx(Hint, { item: item })] }));
}
// Several values: each chosen option is a chip in the box with its own remove button, and
// the input follows the chips. The list stays open after a choice, so more can be added.
export function ComboboxMultiple(props) {
    const { label, items, placeholder, emptyText, loading = false, loadingText = "Loading", help, error, disabled = false, required = false, name, container, defaultOpen, defaultInputValue, } = props;
    const autoId = useId();
    const inputId = props.id ?? `${autoId}-input`;
    const helpId = `${autoId}-help`;
    const labelId = `${autoId}-label`;
    const errorId = `${autoId}-error`;
    const anchor = useRef(null);
    const { creatable = false, createLabel = (text) => `Create “${text}”` } = props;
    const [own, setOwn] = useState(props.defaultValues ?? []);
    const current = props.values !== undefined ? props.values : own;
    // Tags made by typing: they are not in `items`, so they are kept here (or come back in
    // `values`, which are shown as chips whether or not they are listed).
    const [made, setMade] = useState([]);
    const known = useMemo(() => {
        const out = [...items];
        for (const m of made)
            if (!out.some((i) => i.value === m.value))
                out.push(m);
        if (creatable)
            for (const v of current)
                if (!out.some((i) => i.value === v))
                    out.push({ value: v, label: v });
        return out;
    }, [items, made, creatable, current]);
    const selected = useMemo(() => current.map((v) => known.find((i) => i.value === v)).filter((i) => !!i), [current, known]);
    const [query, setQuery] = useState(defaultInputValue ?? "");
    const typed = tidy(query);
    const makeable = creatable && typed !== "" && !known.some((i) => i.label.toLowerCase() === typed.toLowerCase());
    const options = useMemo(() => (makeable ? [{ value: `${MAKE}${typed}`, label: createLabel(typed) }, ...known] : known), [makeable, typed, known, createLabel]);
    const list = useMemo(() => grouped(options), [options]);
    const isGrouped = options.some((i) => i.group);
    const describedBy = [help != null ? helpId : "", error != null ? errorId : ""].filter(Boolean).join(" ") ||
        undefined;
    const empty = typeof emptyText === "function" ? emptyText(query) : (emptyText ?? defaultEmpty(query));
    return (_jsx(Field, { label: label, labelId: labelId, inputId: inputId, required: required, help: help, helpId: helpId, error: error, errorId: errorId, children: _jsxs(Base.Root, { multiple: true, items: list, value: selected, onValueChange: (next) => {
                const values = [];
                const fresh = [];
                for (const i of next) {
                    if (!i.value.startsWith(MAKE)) {
                        values.push(i.value);
                        continue;
                    }
                    const text = i.value.slice(MAKE.length);
                    if (!values.includes(text))
                        values.push(text);
                    fresh.push({ value: text, label: text });
                }
                if (fresh.length) {
                    setMade((m) => [...m, ...fresh.filter((f) => !m.some((x) => x.value === f.value))]);
                    setQuery("");
                }
                if (props.values === undefined)
                    setOwn(values);
                props.onValuesChange?.(values);
            }, inputValue: query, onInputValueChange: (next) => setQuery(next), autoHighlight: creatable, isItemEqualToValue: (a, b) => a.value === b.value, itemToStringLabel: (item) => item.value.startsWith(MAKE) ? typed : item.label, itemToStringValue: (item) => item.value, disabled: disabled, required: required, name: name, defaultOpen: defaultOpen, children: [_jsx(Base.Chips, { className: "cap-combobox-chips", ref: anchor, "data-disabled": disabled ? "" : undefined, children: _jsx(Base.Value, { children: (value) => (_jsxs(Fragment, { children: [value.map((item) => (_jsxs(Base.Chip, { className: "cap-combobox-chip", children: [item.label, _jsx(Base.ChipRemove, { className: "cap-combobox-chip-remove", "aria-label": `Remove ${item.label}`, children: _jsx(Cross, { size: 12 }) })] }, item.value))), _jsx(Base.Input, { id: inputId, className: "cap-combobox-input", "aria-labelledby": labelId, placeholder: value.length ? undefined : placeholder, "aria-invalid": error != null ? true : undefined, "aria-describedby": describedBy, autoComplete: "off" })] })) }) }), _jsx(Popup, { isGrouped: isGrouped, loading: loading, loadingText: loadingText, empty: empty, container: container, anchor: anchor, multiple: true })] }) }));
}
