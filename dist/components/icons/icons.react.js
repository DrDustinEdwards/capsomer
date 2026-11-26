import { jsx as _jsx } from "react/jsx-runtime";
export * from "./icons.js";
// One icon, drawn from its path (`box` for a grid other than 24). Hidden from assistive technology unless
// given a `label`. In a button, `data-icon` says which side of the label it sits on, so the button pulls its
// padding in on that side (button.css).
export function Icon(props) {
    const box = props.box || 24;
    return (_jsx("svg", { className: props.className ? `cap-icon ${props.className}` : "cap-icon", viewBox: `0 0 ${box} ${box}`, "data-fill": props.fill ? "" : undefined, role: props.label ? "img" : undefined, "aria-label": props.label, "aria-hidden": props.label ? undefined : true, focusable: "false", "data-icon": props["data-icon"], children: _jsx("path", { d: props.d }) }));
}
