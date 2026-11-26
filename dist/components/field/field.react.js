import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { cloneElement, useId, } from "react";
import { rangeFill } from "../range-slider/range-slider.js";
export function Field({ label, labelHidden = false, help, error, announce = false, required, orientation = "vertical", children, after, action, helpPlacement = "before", showRequired = true, id, size, }) {
    const base = useId();
    const own = typeof children === "function" ? {} : children.props;
    const controlId = own.id ?? id ?? `${base}-control`;
    const helpId = `${base}-help`;
    const errorId = `${base}-error`;
    const hasError = error != null && error !== false && error !== "";
    const describedBy = [hasError ? errorId : null, help ? helpId : null, own["aria-describedby"]]
        .filter(Boolean)
        .join(" ") || undefined;
    const isRequired = required ?? own.required;
    const props = {
        id: controlId,
        required: isRequired,
        "aria-describedby": describedBy,
        "aria-invalid": hasError ? true : undefined,
    };
    const input = typeof children === "function" ? children(props) : cloneElement(children, props);
    const control = action ? (_jsxs("div", { className: "cap-field-row", children: [input, action] })) : (input);
    const helpText = help ? (_jsx("p", { className: "cap-field-help", id: helpId, children: help })) : null;
    return (_jsxs("div", { className: "cap-field", "data-orientation": orientation === "vertical" ? undefined : orientation, "data-invalid": hasError ? "true" : undefined, "data-size": size, children: [_jsxs("label", { className: labelHidden ? "cap-field-label cap-sr-only" : "cap-field-label", htmlFor: controlId, children: [label, isRequired && showRequired ? (_jsx("span", { className: "cap-field-required", "aria-hidden": "true", children: "Required" })) : null] }), helpPlacement === "before" ? helpText : null, control, helpPlacement === "after" ? helpText : null, after, _jsx("p", { className: "cap-field-error", id: errorId, role: hasError && announce ? "alert" : undefined, hidden: !hasError, children: hasError ? error : null })] }));
}
// A checkbox or radio with its label: the box is drawn by CSS. `indeterminate` is set on the
// element (it has no attribute). `variant="card"` makes the whole box the choice.
export function Check(props) {
    const { type = "checkbox", label, variant, indeterminate, className, ...rest } = props;
    return (_jsxs("label", { className: className ? `cap-check ${className}` : "cap-check", "data-variant": variant, children: [_jsx("input", { ...rest, type: type, ref: (el) => {
                    if (el)
                        el.indeterminate = Boolean(indeterminate);
                } }), label] }));
}
// A native range input whose track fills to the thumb (--cap-range-fill). Label it as any input.
export function Range(props) {
    const { value, min = 0, max = 100, className, style, ...rest } = props;
    return (_jsx("input", { ...rest, type: "range", min: min, max: max, value: value, className: className ? `cap-range ${className}` : "cap-range", style: { ...style, ["--cap-range-fill"]: rangeFill(value, min, max) } }));
}
// An input with addons inside one edge. Put the control inside as <input className="cap-input" />.
export function InputGroup(props) {
    return (_jsx("div", { className: "cap-input-group", role: "group", "aria-label": props.label, children: props.children }));
}
export function InputGroupAddon(props) {
    return (_jsx("div", { className: "cap-input-addon", "data-align": props.align ?? "inline-start", onClick: (e) => {
            if (e.target.closest("button, a, input, select, textarea"))
                return;
            e.currentTarget.parentElement?.querySelector("input, textarea")?.focus();
        }, children: props.children }));
}
// Splits a field part's props into the words Field takes and the rest, for the control.
export function splitField(props) {
    const { label, labelHidden, help, error, announce, required, helpPlacement, showRequired, ...rest } = props;
    const field = {
        label,
        labelHidden,
        help,
        error,
        announce,
        required,
        helpPlacement,
        showRequired,
    };
    return [field, rest];
}
export { PasswordInput, CharacterCount, NumberField, SearchField } from "./field-inputs.react.js";
export { DateInput, FieldSet, TextField, RangeField, SpanField, SlugField, MoneyField, DateTimeField, } from "./field-composed.react.js";
