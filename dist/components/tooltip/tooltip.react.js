import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { attach } from "./tooltip.js";
// Whether the tip is open is the platform's popover state, not React state: React renders
// the same markup either way, and the behaviour module shows and hides it.
export function Tooltip({ tip, children, side = "top", align, arrow = true }) {
    const id = useId();
    const tipRef = useRef(null);
    const [trigger, setTrigger] = useState(null);
    const ref = useCallback((el) => setTrigger(el), []);
    useEffect(() => {
        if (trigger && tipRef.current)
            return attach(trigger, tipRef.current);
    }, [trigger]);
    return (_jsxs(_Fragment, { children: [children({ ref, "aria-describedby": id }), _jsxs("div", { className: "cap-popover", "data-cap": "tooltip", "data-variant": "tooltip", "data-side": side, "data-align": align, id: id, role: "tooltip", popover: "manual", ref: tipRef, children: [tip, arrow ? _jsx("span", { className: "cap-popover-arrow", "aria-hidden": "true" }) : null] })] }));
}
