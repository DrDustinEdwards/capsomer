import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useId, useRef } from "react";
export function FilterChips({ label, options, value, onChange, count, size = "default", }) {
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
// Filters kept in the address, as links (no script needed): a labeled list of link chips, the
// current one marked aria-current="true" and drawn pressed, each with an optional count.
// `renderLink` draws a router link (capsomer/react/link Link); a plain a otherwise.
export function LinkChips({ label, showLabel = false, chips, size = "default", renderLink, }) {
    const labelId = useId();
    return (_jsxs("nav", { "aria-label": showLabel ? undefined : label, "aria-labelledby": showLabel ? labelId : undefined, className: showLabel ? "cap-chips" : undefined, children: [showLabel ? (_jsx("span", { className: "cap-chips-label", id: labelId, children: label })) : null, _jsx("ul", { className: "cap-chips", children: chips.map((c) => {
                    const props = {
                        href: c.href,
                        className: "cap-chip",
                        "aria-current": c.current ? "true" : undefined,
                        "data-size": size === "default" ? undefined : size,
                        children: (_jsxs(_Fragment, { children: [c.label, c.count === undefined ? null : _jsx("span", { className: "cap-chip-count", children: c.count })] })),
                    };
                    return (_jsx("li", { children: renderLink ? (renderLink(props)) : (_jsx("a", { href: props.href, className: props.className, "aria-current": props["aria-current"], "data-size": props["data-size"], children: props.children })) }, c.href));
                }) })] }));
}
// Checkbox chips (chips.md): a filter in a form that works with no script, each chip sending
// `name=value`, with an optional count. The fieldset's legend names the group.
export function CheckChips({ legend, name, options, checked, size = "default", }) {
    const on = new Set(checked);
    return (_jsxs("fieldset", { className: "cap-chips", children: [_jsx("legend", { className: "cap-chips-label", children: legend }), options.map((o) => (_jsxs("label", { className: "cap-chip", "data-size": size === "default" ? undefined : size, children: [_jsx("input", { className: "cap-chip-input", type: "checkbox", name: name, value: o.value, defaultChecked: on.has(o.value), disabled: o.disabled }), o.label, o.count === undefined ? null : _jsx("span", { className: "cap-chip-count", children: o.count })] }, o.value)))] }));
}
