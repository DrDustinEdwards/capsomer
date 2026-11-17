import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// The label list's editor (label-color-list.md), in its own module so a page that only shows
// labels (capsomer/react/label-color-list) does not load Field and Select.
import { useState } from "react";
import { Field } from "../field/field.react.js";
import { Select } from "../select/select.react.js";
import { Pill } from "../status/status.react.js";
import { COLOR_NAMES, MAX_LABEL_LENGTH, MAX_LABELS, editRows, seriesOf, } from "../label-color-list/label-color-list.js";
// The editor's rows, inside the app's own form: `label` and `color` repeated, in order (pair them
// with rowsFromForm, check them with cleanLabels). Clearing a label removes it.
export function LabelColorEditor({ labels, spare = 2, max = MAX_LABELS, nameLabel = (n) => `Label ${n}`, colorLabel = (n) => `Color ${n}`, }) {
    const rows = editRows(labels, { spare, max });
    const [colors, setColors] = useState(() => rows.map((r) => r.color));
    return (_jsx("ol", { className: "cap-color-label-edit", children: rows.map((row, i) => (_jsxs("li", { children: [_jsx(Field, { label: nameLabel(i + 1), children: _jsx("input", { className: "cap-input", name: "label", defaultValue: row.label, maxLength: MAX_LABEL_LENGTH, autoComplete: "off" }) }), _jsx(Field, { label: colorLabel(i + 1), children: _jsx(Select, { name: "color", value: String(colors[i] ?? row.color), onChange: (e) => {
                            const value = Number(e.currentTarget.value);
                            setColors((c) => c.map((x, k) => (k === i ? value : x)));
                        }, options: COLOR_NAMES.map((name, k) => ({ value: String(k + 1), label: name })) }) }), _jsx(Pill, { series: seriesOf(colors[i] ?? row.color), children: null })] }, i))) }));
}
