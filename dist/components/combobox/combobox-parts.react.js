import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { Combobox as Base } from "@base-ui/react/combobox";
import { useCallback, useEffect, useRef, useState } from "react";
import { Spinner } from "../skeleton/skeleton.react.js";
// A made value's id in the list, before it becomes a value: the prefix plus its text.
export const MAKE = "\u0001make:";
export const tidy = (text) => text.trim().replace(/\s+/g, " ");
const Check = () => (_jsx("svg", { width: "16", height: "16", viewBox: "0 0 16 16", "aria-hidden": "true", focusable: "false", children: _jsx("path", { fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", d: "m3.5 8.5 3 3 6-7" }) }));
export const Cross = ({ size = 16 }) => (_jsx("svg", { width: size, height: size, viewBox: "0 0 16 16", "aria-hidden": "true", focusable: "false", children: _jsx("path", { fill: "none", stroke: "currentColor", strokeWidth: "1.8", strokeLinecap: "round", d: "M4 4l8 8M12 4l-8 8" }) }));
const ErrorGlyph = () => (_jsxs("svg", { width: "14", height: "14", viewBox: "0 0 16 16", "aria-hidden": "true", focusable: "false", children: [_jsx("path", { fill: "currentColor", d: "M5 1h6l4 4v6l-4 4H5l-4-4V5z" }), _jsx("path", { fill: "var(--surface)", d: "M7.2 4h1.6v5H7.2zM7.2 10.4h1.6V12H7.2z" })] }));
export const defaultEmpty = (query) => query.trim()
    ? `No match for “${query.trim()}”. Check the spelling, or clear the box to see every option.`
    : "Nothing to choose from yet.";
// Options with a `group` are listed under that heading, in the order each heading first
// appears; the rest come first, with no heading. With no group anywhere the list is flat.
export function grouped(items) {
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
export function Hint({ item }) {
    return item.hint ? (_jsx("span", { className: "cap-option-keys", children: _jsx("span", { className: "cap-option-hint", children: item.hint }) })) : null;
}
function Option({ item }) {
    return (_jsxs(Base.Item, { value: item, disabled: item.disabled, className: "cap-option", children: [_jsx("span", { className: "cap-option-label", children: item.label }), _jsx(Hint, { item: item }), _jsx(Base.ItemIndicator, { className: "cap-option-indicator", children: _jsx(Check, {}) })] }, item.value));
}
// The popup: the shared popover surface around the shared listbox, with the loading and
// empty messages in Base UI's own regions so a change is announced.
export function Popup({ isGrouped, loading, loadingText, empty, container, anchor, multiple, }) {
    return (_jsx(Base.Portal, { container: container ?? undefined, children: _jsx(Base.Positioner, { className: "cap-combobox-positioner", sideOffset: 4, align: "start", anchor: anchor, children: _jsxs(Base.Popup, { className: "cap-popover cap-combobox-popup", "data-flush": "", children: [_jsx(Base.Status, { className: "cap-combobox-status", children: loading ? (_jsx(_Fragment, { children: _jsx(Spinner, { label: loadingText }) })) : null }), _jsx(Base.Empty, { className: "cap-listbox-empty cap-combobox-empty", children: loading ? null : empty }), _jsx(Base.List, { className: "cap-listbox cap-combobox-list", "data-controlled": "", "data-selection": multiple ? "multi" : "single", children: isGrouped
                            ? (group) => (_jsxs(Base.Group, { items: group.items, className: "cap-listbox-group", children: [group.value ? (_jsx(Base.GroupLabel, { className: "cap-listbox-label", children: group.value })) : null, _jsx(Base.Collection, { children: (item) => _jsx(Option, { item: item }, item.value) })] }, group.value || "none"))
                            : (item) => _jsx(Option, { item: item }, item.value) })] }) }) }));
}
const NOTHING = { items: [], loading: false, failed: false, short: true };
export function useOptionSearch(search, delay, min) {
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
// Found options and known ones, each value once, the found first (the search's own order), then
// the known options it did not return (the chosen one, so its label shows).
export function pool(known, found) {
    const seen = new Set(found.map((i) => i.value));
    return [...found, ...known.filter((i) => !seen.has(i.value))];
}
export function searchEmpty(found, query, hint, failed) {
    if (found.failed)
        return failed;
    if (found.short)
        return hint;
    return defaultEmpty(query);
}
export function Field({ label, labelId, inputId, required, help, helpId, error, errorId, children, }) {
    return (_jsxs("div", { className: "cap-combobox", "data-cap": "combobox", children: [_jsxs("label", { className: "cap-combobox-label", id: labelId, htmlFor: inputId, children: [label, required && " (required)"] }), help != null && (_jsx("p", { className: "cap-combobox-help", id: helpId, children: help })), children, error != null && (_jsxs("p", { className: "cap-combobox-error", id: errorId, children: [_jsx(ErrorGlyph, {}), error] }))] }));
}
