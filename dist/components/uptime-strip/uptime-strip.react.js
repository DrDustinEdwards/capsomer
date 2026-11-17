import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { LEGEND } from "./uptime-strip.js";
export { fromRing, padRing, uptimeOf, LEGEND } from "./uptime-strip.js";
/** The key after an uptime strip: each kind of slot drawn in its own shape beside its word. */
export function UptimeLegend({ label = "Key" }) {
    return (_jsx("ul", { className: "cap-uptime-legend", "aria-label": label, children: LEGEND.map(([key, word]) => (_jsxs("li", { children: [_jsx("span", { className: "cap-uptime-key", "data-key": key, "aria-hidden": "true" }), word] }, key))) }));
}
