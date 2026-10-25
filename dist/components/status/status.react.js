import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
const box = { viewBox: "0 0 16 16", "aria-hidden": true, focusable: false };
// One shape per meaning, so the shape carries it without colour. Marks inside a filled
// shape are cut out (evenodd), so the glyph reads on any background, a tint included.
export function Glyph({ name }) {
    switch (name) {
        case "crit":
            return (_jsx("svg", { className: "cap-status-glyph", ...box, children: _jsx("path", { fill: "currentColor", fillRule: "evenodd", d: "M5 1h6l4 4v6l-4 4H5l-4-4V5zM7.2 4h1.6v5H7.2zM7.2 10.4h1.6V12H7.2z" }) }));
        case "warn":
            return (_jsx("svg", { className: "cap-status-glyph", ...box, children: _jsx("path", { fill: "currentColor", fillRule: "evenodd", d: "M8 1.2 15.4 14H.6zM7.3 6h1.4v4H7.3zM7.3 11h1.4v1.4H7.3z" }) }));
        case "info":
            return (_jsxs("svg", { className: "cap-status-glyph", ...box, children: [_jsx("rect", { x: "1.5", y: "1.5", width: "13", height: "13", rx: "2", fill: "none", stroke: "currentColor", strokeWidth: "1.6" }), _jsx("path", { fill: "currentColor", d: "M7.2 7h1.6v5H7.2zM7.2 4h1.6v1.7H7.2z" })] }));
        case "ok":
            return (_jsx("svg", { className: "cap-status-glyph", ...box, children: _jsx("path", { fill: "currentColor", fillRule: "evenodd", d: "M8 1a7 7 0 1 0 0 14A7 7 0 1 0 8 1zM3.9 9l3 3 5.2-5.6-1.4-1.4-3.8 4.2-1.6-1.6z" }) }));
        case "nodata":
            return (_jsx("svg", { className: "cap-status-glyph", ...box, children: _jsxs(_Fragment, { children: [_jsx("circle", { cx: "8", cy: "8", r: "6.2", fill: "none", stroke: "currentColor", strokeWidth: "1.6" }), _jsx("path", { d: "M5 8h6", fill: "none", stroke: "currentColor", strokeWidth: "1.6", strokeLinecap: "round" })] }) }));
        case "running":
            return (_jsxs("svg", { className: "cap-status-glyph", ...box, children: [_jsx("circle", { cx: "8", cy: "8", r: "6.2", fill: "none", stroke: "currentColor", strokeWidth: "1.6", opacity: "0.35" }), _jsx("path", { fill: "none", stroke: "currentColor", strokeWidth: "1.8", strokeLinecap: "round", d: "M8 1.8a6.2 6.2 0 0 1 6.2 6.2" })] }));
    }
}
function glyphFor(tone, running) {
    return running ? "running" : tone;
}
export function Status({ tone, running, children, reason, brief }) {
    if (brief && reason) {
        return (_jsxs("span", { className: "cap-status", "data-tone": tone, title: typeof reason === "string" ? reason : undefined, children: [_jsx(Glyph, { name: glyphFor(tone, running) }), children, _jsxs("span", { className: "cap-sr-only", children: [": ", reason] })] }));
    }
    const word = (_jsxs("span", { className: "cap-status", "data-tone": tone, children: [_jsx(Glyph, { name: glyphFor(tone, running) }), children] }));
    if (!reason)
        return word;
    // The reason follows the word as its own sentence, with a real space between, so a
    // screen reader does not run the two together.
    return (_jsxs(_Fragment, { children: [word, " ", _jsx("span", { className: "cap-status-reason", children: reason })] }));
}
// The badge: a status on its tint (tone), or one of the six variants. A tone always draws
// its glyph; a variant with no tone is just the word (or a count).
export function Pill({ tone, variant, running, children, href, onClick }) {
    const inner = (_jsxs(_Fragment, { children: [tone ? _jsx(Glyph, { name: glyphFor(tone, running) }) : null, children] }));
    const common = { className: "cap-pill", "data-tone": tone, "data-variant": variant };
    if (href)
        return _jsx("a", { ...common, href: href, children: inner });
    if (onClick)
        return _jsx("button", { type: "button", ...common, onClick: onClick, children: inner });
    return _jsx("span", { ...common, children: inner });
}
// The same component under shadcn's name.
export const Badge = Pill;
