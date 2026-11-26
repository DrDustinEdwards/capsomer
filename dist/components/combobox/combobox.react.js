import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Combobox as Base } from "@base-ui/react/combobox";
import { useEffect, useId, useMemo, useRef, useState, useLayoutEffect, } from "react";
import { Icon, iconChevronDown } from "../icons/icons.react.js";
import { Cross, defaultEmpty, grouped, Popup, useOptionSearch, pool, searchEmpty, Field, } from "./combobox-parts.react.js";
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
            }, isItemEqualToValue: (a, b) => a.value === b.value, itemToStringLabel: (item) => item.label, itemToStringValue: (item) => item.value, disabled: disabled, required: required, name: name, defaultOpen: defaultOpen, children: [_jsxs(Base.InputGroup, { className: "cap-combobox-group", children: [_jsx(Base.Input, { id: inputId, className: "cap-combobox-input", "aria-labelledby": labelId, placeholder: placeholder, "aria-invalid": error != null ? true : undefined, "aria-describedby": describedBy, autoComplete: "off" }), clearable && (_jsx(Base.Clear, { className: "cap-combobox-clear", "aria-label": `Clear ${label}`, children: _jsx(Cross, {}) })), _jsx(Base.Trigger, { className: "cap-combobox-trigger", "aria-label": `Show ${label} options`, children: _jsx(Icon, { d: iconChevronDown }) })] }), _jsx(Popup, { isGrouped: isGrouped, loading: loading || found.loading, loadingText: search && loadingText === "Loading" ? "Searching" : loadingText, empty: empty, container: container, multiple: false })] }) }));
}
export { ComboboxFreeText, ComboboxMultiple } from "./combobox-multi.react.js";
