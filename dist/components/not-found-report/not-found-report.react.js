import { Fragment as _Fragment, jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { Empty } from "../empty/empty.react.js";
import { Panel } from "../panel/panel.react.js";
import { Row, RowList } from "../row-list/row-list.react.js";
import { Segmented } from "../segmented/segmented.react.js";
import { Spinner } from "../skeleton/skeleton.react.js";
import { Status } from "../status/status.react.js";
import { Time } from "../time/time.react.js";
import { hitsWord, probesLine, referrerLine } from "./not-found-report.js";
// The paths a site was asked for and does not have, most hits first, with who linked to each, so
// a broken link or a moved page can be fixed.
export function NotFoundReport({ rows, days, windows, onWindow, title = "404s", src, probes, reason, loading = false, actions, now, }) {
    const probeText = probesLine(probes);
    const source = (_jsxs(_Fragment, { children: [src ?? `Last ${days} days`, probeText ? `; ${probeText}` : null] }));
    const control = windows && windows.length > 1 && onWindow ? (_jsx(Segmented, { legend: "Period", hideLegend: true, size: "sm", value: String(days), onChange: (v) => onWindow(Number(v)), options: windows.map((w) => ({ value: String(w), label: `${w} days` })) })) : undefined;
    if (loading)
        return (_jsx(Panel, { title: title, src: source, actions: control, className: "cap-nf", children: _jsx(Spinner, { label: "Reading the 404 counts" }) }));
    if (reason)
        return (_jsx(Panel, { title: title, src: source, actions: control, className: "cap-nf", children: _jsxs("p", { className: "cap-nf-reason", children: [_jsx(Status, { tone: "nodata", children: "No data" }), " ", reason] }) }));
    return (_jsx(Panel, { title: title, count: rows.length, src: source, actions: control, flush: true, className: "cap-nf", children: rows.length === 0 ? (_jsxs(Empty, { kind: "all-clear", flush: true, title: _jsx(Status, { tone: "ok", children: "All clear" }), children: ["No missing pages in the last ", days, " days."] })) : (_jsx(RowList, { label: "Missing paths, most hits first", children: rows.map((row) => (_jsx(Row, { title: _jsx("code", { className: "cap-nf-path", children: row.path }), detail: `Linked from: ${referrerLine(row.referrers)}`, meta: _jsxs("span", { className: "cap-nf-meta", children: [_jsx("span", { children: hitsWord(row.hits) }), row.lastSeen ? (_jsxs("span", { children: ["last ", _jsx(Time, { at: row.lastSeen, now: now })] })) : null] }), actions: actions?.(row) }, row.path))) })) }));
}
