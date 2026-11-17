import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useId, useState } from "react";
// A show/hide section: native <details>, so it works before JavaScript and with none.
export function Disclosure({ summary, children, name, defaultOpen = false, variant, size, marker, print, className, }) {
    return (_jsxs("details", { className: className ? `cap-disclosure ${className}` : "cap-disclosure", "data-variant": variant, "data-size": size, "data-marker": marker, "data-print": print, name: name, open: defaultOpen || undefined, children: [_jsx("summary", { children: summary }), _jsx("div", { className: "cap-disclosure-body", children: children })] }));
}
// A group row in a list: a button that shows or hides the rows it groups.
export function Group({ label, count, children, defaultExpanded = false, holdsCritical = false, headingLevel, }) {
    const id = useId();
    const [open, setOpen] = useState(defaultExpanded || holdsCritical);
    const expanded = open || holdsCritical;
    const Heading = headingLevel === 2 ? "h2" : headingLevel === 3 ? "h3" : "h4";
    const toggle = (_jsxs("button", { type: "button", className: "cap-group-toggle", "aria-expanded": expanded, "aria-controls": id, onClick: () => setOpen(!expanded), children: [_jsx("span", { className: "cap-group-label", children: label }), _jsx("span", { className: "cap-sr-only", children: ", " }), _jsx("span", { className: "cap-group-count", children: count })] }));
    return (_jsxs("div", { className: "cap-group", "data-cap": "disclosure", children: [headingLevel ? _jsx(Heading, { className: "cap-group-heading", children: toggle }) : toggle, _jsx("ul", { className: "cap-group-rows", id: id, hidden: !expanded, children: children })] }));
}
// One region shown or hidden by a toggle beside it: the state, and the props for the button and
// the region. For a list of rows that open one at a time, keep the open id in the parent instead.
export function useExpand(defaultOpen = false) {
    const id = useId();
    const [open, setOpen] = useState(defaultOpen);
    return {
        open,
        setOpen,
        toggle: { "aria-expanded": open, "aria-controls": id, onClick: () => setOpen(!open) },
        region: { id },
    };
}
// A link-like button with a chevron that shows or hides one region (a step's email preview).
export function ExpandToggle({ label, openLabel, open, onToggle, controls, className, }) {
    return (_jsx("button", { type: "button", className: className ? `cap-link-btn cap-expand-toggle ${className}` : "cap-link-btn cap-expand-toggle", "aria-expanded": open, "aria-controls": controls, onClick: onToggle, children: _jsx("span", { className: "cap-expand-label", children: open ? (openLabel ?? label) : label }) }));
}
// A table row whose first cell opens a detail row under it, across the whole table (a webhook
// event and its payload). The detail row is always rendered, hidden while closed, so the button's
// aria-controls names a row that exists and print shows every detail; the reset's [hidden] puts
// it away even in a reflowed table, whose rows are grids.
export function ExpandRows({ row, name, toggleSuffix = "details", detail, columns, defaultOpen = false, }) {
    const { open, toggle, region } = useExpand(defaultOpen);
    const button = (_jsxs("button", { type: "button", className: "cap-link-btn cap-expand-toggle cap-expand-row", ...toggle, children: [_jsx("span", { className: "cap-expand-label", children: name }), _jsxs("span", { className: "cap-sr-only", children: [" ", toggleSuffix] })] }));
    return (_jsxs(_Fragment, { children: [_jsx("tr", { children: row(button) }), _jsx("tr", { className: "cap-expand-detail", id: region.id, hidden: !open, children: _jsx("td", { colSpan: columns, children: detail }) })] }));
}
