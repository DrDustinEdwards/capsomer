import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useId } from "react";
export function Segmented({ legend, hideLegend = false, options, value, onChange, name, describedBy, size = "default", orientation = "horizontal", fill = false, invalid = false }) {
    const own = useId();
    if ((options.length < 2 || options.length > 5))
        console.warn("Segmented: use it for two to five options; a select or a combobox for more.");
    return (_jsxs("fieldset", { className: "cap-seg", "aria-describedby": describedBy, children: [_jsx("legend", { className: hideLegend ? "cap-sr-only" : undefined, children: legend }), _jsx("div", { className: "cap-seg-options", "data-size": size === "default" ? undefined : size, "data-orientation": orientation === "vertical" ? "vertical" : undefined, "data-fill": fill ? "" : undefined, children: options.map((o) => (_jsxs("label", { children: [_jsx("input", { type: "radio", name: name ?? own, value: o.value, checked: value === o.value, disabled: o.disabled, "aria-invalid": invalid || undefined, onChange: () => onChange(o.value) }), " ", o.label] }, o.value))) })] }));
}
