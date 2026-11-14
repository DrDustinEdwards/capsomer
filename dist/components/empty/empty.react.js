import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { Glyph } from "../status/status.react.js";
import { Spinner } from "../skeleton/skeleton.react.js";
export function Empty({ kind, title, children, action, icon, flush, titleAs: Title = "p", role, }) {
    let head;
    if (kind === "all-clear") {
        head = (_jsxs("span", { className: "cap-status", "data-tone": "ok", children: [_jsx(Glyph, { name: "ok" }), title ?? "All clear"] }));
    }
    else if (kind === "failed") {
        head = (_jsxs(_Fragment, { children: [_jsx(Glyph, { name: "crit" }), title] }));
    }
    else {
        head = title;
    }
    return (_jsxs("div", { className: "cap-empty", "data-kind": kind, "data-flush": flush ? "" : undefined, role: kind === "failed" ? "alert" : role, children: [icon ? (_jsx("div", { className: "cap-empty-media", "data-variant": "icon", "aria-hidden": "true", children: icon })) : null, _jsxs("div", { className: "cap-empty-header", children: [_jsx(Title, { className: "cap-empty-title", children: head }), children ? _jsx("p", { className: "cap-empty-text", children: children }) : null] }), kind !== "all-clear" && action ? _jsx("div", { className: "cap-empty-content", children: action }) : null] }));
}
export function Wait({ label, children }) {
    return (_jsxs("div", { className: "cap-empty-wait", "aria-busy": "true", children: [_jsx(Spinner, { label: label }), _jsx("p", { className: "cap-empty-text", children: children })] }));
}
// No value in a table cell or a line of facts: a muted word, never a blank cell or a dash, so a
// screen reader says it and the eye sees it is missing on purpose.
export function Missing({ children = "none", reason }) {
    return (_jsxs("span", { className: "cap-missing", title: reason, children: [children, reason ? _jsxs("span", { className: "cap-sr-only", children: [": ", reason] }) : null] }));
}
