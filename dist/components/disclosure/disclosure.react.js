import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useId, useState } from "react";
// A show/hide section: native <details>, so it works before JavaScript and with none.
export function Disclosure({ summary, children, name, defaultOpen = false, variant }) {
    return (_jsxs("details", { className: "cap-disclosure", "data-variant": variant, name: name, open: defaultOpen || undefined, children: [_jsx("summary", { children: summary }), _jsx("div", { className: "cap-disclosure-body", children: children })] }));
}
// A group row in a list: a button that shows or hides the rows it groups.
export function Group({ label, count, children, defaultExpanded = false, holdsCritical = false, headingLevel }) {
    const id = useId();
    const [open, setOpen] = useState(defaultExpanded || holdsCritical);
    const expanded = open || holdsCritical;
    const Heading = headingLevel === 2 ? "h2" : headingLevel === 3 ? "h3" : "h4";
    const toggle = (_jsxs("button", { type: "button", className: "cap-group-toggle", "aria-expanded": expanded, "aria-controls": id, onClick: () => setOpen(!expanded), children: [_jsx("span", { className: "cap-group-label", children: label }), _jsx("span", { className: "cap-sr-only", children: ", " }), _jsx("span", { className: "cap-group-count", children: count })] }));
    return (_jsxs("div", { className: "cap-group", "data-cap": "disclosure", children: [headingLevel ? _jsx(Heading, { className: "cap-group-heading", children: toggle }) : toggle, _jsx("ul", { className: "cap-group-rows", id: id, hidden: !expanded, children: children })] }));
}
