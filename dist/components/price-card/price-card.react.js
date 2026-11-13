import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// The HTML contract in price-card.md.
export function PriceCard({ name, price, unit, label, text, points, action, flag, featured, id, headingLevel: H = "h3", }) {
    return (_jsxs("li", { className: "cap-price-card", id: id, "data-featured": featured ? "" : undefined, children: [flag ? _jsx("span", { className: "cap-price-card-flag", children: flag }) : null, _jsx(H, { className: "cap-price-card-name", children: name }), _jsxs("p", { className: "cap-price-card-price", children: [_jsx("span", { className: "cap-price-card-amount", children: price }), unit ? _jsx("span", { className: "cap-price-card-unit", children: unit }) : null] }), label ? _jsx("p", { className: "cap-price-card-label", children: label }) : null, text ? _jsx("p", { className: "cap-price-card-text", children: text }) : null, points?.length ? (_jsx("ul", { className: "cap-price-card-points", "aria-label": "Included", children: points.map((p, i) => (_jsx("li", { children: p }, i))) })) : null, action ? _jsx("div", { className: "cap-price-card-action", children: action }) : null] }));
}
export function PriceGrid({ children, label }) {
    return (_jsx("ul", { className: "cap-price-grid", "aria-label": label, children: children }));
}
export function PlanChoice({ name, legend, options, defaultValue, value, onChange, required, }) {
    return (_jsxs("fieldset", { className: "cap-plan-choice", children: [_jsx("legend", { children: legend }), _jsx("div", { className: "cap-plan-choice-options", children: options.map((o) => (_jsxs("label", { className: "cap-plan-option", children: [_jsx("input", { type: "radio", name: name, value: o.value, disabled: o.disabled, required: required, ...(value !== undefined
                                ? { checked: value === o.value, onChange: () => onChange?.(o.value) }
                                : { defaultChecked: defaultValue === o.value }) }), _jsx("span", { className: "cap-plan-option-name", children: o.name }), o.price ? _jsx("span", { className: "cap-plan-option-price", children: o.price }) : null] }, o.value))) })] }));
}
