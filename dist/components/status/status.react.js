import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { createElement } from "react";
import { STATUS_GLYPH } from "./status.js";
const box = { viewBox: "0 0 16 16", "aria-hidden": true, focusable: false };
// SVG attribute names as React spells them ("fill-rule" is fillRule).
const reactName = (name) => name.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
// One shape per meaning (STATUS_GLYPH in status.ts, which the HTML renderer draws too).
// A glyph on its own (a status icon beside a name, with no word of its own) takes its tone's color
// from data-tone; inside a status or a pill it takes the word's.
export function Glyph({ name, tone }) {
    return (_jsx("svg", { className: "cap-status-glyph", "data-tone": tone, ...box, children: STATUS_GLYPH[name].map(({ tag, attrs }, i) => createElement(tag, {
            key: i,
            ...Object.fromEntries(Object.entries(attrs).map(([k, v]) => [reactName(k), v])),
        })) }));
}
function glyphFor(tone, running, glyph) {
    if (glyph)
        return glyph;
    if (running)
        return "running";
    return tone;
}
export function Status({ tone, running, glyph, children, reason, brief, wrap }) {
    if (brief && reason) {
        return (_jsxs("span", { className: "cap-status", "data-tone": tone, "data-wrap": wrap ? "" : undefined, title: typeof reason === "string" ? reason : undefined, children: [_jsx(Glyph, { name: glyphFor(tone, running, glyph) }), children, _jsxs("span", { className: "cap-sr-only", children: [": ", reason] })] }));
    }
    const word = (_jsxs("span", { className: "cap-status", "data-tone": tone, "data-wrap": wrap ? "" : undefined, children: [_jsx(Glyph, { name: glyphFor(tone, running, glyph) }), children] }));
    if (!reason)
        return word;
    // The reason follows the word as its own sentence, with a real space between, so a
    // screen reader does not run the two together.
    return (_jsxs(_Fragment, { children: [word, " ", _jsx("span", { className: "cap-status-reason", children: reason })] }));
}
// The badge: a status on its tint (tone), or one of the six variants. A tone always draws
// its glyph; a variant with no tone is just the word (or a count).
export function Pill({ tone, variant, running, glyph, series, family, children, href, onClick, }) {
    const inner = (_jsxs(_Fragment, { children: [tone && glyph !== false ? _jsx(Glyph, { name: glyphFor(tone, running, glyph) }) : null, series ? _jsx("span", { className: "cap-pill-dot", "aria-hidden": "true" }) : null, children] }));
    const common = {
        className: "cap-pill",
        "data-tone": tone,
        "data-variant": variant,
        "data-series": series,
        "data-family": family,
    };
    if (href)
        return (_jsx("a", { ...common, href: href, children: inner }));
    if (onClick)
        return (_jsx("button", { type: "button", ...common, onClick: onClick, children: inner }));
    return _jsx("span", { ...common, children: inner });
}
