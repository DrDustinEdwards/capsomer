import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useId } from "react";
import { escapeHtml, numericColumns } from "./chart-frame.js";
// The "Show data" disclosure on its own, for a piece that already has its title and summary
// (a stat tile, an uptime strip). The table is in the HTML whether or not it is open.
export function ChartData({ table, label, open = false }) {
    const numeric = numericColumns(table);
    return (_jsxs("details", { className: "cap-disclosure cap-chart-data", "data-variant": "accordion", open: open || undefined, children: [_jsxs("summary", { children: [_jsx("span", { className: "cap-chart-show", children: "Show data" }), _jsx("span", { className: "cap-chart-hide", children: "Hide data" })] }), _jsx("div", { className: "cap-table-wrap", role: "region", "aria-label": label, tabIndex: 0, children: _jsxs("table", { className: "cap-table", children: [_jsx("thead", { children: _jsx("tr", { children: table.columns.map((h, c) => (_jsx("th", { scope: "col", "data-num": numeric[c] ? "" : undefined, children: h }, h + c))) }) }), _jsx("tbody", { children: table.rows.map((r, i) => (_jsxs("tr", { children: [_jsx("th", { scope: "row", children: r[0] }), r.slice(1).map((cell, c) => (_jsx("td", { "data-num": numeric[c + 1] ? "" : undefined, children: cell }, c)))] }, i))) })] }) })] }));
}
function Heading({ level, id, children }) {
    const Tag = `h${level}`;
    return (_jsx(Tag, { className: "cap-chart-title", id: id, children: children }));
}
export function ChartFrame({ title, summary, chart, table, tableLabel, open, meta, hideSummary = false, level = 3, className, children }) {
    const id = useId();
    return (_jsxs("figure", { className: className ? `cap-chart ${className}` : "cap-chart", "aria-labelledby": `${id}-title`, "aria-describedby": `${id}-summary`, "data-summary": hideSummary ? "hidden" : undefined, children: [_jsxs("div", { className: "cap-chart-head", children: [_jsx(Heading, { level: level, id: `${id}-title`, children: title }), meta != null ? _jsx("span", { className: "cap-chart-meta", children: meta }) : null] }), _jsx("p", { className: "cap-chart-summary", id: `${id}-summary`, children: summary }), typeof chart === "string" ? _jsx("div", { className: "cap-chart-body", dangerouslySetInnerHTML: { __html: chart } }) : _jsx("div", { className: "cap-chart-body", children: chart }), children, _jsx(ChartData, { table: table, label: tableLabel ?? title, open: open })] }));
}
// Re-exported for a server that wants to escape its own text the same way.
export { escapeHtml };
