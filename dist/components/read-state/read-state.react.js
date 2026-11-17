import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { Banner } from "../banner/banner.react.js";
import { Empty } from "../empty/empty.react.js";
import { Spinner } from "../skeleton/skeleton.react.js";
import { Status } from "../status/status.react.js";
import { Time } from "../time/time.react.js";
export function ReadState({ what, loading, error, hasData, empty, onRetry, children, }) {
    if (!hasData && loading)
        return (_jsx("div", { className: "cap-read-state", "data-state": "reading", children: _jsx(Spinner, { layout: "page", label: `Reading ${what}` }) }));
    if (!hasData && error)
        return (_jsx(Empty, { kind: "failed", title: `Could not read ${what}`, action: onRetry ? (_jsx("button", { type: "button", className: "cap-btn", onClick: onRetry, children: "Try again" })) : undefined, children: error }));
    if (!hasData)
        return (_jsxs("p", { className: "cap-read-state", "data-state": "nothing-yet", children: [_jsx(Status, { tone: "nodata", children: "No data" }), " ", empty ?? "No read yet."] }));
    return (_jsxs(_Fragment, { children: [error ? (_jsxs(Banner, { tone: "warn", children: ["Could not read ", what, " again: ", error, ". Showing the last answer."] })) : null, children] }));
}
// The source line's "read 5 minutes ago · Read again": how old the answer is, and the one way to
// read it again. Goes in a panel's `src`.
export function ReadAgain({ at, reading, onRead, now }) {
    return (_jsxs("span", { className: "cap-read-again", children: [at !== undefined ? (_jsxs("span", { children: ["Read ", _jsx(Time, { at: at, now: now })] })) : null, _jsx("button", { type: "button", className: "cap-btn", "data-size": "sm", "aria-busy": reading || undefined, disabled: reading, onClick: onRead, children: reading ? "Reading again" : "Read again" })] }));
}
export function SourceState({ src, children }) {
    if (src.ok)
        return _jsx(_Fragment, { children: children(src.data) });
    if (src.kind === "empty")
        return (_jsx("p", { className: "cap-read-state", "data-state": "empty", children: src.reason }));
    return (_jsxs("p", { className: "cap-read-state", "data-state": src.kind, children: [_jsx(Status, { tone: src.kind === "error" ? "warn" : "nodata", children: src.kind === "error" ? "Not read" : "No data" }), " ", src.reason] }));
}
