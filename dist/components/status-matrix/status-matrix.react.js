import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Glyph } from "../status/status.react.js";
// Every row against every column at a glance (each area on each site): a table whose cells are
// status glyphs, each one an image named with its row, its column, its status and why. The row
// headers stay in view as the table scrolls sideways.
export function StatusMatrix({ caption, showCaption = false, columns, rows, emptyLabel = "Not checked", }) {
    return (_jsx("div", { className: "cap-table-wrap cap-matrix", role: "region", "aria-label": caption, tabIndex: 0, children: _jsxs("table", { className: "cap-table", children: [_jsx("caption", { className: showCaption ? undefined : "cap-sr-only", children: caption }), _jsx("thead", { children: _jsxs("tr", { children: [_jsx("td", {}), columns.map((c) => (_jsx("th", { scope: "col", children: c.name }, c.id)))] }) }), _jsx("tbody", { children: rows.map((r) => (_jsxs("tr", { children: [_jsx("th", { scope: "row", children: r.name }), columns.map((c) => {
                                const cell = r.cells[c.id];
                                const where = `${r.text}, ${c.name}`;
                                if (!cell) {
                                    return (_jsx("td", { children: _jsx("span", { className: "cap-matrix-none", role: "img", "aria-label": `${where}: ${emptyLabel}`, title: emptyLabel, children: "\u00B7" }) }, c.id));
                                }
                                const words = `${where}: ${cell.label}${cell.reason ? `. ${cell.reason}` : ""}`;
                                return (_jsx("td", { children: _jsx("span", { className: "cap-matrix-mark cap-status", "data-tone": cell.tone, role: "img", "aria-label": words, title: words, children: _jsx(Glyph, { name: cell.glyph ?? cell.tone }) }) }, c.id));
                            })] }, r.id))) })] }) }));
}
// The key under a matrix: each status's glyph and word, so the marks read without hovering.
export function MatrixKey({ items, }) {
    return (_jsx("ul", { className: "cap-matrix-key", children: items.map((i) => (_jsx("li", { children: _jsxs("span", { className: "cap-status", "data-tone": i.tone, children: [_jsx(Glyph, { name: i.glyph ?? i.tone }), i.label] }) }, i.label))) }));
}
