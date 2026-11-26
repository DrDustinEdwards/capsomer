import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { Autocomplete as Free } from "@base-ui/react/autocomplete";
import { Combobox as Base } from "@base-ui/react/combobox";
import { Fragment, useId, useMemo, useRef, useState } from "react";
import { Spinner } from "../skeleton/skeleton.react.js";
import { MAKE, tidy, Cross, defaultEmpty, grouped, Hint, Popup, useOptionSearch, Field, } from "./combobox-parts.react.js";
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
            }, filter: search ? null : undefined, itemToStringValue: (item) => item.label, disabled: disabled, required: required, name: name, defaultOpen: defaultOpen, children: [_jsx(Free.InputGroup, { className: "cap-combobox-group", children: _jsx(Free.Input, { id: inputId, className: "cap-combobox-input", "aria-labelledby": labelId, placeholder: placeholder, "aria-invalid": error != null ? true : undefined, "aria-describedby": describedBy, autoComplete: "off" }) }), _jsx(Free.Portal, { container: container ?? undefined, children: _jsx(Free.Positioner, { className: "cap-combobox-positioner", sideOffset: 4, align: "start", children: _jsxs(Free.Popup, { className: "cap-popover cap-combobox-popup", "data-flush": "", children: [_jsx(Free.Status, { className: "cap-combobox-status", children: loading || found.loading ? (_jsx(_Fragment, { children: _jsx(Spinner, { label: loadingText }) })) : found.failed ? (searchFailedText) : null }), _jsx(Free.List, { className: "cap-listbox cap-combobox-list", "data-controlled": "", children: isGrouped
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
