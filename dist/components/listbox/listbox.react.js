import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { Fragment, useId } from "react";
import { resultsText } from "./listbox.js";
export { emptyText, filterCommands, groupBy, matchesQuery, nextTypeahead, resultsText, step, stepEnabled } from "./listbox.js";
export function Listbox({ selection = "none", mode = "descendant", variant, controlled, className, children, ...rest }) {
    return (_jsx("div", { tabIndex: mode === "descendant" ? 0 : undefined, ...rest, role: "listbox", className: className ? `cap-listbox ${className}` : "cap-listbox", "aria-multiselectable": selection === "multi" ? true : undefined, "data-selection": selection, "data-mode": mode, "data-variant": variant, "data-controlled": controlled ? "" : undefined, children: children }));
}
const Check = () => (_jsx("svg", { width: "16", height: "16", viewBox: "0 0 16 16", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", focusable: "false", children: _jsx("path", { d: "M3.5 8.5 6.5 11.5 12.5 4.5" }) }));
export function Option({ id, value, selected, active, disabled, tone, keywords, icon, hint, keys, className, children, ...rest }) {
    const caps = Array.isArray(keys) ? keys : null;
    const hasKeys = hint != null || (caps ? caps.length > 0 : keys != null);
    return (_jsxs("div", { ...rest, id: id, role: "option", className: className ? `cap-option ${className}` : "cap-option", "aria-selected": selected === undefined ? undefined : selected, "aria-disabled": disabled ? true : undefined, "data-active": active ? "" : undefined, "data-tone": tone, "data-value": value, "data-keywords": keywords?.length ? keywords.join(",") : undefined, children: [icon != null ? _jsx("span", { className: "cap-option-icon", children: icon }) : null, _jsx("span", { className: "cap-option-label", children: children }), hasKeys ? (_jsxs("span", { className: "cap-option-keys", children: [hint != null ? (_jsxs(_Fragment, { children: [_jsx("span", { className: "cap-sr-only", children: ", " }), _jsx("span", { className: "cap-option-hint", children: hint })] })) : null, caps ? (_jsxs(_Fragment, { children: [_jsx("span", { className: "cap-sr-only", children: ", shortcut " }), caps.map((cap, i) => (_jsxs(Fragment, { children: [i > 0 ? " " : null, _jsx("kbd", { children: cap })] }, `${cap}-${i}`)))] })) : keys] })) : null, selected !== undefined ? (_jsx("span", { className: "cap-option-indicator", "aria-hidden": "true", children: _jsx(Check, {}) })) : null] }));
}
export function OptionGroup({ label, className, children, ...rest }) {
    const labelId = useId();
    return (_jsxs("div", { ...rest, role: "group", "aria-labelledby": labelId, className: className ? `cap-listbox-group ${className}` : "cap-listbox-group", children: [_jsx("div", { className: "cap-listbox-label", id: labelId, role: "presentation", children: label }), children] }));
}
export function ListboxSeparator() {
    return _jsx("div", { className: "cap-listbox-separator", "aria-hidden": "true" });
}
// "No results for ..." beside the list, in a status region. Takes no room while empty.
export function ListboxEmpty({ children }) {
    return (_jsx("p", { className: "cap-listbox-empty", role: "status", children: children }));
}
// The polite live region that says the count after a filter. Visually hidden.
export function ListboxStatus({ count, filtered }) {
    return (_jsx("div", { className: "cap-sr-only", role: "status", "aria-atomic": "true", children: filtered && count > 0 ? resultsText(count) : "" }));
}
