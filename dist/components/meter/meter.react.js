import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useId, useLayoutEffect, useRef } from "react";
import { setBar, toneFor } from "./meter.js";
import { Glyph } from "../status/status.react.js";
const WORDS = { warn: "Near the limit", crit: "Limit reached" };
export function Meter({ label, value, max, min = 0, valueText, display, tone, warnAt, critAt, words, threshold, projected, size, measuring = false, note, className, as: Root = "div", after }) {
    const bar = useRef(null);
    const labelId = useId();
    const root = ["cap-meter", className].filter(Boolean).join(" ");
    // Positions go through the CSSOM, never a style prop (style-src 'self').
    useLayoutEffect(() => {
        if (bar.current && value !== null && !measuring)
            setBar(bar.current, { value, max, min, projected, threshold });
    }, [value, max, min, projected, threshold, measuring]);
    if (value === null || measuring) {
        const what = measuring ? "Measuring" : "No data";
        return (_jsxs(Root, { className: root, "data-size": size, "data-tone": measuring ? undefined : "nodata", "data-state": measuring ? "indeterminate" : undefined, "aria-busy": measuring || undefined, children: [_jsx("span", { className: "cap-meter-label", children: label }), _jsx("span", { className: "cap-meter-value", children: _jsxs("span", { className: "cap-status", "data-tone": "nodata", children: [_jsx(Glyph, { name: "nodata" }), what] }) }), _jsx("span", { className: "cap-meter-bar", "aria-hidden": "true", children: _jsx("span", { className: "cap-meter-fill" }) }), note ? _jsx("span", { className: "cap-meter-note", children: note }) : null, after] }));
    }
    const earned = tone ?? (warnAt != null || critAt != null ? toneFor(value, max, { min, warnAt, critAt }) : undefined);
    const shown = earned === "warn" || earned === "crit" ? earned : undefined;
    const word = shown && (words !== undefined || tone === undefined) ? (words ?? WORDS)[shown] : null;
    return (_jsxs(Root, { className: root, "data-size": size, "data-tone": earned, children: [_jsx("span", { className: "cap-meter-label", id: labelId, children: label }), shown && word ? (_jsxs("span", { className: "cap-status", "data-tone": shown, children: [_jsx(Glyph, { name: shown }), word] })) : null, _jsx("span", { className: "cap-meter-value", children: display ?? `${value.toLocaleString("en-US")} of ${max.toLocaleString("en-US")}` }), _jsx("span", { className: "cap-meter-bar", ref: bar, role: "meter", "aria-labelledby": labelId, "aria-valuemin": min, "aria-valuemax": max, "aria-valuenow": value, "aria-valuetext": valueText, "data-projected": projected, "data-threshold": threshold, children: _jsx("span", { className: "cap-meter-fill" }) }), note ? _jsx("span", { className: "cap-meter-note", children: note }) : null, after] }));
}
