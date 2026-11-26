import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useCallback, useEffect, useId, useState } from "react";
import { attach } from "./tooltip.js";
// Whether the tip is open is the platform's popover state, not React state: React renders
// the same markup either way, and the behavior module shows and hides it.
export function Tooltip({ tip, children, side = "top", align, arrow = true, as: Tip = "div", }) {
    const id = useId();
    const [trigger, setTrigger] = useState(null);
    const [tipEl, setTipEl] = useState(null);
    const ref = useCallback((el) => setTrigger(el), []);
    const tipRef = useCallback((el) => setTipEl(el), []);
    useEffect(() => {
        if (trigger && tipEl)
            return attach(trigger, tipEl);
    }, [trigger, tipEl]);
    return (_jsxs(_Fragment, { children: [children({ ref, "aria-describedby": id }), _jsxs(Tip, { className: "cap-popover", "data-cap": "tooltip", "data-variant": "tooltip", "data-side": side, "data-align": align, id: id, role: "tooltip", popover: "manual", ref: tipRef, children: [tip, arrow ? _jsx("span", { className: "cap-popover-arrow", "aria-hidden": "true" }) : null] })] }));
}
