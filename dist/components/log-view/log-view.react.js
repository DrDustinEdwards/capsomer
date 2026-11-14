import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { Status } from "../status/status.react.js";
import { DataTable } from "../table/table.react.js";
// Lines from a log or a source's top list (paths and their failures, crawlers and their hits): the
// table's DataTable, which scrolls sideways inside its own box, mono for raw values and tabular figures
// for counts, a note when the source cut the list short, and a stated None when there are none.
export function LogView({ caption, showCaption = false, columns, rows, rowKey, truncated = false, truncatedNote = "The top lines only; more may exist.", note, emptyLabel = "None", empty, }) {
    return (_jsxs("div", { className: "cap-log", children: [note != null && _jsx("p", { className: "cap-log-note", children: note }), rows.length === 0 ? (_jsxs("p", { className: "cap-log-empty", children: [_jsx(Status, { tone: "ok", children: emptyLabel }), " ", empty] })) : (_jsxs(_Fragment, { children: [_jsx(DataTable, { caption: caption, captionHidden: !showCaption, density: "compact", columns: columns.map((c) => ({
                            key: c.key,
                            header: c.label,
                            num: c.num,
                            cell: c.mono ? (r) => _jsx("span", { className: "cap-log-mono", children: c.cell(r) }) : c.cell,
                        })), rows: rows, rowKey: rowKey, empty: empty }), truncated && _jsx("p", { className: "cap-log-note", children: truncatedNote })] }))] }));
}
