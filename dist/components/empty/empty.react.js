import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { Glyph } from "../status/status.react.js";
import { Spinner } from "../skeleton/skeleton.react.js";
// Spinner and Skeleton moved to components/skeleton in 0.2; still exported here so
// "capsomer/react/empty" imports keep working.
export { Skeleton, Spinner, SkeletonBlock } from "../skeleton/skeleton.react.js";
export function Empty({ kind, title, children, action, icon, flush, titleAs: Title = "p" }) {
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
    return (_jsxs("div", { className: "cap-empty", "data-kind": kind, "data-flush": flush ? "" : undefined, role: kind === "failed" ? "alert" : undefined, children: [icon ? (_jsx("div", { className: "cap-empty-media", "data-variant": "icon", "aria-hidden": "true", children: icon })) : null, _jsxs("div", { className: "cap-empty-header", children: [_jsx(Title, { className: "cap-empty-title", children: head }), children ? _jsx("p", { className: "cap-empty-text", children: children }) : null] }), kind !== "all-clear" && action ? _jsx("div", { className: "cap-empty-content", children: action }) : null] }));
}
export function Wait({ label, children }) {
    return (_jsxs("div", { className: "cap-empty-wait", "aria-busy": "true", children: [_jsx(Spinner, { label: label }), _jsx("p", { className: "cap-empty-text", children: children })] }));
}
