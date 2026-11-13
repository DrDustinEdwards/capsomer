import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
const box = { viewBox: "0 0 16 16", "aria-hidden": true, focusable: false };
// One shape per meaning, so the shape carries it without color. Marks inside a filled
// shape are cut out (evenodd), so the glyph reads on any background, a tint included.
export function Glyph({ name, tone }) {
    // A glyph on its own (a status icon beside a name, with no word of its own) takes its tone's
    // color from data-tone; inside a status or a pill it takes the word's.
    const attrs = { className: "cap-status-glyph", "data-tone": tone, ...box };
    switch (name) {
        case "crit":
            return (_jsx("svg", { ...attrs, children: _jsx("path", { fill: "currentColor", fillRule: "evenodd", d: "M5 1h6l4 4v6l-4 4H5l-4-4V5zM7.2 4h1.6v5H7.2zM7.2 10.4h1.6V12H7.2z" }) }));
        case "warn":
            return (_jsx("svg", { ...attrs, children: _jsx("path", { fill: "currentColor", fillRule: "evenodd", d: "M8 1.2 15.4 14H.6zM7.3 6h1.4v4H7.3zM7.3 11h1.4v1.4H7.3z" }) }));
        case "info":
            return (_jsxs("svg", { ...attrs, children: [_jsx("rect", { x: "1.5", y: "1.5", width: "13", height: "13", rx: "2", fill: "none", stroke: "currentColor", strokeWidth: "1.6" }), _jsx("path", { fill: "currentColor", d: "M7.2 7h1.6v5H7.2zM7.2 4h1.6v1.7H7.2z" })] }));
        case "ok":
            return (_jsx("svg", { ...attrs, children: _jsx("path", { fill: "currentColor", fillRule: "evenodd", d: "M8 1a7 7 0 1 0 0 14A7 7 0 1 0 8 1zM3.9 9l3 3 5.2-5.6-1.4-1.4-3.8 4.2-1.6-1.6z" }) }));
        case "nodata":
        case "muted":
            return (_jsx("svg", { ...attrs, children: _jsxs(_Fragment, { children: [_jsx("circle", { cx: "8", cy: "8", r: "6.2", fill: "none", stroke: "currentColor", strokeWidth: "1.6" }), _jsx("path", { d: "M5 8h6", fill: "none", stroke: "currentColor", strokeWidth: "1.6", strokeLinecap: "round" })] }) }));
        case "queued":
            return (_jsx("svg", { ...attrs, children: _jsx("circle", { cx: "8", cy: "8", r: "6.2", fill: "none", stroke: "currentColor", strokeWidth: "1.6" }) }));
        case "unknown":
        case "question":
            return (_jsxs("svg", { ...attrs, children: [_jsx("circle", { cx: "8", cy: "8", r: "6.2", fill: name === "question" ? "currentColor" : "none", fillOpacity: name === "question" ? 0.18 : undefined, stroke: "currentColor", strokeWidth: "1.6" }), _jsx("path", { d: "M6.1 6.4a1.95 1.95 0 1 1 2.9 1.7c-.6.3-1 .7-1 1.4", fill: "none", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round" }), _jsx("circle", { cx: "8", cy: "11.7", r: ".9", fill: "currentColor" })] }));
        case "blocked":
            return (_jsx("svg", { ...attrs, children: _jsx("path", { fill: "currentColor", fillRule: "evenodd", d: "M4 1.5h8A2.5 2.5 0 0 1 14.5 4v8a2.5 2.5 0 0 1-2.5 2.5H4A2.5 2.5 0 0 1 1.5 12V4A2.5 2.5 0 0 1 4 1.5zM5.7 4.8h1.5v6.4H5.7zM8.8 4.8h1.5v6.4H8.8z" }) }));
        case "pr":
            return (_jsx("svg", { ...attrs, children: _jsxs("g", { fill: "none", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round", children: [_jsx("circle", { cx: "4.3", cy: "3.4", r: "1.8" }), _jsx("circle", { cx: "4.3", cy: "12.6", r: "1.8" }), _jsx("circle", { cx: "11.7", cy: "12.6", r: "1.8" }), _jsx("path", { d: "M4.3 5.2v5.6M11.7 10.8V7.1A2.5 2.5 0 0 0 9.2 4.6H7.4M8.9 3 7.3 4.6l1.6 1.6" })] }) }));
        case "report":
            return (_jsx("svg", { ...attrs, children: _jsx("path", { d: "M3.4 14.5V2M3.4 2.5h8.7l-1.8 3 1.8 3H3.4", fill: "currentColor", fillOpacity: 0.18, stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round" }) }));
        case "proposal":
            return (_jsxs("svg", { ...attrs, children: [_jsx("path", { d: "M3.4 1.7h6.3l2.9 2.9v9.7H3.4z", fill: "currentColor", fillOpacity: 0.18, stroke: "currentColor", strokeWidth: "1.5", strokeLinejoin: "round" }), _jsx("path", { d: "M5.7 8h4.6M5.7 10.9h4.6", fill: "none", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round" })] }));
        case "site-down":
            return (_jsx("svg", { ...attrs, children: _jsx("path", { fill: "currentColor", fillRule: "evenodd", d: "M8 1a7 7 0 1 0 0 14A7 7 0 1 0 8 1zM7.2 4h1.6v4.1l1.5-1.5 1.1 1.1L8 11 4.6 7.7l1.1-1.1 1.5 1.5z" }) }));
        case "running":
            return (_jsxs("svg", { ...attrs, children: [_jsx("circle", { cx: "8", cy: "8", r: "6.2", fill: "none", stroke: "currentColor", strokeWidth: "1.6", opacity: "0.35" }), _jsx("path", { fill: "none", stroke: "currentColor", strokeWidth: "1.8", strokeLinecap: "round", d: "M8 1.8a6.2 6.2 0 0 1 6.2 6.2" })] }));
    }
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
