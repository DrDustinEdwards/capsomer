import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useId, useMemo, useState } from "react";
import { compareValues } from "./table.js";
function reflowAttr(reflow) {
    if (!reflow)
        return undefined;
    return reflow === true ? "" : reflow;
}
export function Table(props) {
    const { caption, captionHidden = false, captionBottom = false, labelledBy, reflow, sticky = false, density, className, tableClassName, children, } = props;
    const captionId = useId();
    return (_jsx("div", { className: className ? `cap-table-wrap ${className}` : "cap-table-wrap", "data-cap": "table", "data-cap-ready": "", role: "region", "aria-labelledby": labelledBy ?? captionId, tabIndex: 0, "data-reflow": reflowAttr(reflow), "data-sticky": sticky ? "" : undefined, "data-density": density, children: _jsxs("table", { className: tableClassName ? `cap-table ${tableClassName}` : "cap-table", "data-caption": captionBottom ? "bottom" : undefined, children: [_jsx("caption", { id: captionId, className: captionHidden ? "cap-sr-only" : undefined, children: caption }), children] }) }));
}
export function sortedRows(rows, by, direction) {
    if (!by)
        return [...rows];
    const sign = direction === "ascending" ? 1 : -1;
    return rows
        .map((row, i) => ({ row, i, key: by(row) }))
        .sort((a, b) => sign * compareValues(a.key, b.key) || a.i - b.i)
        .map((k) => k.row);
}
function SortGlyph() {
    return (_jsxs("svg", { width: "10", height: "12", viewBox: "0 0 10 12", "aria-hidden": "true", children: [_jsx("path", { className: "cap-table-sort-up", d: "M5 1 9 5H1z" }), _jsx("path", { className: "cap-table-sort-down", d: "M5 11 1 7h8z" })] }));
}
export function DataTable(props) {
    const { columns, rows, rowKey, empty, sorted, selected, foot, ...table } = props;
    const [sort, setSort] = useState(sorted);
    const column = columns.find((c) => c.key === sort?.key);
    // Rows that arrive sorted are shown in that order until a header is pressed.
    const shown = useMemo(() => (sort && sort !== sorted ? sortedRows(rows, column?.sortBy, sort.direction) : [...rows]), [rows, column, sort, sorted]);
    const labelOf = (c) => c.label ?? (typeof c.header === "string" ? c.header : undefined);
    const press = (key) => setSort((now) => ({
        key,
        direction: now?.key === key && now.direction === "ascending" ? "descending" : "ascending",
    }));
    return (_jsxs(Table, { ...table, children: [_jsx("thead", { children: _jsx("tr", { children: columns.map((c) => (_jsxs("th", { scope: "col", "aria-sort": sort?.key === c.key ? sort.direction : undefined, "data-num": c.num ? "" : undefined, "data-drop": c.drop, children: [c.sortBy ? (_jsxs("button", { type: "button", className: "cap-table-sort", onClick: () => press(c.key), children: [c.header, _jsx(SortGlyph, {})] })) : (c.header), c.note ? _jsx("span", { className: "cap-table-note", children: c.note }) : null] }, c.key))) }) }), _jsx("tbody", { children: shown.length === 0 ? (_jsx("tr", { children: _jsx("td", { className: "cap-table-empty", colSpan: columns.length, children: empty }) })) : (shown.map((row) => (_jsx("tr", { "data-state": selected?.(row) ? "selected" : undefined, children: columns.map((c, i) => {
                        const cell = {
                            "data-num": c.num ? "" : undefined,
                            "data-drop": c.drop,
                            "data-label": labelOf(c),
                        };
                        return i === 0 ? (_jsx("th", { scope: "row", ...cell, children: c.cell(row) }, c.key)) : (_jsx("td", { ...cell, children: c.cell(row) }, c.key));
                    }) }, rowKey(row))))) }), foot ? _jsx("tfoot", { children: foot }) : null] }));
}
