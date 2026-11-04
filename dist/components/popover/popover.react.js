import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { createContext, useContext, useEffect, useId, useRef } from "react";
import { enhance } from "./popover.js";
const Ctx = createContext({ id: "", kind: "dialog" });
export function Popover({ kind = "dialog", children }) {
    const id = useId();
    const ref = useRef(null);
    useEffect(() => (ref.current ? enhance(ref.current) : undefined), []);
    return (_jsx(Ctx.Provider, { value: { id, kind }, children: _jsx("span", { "data-cap": "popover", ref: ref, children: children }) }));
}
export function PopoverTrigger({ className = "cap-btn", type = "button", ...props }) {
    const { id, kind } = useContext(Ctx);
    return kind === "tooltip" ? (_jsx("button", { type: type, className: className, "aria-describedby": id, "data-popover-trigger": "", ...props })) : (_jsx("button", { type: type, className: className, popoverTarget: id, "aria-haspopup": "dialog", "aria-expanded": "false", ...props }));
}
export function PopoverContent({ side, align, offset, size, arrow, className, children, ...props }) {
    const { id, kind } = useContext(Ctx);
    const tip = kind === "tooltip";
    return (_jsxs("div", { className: className ? `cap-popover ${className}` : "cap-popover", id: id, popover: tip ? "manual" : "auto", role: tip ? "tooltip" : "dialog", "aria-labelledby": tip || props["aria-label"] ? undefined : `${id}-title`, "data-variant": tip ? "tooltip" : undefined, "data-side": side, "data-align": align, "data-offset": offset, "data-size": size, ...props, children: [children, arrow ? _jsx("span", { className: "cap-popover-arrow", "aria-hidden": "true" }) : null] }));
}
export function PopoverHeader({ className, ...props }) {
    return _jsx("div", { className: className ? `cap-popover-header ${className}` : "cap-popover-header", ...props });
}
// Names the dialog: PopoverContent points aria-labelledby at it.
export function PopoverTitle({ className, ...props }) {
    const { id } = useContext(Ctx);
    return _jsx("h2", { className: className ? `cap-popover-title ${className}` : "cap-popover-title", id: `${id}-title`, ...props });
}
export function PopoverDescription({ className, ...props }) {
    return _jsx("p", { className: className ? `cap-popover-description ${className}` : "cap-popover-description", ...props });
}
