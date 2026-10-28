import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { cloneElement, useId } from "react";
export function Field({ label, help, error, announce = false, required, orientation = "vertical", children }) {
    const base = useId();
    const controlId = children.props.id ?? `${base}-control`;
    const helpId = `${base}-help`;
    const errorId = `${base}-error`;
    const hasError = error != null && error !== false && error !== "";
    const describedBy = [hasError ? errorId : null, help ? helpId : null, children.props["aria-describedby"]].filter(Boolean).join(" ") || undefined;
    const isRequired = required ?? children.props.required;
    const control = cloneElement(children, {
        id: controlId,
        required: isRequired,
        "aria-describedby": describedBy,
        "aria-invalid": hasError ? true : undefined,
    });
    return (_jsxs("div", { className: "cap-field", "data-orientation": orientation === "vertical" ? undefined : orientation, "data-invalid": hasError ? "true" : undefined, children: [_jsxs("label", { className: "cap-field-label", htmlFor: controlId, children: [label, isRequired ? (_jsx("span", { className: "cap-field-required", "aria-hidden": "true", children: "Required" })) : null] }), help ? (_jsx("p", { className: "cap-field-help", id: helpId, children: help })) : null, control, _jsx("p", { className: "cap-field-error", id: errorId, role: hasError && announce ? "alert" : undefined, hidden: !hasError, children: hasError ? error : null })] }));
}
// A checkbox or radio with its label: the box is drawn by CSS. `indeterminate` is set on the
// element (it has no attribute). `variant="card"` makes the whole box the choice.
export function Check(props) {
    const { type = "checkbox", label, variant, indeterminate, className, ...rest } = props;
    return (_jsxs("label", { className: className ? `cap-check ${className}` : "cap-check", "data-variant": variant, children: [_jsx("input", { ...rest, type: type, ref: (el) => { if (el)
                    el.indeterminate = Boolean(indeterminate); } }), label] }));
}
// A slider (a native range input) whose track fills to the thumb: it sets --cap-range-fill
// from value, min and max. Label it as any input, with Field or aria-label.
export function Range(props) {
    const { value, min = 0, max = 100, className, style, ...rest } = props;
    const fill = max > min ? ((value - min) / (max - min)) * 100 : 0;
    return (_jsx("input", { ...rest, type: "range", min: min, max: max, value: value, className: className ? `cap-range ${className}` : "cap-range", style: { ...style, ["--cap-range-fill"]: `${fill.toFixed(2)}%` } }));
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
