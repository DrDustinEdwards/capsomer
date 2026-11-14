import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Check } from "../field/field.react.js";
// The HTML contract in price-card.md.
export function PriceCard({ name, price, unit, label, text, points, action, flag, featured, id, headingLevel: H = "h3", }) {
    return (_jsxs("li", { className: "cap-price-card", id: id, "data-featured": featured ? "" : undefined, children: [flag ? _jsx("span", { className: "cap-price-card-flag", children: flag }) : null, name ? _jsx(H, { className: "cap-price-card-name", children: name }) : null, _jsxs("p", { className: "cap-price-card-price", children: [_jsx("span", { className: "cap-price-card-amount", children: price }), unit ? _jsx("span", { className: "cap-price-card-unit", children: unit }) : null] }), label ? _jsx("p", { className: "cap-price-card-label", children: label }) : null, (Array.isArray(text) ? text : [text]).map((t, i) => t ? (_jsx("p", { className: "cap-price-card-text", children: t }, i)) : null), points?.length ? (_jsx("ul", { className: "cap-price-card-points", "aria-label": "Included", children: points.map((p, i) => (_jsx("li", { children: p }, i))) })) : null, action ? _jsx("div", { className: "cap-price-card-action", children: action }) : null] }));
}
export function PriceGrid({ children, label }) {
    return (_jsx("ul", { className: "cap-price-grid", "aria-label": label, children: children }));
}
export function PlanChoice({ name, legend, options, defaultValue, value, onChange, required, hideLegend, className, }) {
    return (_jsxs("fieldset", { className: className ? `cap-plan-choice ${className}` : "cap-plan-choice", children: [_jsx("legend", { className: hideLegend ? "cap-sr-only" : undefined, children: legend }), _jsx("div", { className: "cap-plan-choice-options", children: options.map((o) => (_jsx(Check, { type: "radio", variant: "card", name: name, value: o.value, disabled: o.disabled, required: required, ...(value !== undefined
                        ? { checked: value === o.value, onChange: () => onChange?.(o.value) }
                        : { defaultChecked: defaultValue === o.value }), label: _jsxs("span", { className: "cap-plan-option-text", children: [_jsx("span", { className: "cap-plan-option-name", children: o.name }), o.price ? _jsx("span", { className: "cap-plan-option-price", children: o.price }) : null, o.note ? _jsx("span", { className: "cap-plan-option-note", children: o.note }) : null] }) }, o.value))) })] }));
}
