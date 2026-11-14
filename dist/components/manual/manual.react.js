import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { Fragment } from "react";
import { patchDots } from "./manual.js";
import { Link } from "../link/link.react.js";
/**
 * The project's round patch (manual.ts patchSvg's contract) as React, so a page draws it without injecting markup.
 * Decorative: the page says the same in words beside it.
 */
export function Patch({ id, name, foot, count, unit }) {
    const p = `cap-patch-${id}`;
    return (_jsxs("svg", { className: "cap-patch", viewBox: "0 0 140 140", "aria-hidden": "true", focusable: "false", children: [_jsxs("defs", { children: [_jsx("path", { id: `${p}-top`, d: "M 22 70 A 48 48 0 0 1 118 70" }), _jsx("path", { id: `${p}-foot`, d: "M 27 74 A 43 43 0 0 0 113 74" })] }), _jsx("circle", { className: "cap-patch-rim", cx: "70", cy: "70", r: "68" }), _jsx("circle", { className: "cap-patch-field", cx: "70", cy: "70", r: "61" }), _jsx("circle", { className: "cap-patch-disc", cx: "70", cy: "70", r: "36" }), patchDots(count).map(([cx, cy]) => (_jsx("circle", { className: "cap-patch-dot", cx: cx, cy: cy, r: "3.4" }, `${cx},${cy}`))), _jsx("text", { className: "cap-patch-name", textAnchor: "middle", children: _jsx("textPath", { href: `#${p}-top`, startOffset: "50%", children: name.toUpperCase() }) }), _jsx("text", { className: "cap-patch-foot", textAnchor: "middle", children: _jsx("textPath", { href: `#${p}-foot`, startOffset: "50%", children: foot.toUpperCase() }) }), _jsx("text", { className: "cap-patch-count", x: "70", y: "77", textAnchor: "middle", children: count }), _jsx("text", { className: "cap-patch-unit", x: "70", y: "89", textAnchor: "middle", children: unit.toUpperCase() })] }));
}
/**
 * The running head under the mast: the section's number and trail, the folio at the right, across the wide track of
 * a tracks page. Hidden from screen readers: it sits outside every landmark and says only what the h1 and the
 * breadcrumb say.
 */
export function RunningHead({ no, trail, folio }) {
    return (_jsx("div", { className: "cap-page cap-tracks cap-running-head-tracks", "aria-hidden": "true", children: _jsxs("div", { className: "cap-running-head", "data-track": "wide", children: [_jsxs("span", { className: "cap-running-head-name", children: [_jsx("span", { className: "cap-running-head-no", children: no }), _jsx("span", { className: "cap-running-head-trail", children: trail.join(" · ") })] }), _jsx("span", { className: "cap-running-head-folio", children: folio })] }) }));
}
const list = (ways) => Array.isArray(ways) ? ways : ways ? [ways] : [];
const routerSign = ({ href, children, ...rest }) => (_jsx(Link, { to: href, ...rest, children: children }));
// The manual's signs (`nav.cap-signs` of `a.cap-sign`, manual.md): a sign shows only the title,
// and its kind is read, not shown, since the arrow says it. Renders nothing with no way on.
export function Signs({ label, prev, next, className, renderLink = routerSign }) {
    const back = list(prev);
    const on = list(next);
    if (back.length === 0 && on.length === 0)
        return null;
    const sign = (target, rel) => (_jsx(Fragment, { children: renderLink({
            href: target.href,
            className: "cap-sign",
            rel: target.rel ? `${rel} ${target.rel}` : rel,
            ...(target.forward ? { "data-variant": "forward" } : {}),
            children: (_jsxs(_Fragment, { children: [_jsxs("span", { className: "cap-sr-only", children: [target.label, ": "] }), target.title] })),
        }) }, `${rel}:${target.href}`));
    return (_jsxs("nav", { className: className ? `cap-signs ${className}` : "cap-signs", "aria-label": label, children: [back.map((t) => sign(t, "prev")), on.map((t) => sign(t, "next"))] }));
}
