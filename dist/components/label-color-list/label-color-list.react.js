import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// The pill and the list, which a page that shows labels loads; the editor, with its fields and
// select, is its own module (capsomer/react/label-color-editor), so showing a label loads none of it.
import { Pill } from "../status/status.react.js";
import { labelFor, seriesOf } from "./label-color-list.js";
// A value as the list names it: the label's word with its color as a dot. A value the list does
// not carry is shown as written, in an outline pill; an empty one shows nothing.
export function ColorLabelPill({ labels, value, unknownNote = " (not on the list)", }) {
    if (!value.trim())
        return null;
    const label = labelFor(labels, value);
    if (!label) {
        return (_jsxs(Pill, { variant: "outline", children: [value.trim(), _jsx("span", { className: "cap-sr-only", children: unknownNote })] }));
    }
    return _jsx(Pill, { series: seriesOf(label.color), children: label.label });
}
// The list as it reads: every label in order.
export function LabelColorList({ labels, label = "Labels, in order", }) {
    return (_jsx("ul", { className: "cap-color-label-list", "aria-label": label, children: labels.map((l) => (_jsx("li", { children: _jsx(ColorLabelPill, { labels: labels, value: l.label }) }, l.label))) }));
}
