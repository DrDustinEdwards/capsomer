import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useId, useRef } from "react";
export function FilterChips({ label, options, value, onChange, count, size = "default" }) {
    const labelId = useId();
    const first = useRef(null);
    if (options.length > 6)
        console.warn("FilterChips: chips hold at most six values; use a select or a combobox for more.");
    const pressed = new Set(value);
    // A pressed value that no option carries (from a shared address) still shows, pressed,
    // after the options, so a filter is never active without a chip to say so and release it.
    const known = new Set(options.map((o) => o.value));
    const extra = value.filter((v) => !known.has(v));
    const set = (next) => onChange([...options.map((o) => o.value), ...extra].filter((v) => next.has(v)));
    const toggle = (v) => {
        const next = new Set(pressed);
        if (next.has(v))
            next.delete(v);
        else
            next.add(v);
        set(next);
    };
    const clear = () => {
        set(new Set());
        // Clear hides itself; focus goes to the first chip rather than being lost.
        first.current?.focus();
    };
    return (_jsxs("div", { className: "cap-chips", role: "group", "aria-labelledby": labelId, children: [_jsx("span", { className: "cap-chips-label", id: labelId, children: label }), options.map((o, i) => (_jsx("button", { ref: i === 0 ? first : undefined, type: "button", className: "cap-chip", "data-size": size === "default" ? undefined : size, "aria-pressed": pressed.has(o.value), "aria-disabled": o.disabled || undefined, "data-value": o.value, onClick: () => (o.disabled ? undefined : toggle(o.value)), children: o.label }, o.value))), extra.map((v) => (_jsx("button", { type: "button", className: "cap-chip", "aria-pressed": "true", "data-value": v, onClick: () => toggle(v), children: v }, v))), _jsx("button", { type: "button", className: "cap-link-btn", "data-cap-part": "clear", hidden: pressed.size === 0, onClick: clear, children: "Clear" }), _jsx("span", { className: "cap-chips-count", role: "status", children: count })] }));
}
