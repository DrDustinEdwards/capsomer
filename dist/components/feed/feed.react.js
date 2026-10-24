import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { createElement, useId } from "react";
const paths = {
    crit: (_jsxs(_Fragment, { children: [_jsx("path", { fill: "currentColor", d: "M5 1h6l4 4v6l-4 4H5l-4-4V5z" }), _jsx("path", { fill: "var(--surface)", d: "M7.2 4h1.6v5H7.2zM7.2 10.4h1.6V12H7.2z" })] })),
    warn: (_jsxs(_Fragment, { children: [_jsx("path", { fill: "currentColor", d: "M8 1.2 15.4 14H.6z" }), _jsx("path", { fill: "var(--surface)", d: "M7.3 6h1.4v4H7.3zM7.3 11h1.4v1.4H7.3z" })] })),
    info: (_jsxs(_Fragment, { children: [_jsx("rect", { x: "1.5", y: "1.5", width: "13", height: "13", rx: "2", fill: "none", stroke: "currentColor", strokeWidth: "1.6" }), _jsx("path", { fill: "currentColor", d: "M7.2 7h1.6v5H7.2zM7.2 4h1.6v1.7H7.2z" })] })),
    ok: (_jsxs(_Fragment, { children: [_jsx("circle", { cx: "8", cy: "8", r: "7", fill: "currentColor" }), _jsx("path", { fill: "none", stroke: "var(--surface)", strokeWidth: "1.8", strokeLinecap: "round", strokeLinejoin: "round", d: "m4.6 8.3 2.3 2.3 4.5-4.9" })] })),
    nodata: _jsxs(_Fragment, { children: [_jsx("circle", { cx: "8", cy: "8", r: "6.2", fill: "none", stroke: "currentColor", strokeWidth: "1.6" }), _jsx("path", { d: "M5 8h6", fill: "none", stroke: "currentColor", strokeWidth: "1.6", strokeLinecap: "round" })] }),
    dot: _jsx("circle", { cx: "8", cy: "8", r: "3.2", fill: "currentColor" }),
};
function Glyph({ kind }) {
    return (_jsx("svg", { className: "cap-feed-glyph", width: "14", height: "14", viewBox: "0 0 16 16", "aria-hidden": "true", focusable: "false", children: paths[kind] }));
}
export function Feed({ days, headingLevel = 4 }) {
    const prefix = useId();
    const whatId = (eventId) => `${prefix}-${eventId}-what`;
    return (_jsx("div", { className: "cap-feed", "data-cap": "feed", children: days.map((day) => {
            const headId = `${prefix}-${day.id}`;
            return (_jsxs("div", { className: "cap-feed-day", children: [createElement(`h${headingLevel}`, { className: "cap-feed-day-title", id: headId }, day.label), _jsx("ol", { className: "cap-feed-list", "aria-labelledby": headId, children: day.events.map((e) => {
                            const kind = e.kind ?? "event";
                            return (_jsxs("li", { className: "cap-feed-row", "data-tone": e.tone, "data-kind": kind === "event" ? undefined : kind, children: [_jsx(Glyph, { kind: kind === "condensed" ? "dot" : e.tone }), _jsxs("div", { className: "cap-feed-what", children: [kind === "marker" ? (_jsx("a", { className: "cap-feed-marker-link", href: e.href, "aria-describedby": e.about ? whatId(e.about) : undefined, children: e.what })) : (_jsx("span", { id: whatId(e.id), children: e.what })), e.detail ? _jsx("div", { className: "cap-feed-who", children: e.detail }) : null] }), e.until ? (_jsxs("span", { className: "cap-feed-when", children: [_jsx("time", { className: "cap-time", dateTime: e.at, children: e.when }), " ", "to", " ", _jsx("time", { className: "cap-time", dateTime: e.until.at, children: e.until.when })] })) : (_jsx("time", { className: "cap-time cap-feed-when", dateTime: e.at, children: e.when }))] }, e.id));
                        }) })] }, day.id));
        }) }));
}
