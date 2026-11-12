import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { Status } from "../status/status.react.js";
// The answer to "is anything wrong?" in one line: "All good" with what that covers, or how many
// problems and the first few by name, each a way to where it is fixed. The worst tone leads.
export function Verdict({ problems, okLabel = "All good", okNote, noun = ["problem", "problems"], named = 3, more, unknown, className, }) {
    const cls = className ? `cap-verdict ${className}` : "cap-verdict";
    if (unknown != null) {
        return (_jsxs("p", { className: cls, "data-verdict": "unknown", children: [_jsx(Status, { tone: "nodata", children: "Not known" }), _jsx("span", { className: "cap-verdict-note", children: unknown })] }));
    }
    if (problems.length === 0) {
        return (_jsxs("p", { className: cls, "data-verdict": "ok", children: [_jsx(Status, { tone: "ok", children: okLabel }), okNote != null && _jsx("span", { className: "cap-verdict-note", children: okNote })] }));
    }
    const tone = problems.some((p) => p.tone === "crit") ? "crit" : "warn";
    const shown = problems.slice(0, Math.max(1, named));
    const rest = problems.length - shown.length;
    return (_jsxs("p", { className: cls, "data-verdict": "problems", children: [_jsxs(Status, { tone: tone, children: [problems.length, " ", problems.length === 1 ? noun[0] : noun[1], ":"] }), _jsxs("span", { className: "cap-verdict-list", children: [shown.map((p, i) => (_jsxs("span", { children: [p.label, i < shown.length - 1 ? _jsx("span", { "aria-hidden": "true", children: " \u00B7 " }) : null, i < shown.length - 1 ? _jsx("span", { className: "cap-sr-only", children: ", " }) : null] }, p.key))), rest > 0 ? (_jsxs(_Fragment, { children: [" and ", more ? more(rest) : `${rest} more`] })) : null] })] }));
}
