import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useRef } from "react";
import { Field, InputGroupAddon } from "../field/field.react.js";
import { enhance } from "./date-picker.js";
const CALENDAR = (_jsxs("svg", { viewBox: "0 0 16 16", "aria-hidden": "true", focusable: "false", children: [_jsx("rect", { x: "2.5", y: "3.5", width: "11", height: "10", rx: "1.5", fill: "none", stroke: "currentColor", strokeWidth: "1.5" }), _jsx("path", { d: "M2.5 6.5h11M5.5 2v3M10.5 2v3", fill: "none", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round" })] }));
// A date picker: the text input with a calendar button, as on the doc page. The calendar is the
// behavior module's (a choice sets the input's value as typing would, so onChange hears it);
// with no script the input takes the date as typed.
export function DatePicker(props) {
    const { label, help, error, announce, required, min, max, className: _c, ...rest } = props;
    const ref = useRef(null);
    useEffect(() => (ref.current ? enhance(ref.current.parentNode ?? document) : undefined), []);
    return (_jsx(Field, { label: label, help: help, error: error, announce: announce, required: required, children: (p) => (_jsx("div", { className: "cap-date-picker", "data-cap": "date-picker", ref: ref, children: _jsxs("div", { className: "cap-input-group", children: [_jsx("input", { ...rest, ...p, className: "cap-input", pattern: "\\d{4}-\\d{1,2}-\\d{1,2}", autoComplete: "off", "data-min": min, "data-max": max }), _jsx(InputGroupAddon, { align: "inline-end", children: _jsx("button", { type: "button", className: "cap-btn", "data-size": "xs", "data-variant": "quiet", "data-icon-only": true, "data-cap-part": "open", "aria-label": "Choose date", hidden: true, children: CALENDAR }) })] }) })) }));
}
