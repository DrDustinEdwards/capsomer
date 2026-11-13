import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useId, useLayoutEffect, useRef, } from "react";
import { morphFrom } from "./button.js";
// The class and data attributes for a look, and the accessible name an icon alone takes (its
// `label`, else the given aria-label), warning when an icon-only control has neither.
export function buttonAttrs(look, className) {
    const { variant = "default", size = "default", iconOnly = false, wrap = false } = look;
    const name = iconOnly ? (look.label ?? look["aria-label"]) : look["aria-label"];
    if (iconOnly && !name)
        console.warn("Capsomer: an icon-only button or link needs a label.");
    return {
        className: className ? `cap-btn ${className}` : "cap-btn",
        "data-variant": variant === "default" ? undefined : variant,
        "data-size": size === "default" ? undefined : size,
        "data-icon-only": iconOnly ? "" : undefined,
        "data-wrap": wrap ? "" : undefined,
        "data-block": look.block ? "" : undefined,
        "aria-label": name,
    };
}
export function Button(props) {
    const { variant = "default", size = "default", pending = false, pendingLabel, wrap = false, block = false, disabledReason, iconOnly = false, label, morph = false, children, type = "button", onClick, className, ...rest } = props;
    const reasonId = useId();
    const disabled = disabledReason != null && disabledReason !== false;
    const describedBy = [rest["aria-describedby"], disabled ? reasonId : null].filter(Boolean).join(" ") || undefined;
    // The morph: after React writes a new label, animate from the last width and a copy of the
    // last label (button.ts).
    const labelRef = useRef(null);
    const last = useRef(null);
    useLayoutEffect(() => {
        const el = labelRef.current;
        const button = el?.parentElement;
        if (!morph || !el || !button)
            return;
        const prev = last.current;
        const text = el.textContent ?? "";
        const width = prev && prev.text !== text ? morphFrom(button, prev.width, prev.copy) : button.offsetWidth;
        last.current = { text, width, copy: el.cloneNode(true) };
    });
    const click = (e) => {
        if (disabled || pending) {
            e.preventDefault();
            return;
        }
        onClick?.(e);
    };
    const button = (_jsxs("button", { ...rest, type: type, ...buttonAttrs({ variant, size, iconOnly, wrap, block, label, "aria-label": rest["aria-label"] }, className), "aria-disabled": disabled ? true : undefined, "aria-describedby": describedBy, "aria-busy": pending ? true : undefined, onClick: click, children: [pending ? _jsx("span", { className: "cap-btn-spinner", "aria-hidden": "true" }) : null, pending || morph ? (_jsx("span", { className: "cap-btn-label", ref: labelRef, children: children })) : (children)] }));
    const live = pendingLabel === undefined ? null : (_jsx("span", { className: "cap-sr-only", role: "status", children: pending ? pendingLabel : "" }));
    if (!disabled && !live)
        return button;
    return (_jsxs(_Fragment, { children: [button, live, disabled ? (_jsx("span", { className: "cap-btn-reason", id: reasonId, children: disabledReason })) : null] }));
}
// Buttons sharing one edge. `orientation` is horizontal unless set.
export function ButtonGroup(props) {
    const { label, orientation = "horizontal", children, className } = props;
    return (_jsx("div", { role: "group", "aria-label": label, className: className ? `cap-btn-group ${className}` : "cap-btn-group", "data-orientation": orientation === "vertical" ? "vertical" : undefined, children: children }));
}
// Static text that sits in a group beside the buttons.
export function ButtonGroupText(props) {
    return _jsx("span", { className: "cap-btn-group-text", children: props.children });
}
