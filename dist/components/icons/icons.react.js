import { jsx as _jsx } from "react/jsx-runtime";
import { ICONS, SOCIAL } from "./icons.js";
export { ICONS, SOCIAL } from "./icons.js";
// One icon. Hidden from assistive technology (the button or link around it carries the name), or,
// with `label`, an image named by it. A drawing the set lacks passes its own `d` (and `box` for a
// grid other than 24, as Carrel's 16-unit menu).
export function Icon(props) {
    const social = "name" in props && props.name in SOCIAL;
    const d = "name" in props
        ? social
            ? SOCIAL[props.name]
            : ICONS[props.name]
        : props.d;
    const box = "box" in props && props.box ? props.box : 24;
    const fill = social || ("fill" in props && props.fill);
    return (_jsx("svg", { className: props.className ? `cap-icon ${props.className}` : "cap-icon", viewBox: `0 0 ${box} ${box}`, "data-fill": fill ? "" : undefined, role: props.label ? "img" : undefined, "aria-label": props.label, "aria-hidden": props.label ? undefined : true, focusable: "false", children: _jsx("path", { d: d }) }));
}
