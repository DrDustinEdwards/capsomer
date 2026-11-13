import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { NumberField } from "../field/field.react.js";
import { Select } from "../select/select.react.js";
// The HTML contract in scale-control.md. The quantity is React state for its steppers; the values
// reach the page through the form's GET, so the state lives in the address.
export function ScaleControl(props) {
    const { action, label, name, value, min = 1, max = 1000, step = 1, units, submitLabel = "Scale", formLabel, children, } = props;
    const [count, setCount] = useState(value);
    return (_jsxs("form", { className: "cap-scale-control cap-field-row", method: "get", action: action, "aria-label": formLabel, children: [_jsx(NumberField, { label: label, name: name, value: count, onChange: setCount, min: min, max: max, step: step }), units ? (_jsxs("div", { className: "cap-field", children: [_jsx("label", { className: "cap-field-label", htmlFor: `${name}-${units.name}`, children: units.label }), _jsx(Select, { id: `${name}-${units.name}`, name: units.name, options: units.options, defaultValue: units.value })] })) : null, children, _jsx("button", { type: "submit", className: "cap-btn", "data-variant": "secondary", children: submitLabel })] }));
}
