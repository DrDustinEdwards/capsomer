import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Glyph } from "../status/status.react.js";
import { RING_R, ringDash } from "./freshness.js";
// The HTML contract in freshness.md.
export function Freshness({ updated, more, share, stale, staleLabel = "Stale", title, pending, }) {
    if (pending)
        return (_jsx("div", { className: "cap-fresh", role: "status", "aria-live": "polite", children: _jsx("span", { className: "cap-fresh-text", children: pending }) }));
    return (_jsxs("div", { className: "cap-fresh", "data-stale": stale ? "" : undefined, title: title, children: [share === undefined ? null : _jsx(FreshRing, { share: share }), stale ? (_jsxs("span", { className: "cap-fresh-stale", children: [_jsx(Glyph, { name: "warn" }), staleLabel] })) : null, _jsxs("span", { className: "cap-fresh-text", children: ["Updated ", _jsx("b", { children: updated })] }), more ? _jsxs("span", { className: "cap-fresh-more", children: ["\u00B7 ", more] }) : null] }));
}
// The countdown to the next read. Decorative: the words beside it say when the data was read.
export function FreshRing({ share }) {
    return (_jsxs("svg", { className: "cap-fresh-ring", viewBox: "0 0 16 16", "aria-hidden": "true", focusable: "false", children: [_jsx("circle", { className: "cap-fresh-ring-track", cx: "8", cy: "8", r: RING_R, fill: "none", strokeWidth: "2" }), _jsx("circle", { className: "cap-fresh-ring-left", cx: "8", cy: "8", r: RING_R, fill: "none", strokeWidth: "2", strokeDasharray: ringDash(share), transform: "rotate(-90 8 8)", strokeLinecap: "round" })] }));
}
