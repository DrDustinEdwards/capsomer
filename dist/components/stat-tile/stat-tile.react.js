import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { Children } from "react";
import { markup } from "../trusted-html/trusted-html.js";
import { plainLink } from "../hooks/hooks.react.js";
import { Glyph } from "../status/status.react.js";
export function StatTile(props) {
    const { label, tone, word, chart, chartSummary, chartTable, href, onClick, renderLink = plainLink, } = props;
    const nodata = props.tone === "nodata";
    const hasChart = Boolean(chart) && !nodata;
    // The figure, its label and its word on one line, the detail beneath (the Portal's compact
    // tile). The figure comes first in the DOM, so the name reads "6 of 6 Sites up All up".
    const body = props.tone === "nodata" ? (_jsxs(_Fragment, { children: [_jsxs("span", { className: "cap-tile-line", children: [_jsxs("span", { className: "cap-tile-figure", children: [_jsx(Glyph, { name: "nodata" }), "No data"] }), _jsx("span", { className: "cap-tile-label", children: label })] }), _jsx("span", { className: "cap-tile-detail", children: props.reason })] })) : (_jsxs(_Fragment, { children: [_jsxs("span", { className: "cap-tile-line", children: [_jsxs("span", { className: "cap-tile-figure", children: [props.figure, props.unit ? (_jsxs(_Fragment, { children: [" ", _jsx("small", { children: props.unit })] })) : null] }), _jsx("span", { className: "cap-tile-label", children: label }), word ? (_jsxs("span", { className: "cap-tile-word", children: [props.tone === "warn" || props.tone === "crit" ? _jsx(Glyph, { name: props.tone }) : null, word] })) : null] }), props.detail ? _jsx("span", { className: "cap-tile-detail", children: props.detail }) : null, chart ? (_jsx("span", { className: "cap-tile-chart", ...(chartSummary ? { role: "img", "aria-label": chartSummary } : {}), dangerouslySetInnerHTML: markup(chart) })) : null] }));
    const tile = href !== undefined ? (renderLink({ href, className: "cap-tile", "data-tone": tone, children: body })) : (_jsx("button", { type: "button", className: "cap-tile", "data-tone": tone, onClick: onClick, children: body }));
    // With a table, its hidden table sits under the tile, never inside the link.
    if (hasChart && chartTable) {
        return (_jsxs("div", { className: "cap-data", children: [tile, _jsx("div", { dangerouslySetInnerHTML: markup(chartTable) })] }));
    }
    return tile;
}
// The static variant: a label, a figure, an optional delta and note, and nothing to follow. A
// figure that leads somewhere is a StatTile, always a link or a button.
export function StaticStatTile(props) {
    const { label, icon, delta, detail, size, tone, figureFirst = false } = props;
    const nodata = props.tone === "nodata";
    const name = (_jsxs("p", { className: "cap-tile-label", children: [icon ? (_jsx("span", { className: "cap-tile-icon", "aria-hidden": "true", children: icon })) : null, label] }));
    return (_jsxs("div", { className: "cap-tile", "data-variant": "static", "data-tone": tone, "data-size": size, children: [figureFirst ? null : name, _jsxs("p", { className: "cap-tile-line", children: [props.tone === "nodata" ? (_jsxs("span", { className: "cap-tile-figure", children: [_jsx(Glyph, { name: "nodata" }), "No data"] })) : (_jsxs("span", { className: "cap-tile-figure", children: [props.figure, props.unit ? (_jsxs(_Fragment, { children: [" ", _jsx("small", { children: props.unit })] })) : null] })), delta && !nodata ? _jsxs(_Fragment, { children: [" ", delta] }) : null] }), figureFirst ? name : null, props.tone === "nodata" ? (_jsx("p", { className: "cap-tile-detail", children: props.reason })) : detail ? (_jsx("p", { className: "cap-tile-detail", children: detail })) : null] }));
}
// The row of tiles: each as wide as its text, wrapping onto more rows instead of cutting a
// word, so a phone gets two or one across without a breakpoint.
export function StatTiles({ label, layout, children }) {
    return (_jsx("div", { className: "cap-tiles", "data-layout": layout, children: _jsx("ul", { className: "cap-tiles-list", "aria-label": label, children: Children.toArray(children).map((child, i) => (_jsx("li", { children: child }, i))) }) }));
}
