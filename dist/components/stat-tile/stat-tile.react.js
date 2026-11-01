import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { dataTableBlock } from "enarratio";
import { Children } from "react";
const GLYPH = {
    crit: (_jsxs(_Fragment, { children: [_jsx("path", { fill: "currentColor", d: "M5 1h6l4 4v6l-4 4H5l-4-4V5z" }), _jsx("path", { fill: "var(--surface)", d: "M7.2 4h1.6v5H7.2zM7.2 10.4h1.6V12H7.2z" })] })),
    warn: (_jsxs(_Fragment, { children: [_jsx("path", { fill: "currentColor", d: "M8 1.2 15.4 14H.6z" }), _jsx("path", { fill: "var(--surface)", d: "M7.3 6h1.4v4H7.3zM7.3 11h1.4v1.4H7.3z" })] })),
    nodata: _jsxs(_Fragment, { children: [_jsx("circle", { cx: "8", cy: "8", r: "6.2", fill: "none", stroke: "currentColor", strokeWidth: "1.6" }), _jsx("path", { d: "M5 8h6", fill: "none", stroke: "currentColor", strokeWidth: "1.6", strokeLinecap: "round" })] }),
};
function Glyph({ tone }) {
    return (_jsx("svg", { width: "14", height: "14", viewBox: "0 0 16 16", "aria-hidden": "true", focusable: "false", children: GLYPH[tone] }));
}
const plainLink = ({ children, ...props }) => _jsx("a", { ...props, children: children });
export function StatTile(props) {
    const { label, tone, word, chart, chartSummary, chartTable, chartTableLabel, href, onClick, renderLink = plainLink } = props;
    const nodata = props.tone === "nodata";
    const hasChart = Boolean(chart) && !nodata;
    // The figure, its label and its word on one line, the detail beneath (the Portal's compact
    // tile). The figure comes first in the DOM, so the name reads "6 of 6 Sites up All up".
    const body = props.tone === "nodata" ? (_jsxs(_Fragment, { children: [_jsxs("span", { className: "cap-tile-line", children: [_jsxs("span", { className: "cap-tile-figure", children: [_jsx(Glyph, { tone: "nodata" }), "No data"] }), _jsx("span", { className: "cap-tile-label", children: label })] }), _jsx("span", { className: "cap-tile-detail", children: props.reason })] })) : (_jsxs(_Fragment, { children: [_jsxs("span", { className: "cap-tile-line", children: [_jsxs("span", { className: "cap-tile-figure", children: [props.figure, props.unit ? _jsxs(_Fragment, { children: [" ", _jsx("small", { children: props.unit })] }) : null] }), _jsx("span", { className: "cap-tile-label", children: label }), word ? (_jsxs("span", { className: "cap-tile-word", children: [props.tone === "warn" || props.tone === "crit" ? _jsx(Glyph, { tone: props.tone }) : null, word] })) : null] }), props.detail ? _jsx("span", { className: "cap-tile-detail", children: props.detail }) : null, chart ? _jsx("span", { className: "cap-tile-chart", ...(chartSummary ? { role: "img", "aria-label": chartSummary } : {}), dangerouslySetInnerHTML: { __html: chart } }) : null] }));
    const tile = href !== undefined ? (renderLink({ href, className: "cap-tile", "data-tone": tone, children: body })) : (_jsx("button", { type: "button", className: "cap-tile", "data-tone": tone, onClick: onClick, children: body }));
    // With a table, "Show data" sits under the tile, never inside the link.
    if (hasChart && chartTable) {
        return (_jsxs("div", { className: "cap-data", children: [tile, _jsx("div", { dangerouslySetInnerHTML: { __html: dataTableBlock(chartTable, chartTableLabel ?? `${label}, by period`) } })] }));
    }
    return tile;
}
// The row of tiles: each as wide as its text, wrapping onto more rows instead of cutting a
// word, so a phone gets two or one across without a breakpoint.
export function StatTiles({ label, children }) {
    return (_jsx("div", { className: "cap-tiles", children: _jsx("ul", { className: "cap-tiles-list", "aria-label": label, children: Children.toArray(children).map((child, i) => (_jsx("li", { children: child }, i))) }) }));
}
