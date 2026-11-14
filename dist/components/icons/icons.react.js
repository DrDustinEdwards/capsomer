import { jsx as _jsx } from "react/jsx-runtime";
export * from "./icons.js";
// One icon, drawn from its path: `<Icon d={iconSearch} />`, a social mark `<Icon {...markX} />`, or a
// drawing the set lacks (`box` for a grid other than 24, as Carrel's 16-unit menu). Each drawing is
// its own export of icons.ts, so an app's bundle holds only the ones it imports. Hidden from
// assistive technology (the button or link around it carries the name), or, with `label`, an image
// named by it. In a button, `data-icon` says which side of the label it sits on, so the button pulls
// its padding in on that side (button.css).
export function Icon(props) {
    const box = props.box || 24;
    return (_jsx("svg", { className: props.className ? `cap-icon ${props.className}` : "cap-icon", viewBox: `0 0 ${box} ${box}`, "data-fill": props.fill ? "" : undefined, role: props.label ? "img" : undefined, "aria-label": props.label, "aria-hidden": props.label ? undefined : true, focusable: "false", "data-icon": props["data-icon"], children: _jsx("path", { d: props.d }) }));
}
