import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { compareFigures } from "./delta.js";
export { compareFigures, deltaText, UNCHANGED_BELOW_PCT } from "./delta.js";
// The move beside a figure: an arrow and a percent, green when it is better and red when worse,
// "no change" under the threshold, nothing when there is nothing to compare. The arrow is hidden;
// the word "up" or "down" is read out, so the move is never color or shape alone.
export function Delta(props) {
    const d = "delta" in props ? props.delta : compareFigures(props.current, props.previous, props);
    if (d.kind === "none")
        return null;
    if (d.kind === "unchanged")
        return (_jsx("span", { className: "cap-delta", "data-kind": "unchanged", children: "no change" }));
    return (_jsxs("span", { className: "cap-delta", "data-kind": "moved", "data-tone": d.tone, "data-direction": d.direction, children: [_jsx("span", { className: "cap-delta-arrow", "aria-hidden": "true", children: d.direction === "up" ? "▲" : "▼" }), _jsxs("span", { className: "cap-sr-only", children: [d.direction, " "] }), d.pct, "%"] }));
}
