import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
const Arc = () => (_jsxs("svg", { className: "cap-spinner-arc", viewBox: "0 0 16 16", "aria-hidden": "true", focusable: "false", children: [_jsx("circle", { cx: "8", cy: "8", r: "6", fill: "none", stroke: "currentColor", strokeWidth: "2", opacity: "0.25" }), _jsx("path", { fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", d: "M8 2a6 6 0 0 1 6 6" })] }));
export function Spinner({ label = "Loading", hideLabel, size, layout }) {
    return (_jsxs("span", { className: "cap-spinner", "data-label": hideLabel ? "hidden" : undefined, "data-size": size, "data-layout": layout, role: layout === "page" ? "status" : undefined, children: [_jsx(Arc, {}), _jsx("span", { className: "cap-spinner-label", children: label })] }));
}
// Grey lines standing in for a page's content: busy, and "Loading" for a screen reader.
export function Skeleton({ lines = 3, label = "Loading" }) {
    return (_jsxs("div", { className: "cap-skeleton", "aria-busy": "true", children: [_jsx("span", { className: "cap-sr-only", children: label }), Array.from({ length: lines }, (_, i) => (_jsx("span", { className: "cap-skeleton-line", "aria-hidden": "true" }, i)))] }));
}
// One shape on its own (shadcn's Skeleton): an avatar, a card. Decorative: put it inside a
// busy region that says "Loading".
export function SkeletonBlock({ shape = "block" }) {
    return _jsx("span", { className: "cap-skeleton-block", "data-shape": shape === "block" ? undefined : shape, "aria-hidden": "true" });
}
