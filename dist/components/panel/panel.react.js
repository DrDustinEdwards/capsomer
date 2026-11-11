import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { Spinner } from "../skeleton/skeleton.react.js";
// A panel is a plain <section> with a heading, not a named region, unless it is given a
// headingId: a page of panels would otherwise fill the landmark list.
export function Panel({ title, level = 2, count, meta, src, more, moreHref, moreLabel = "View all", reading, href, description, actions, footer, size, headingId, ref, flush = false, id, section, className, children, }) {
    const Heading = level === 3 ? "h3" : "h2";
    const source = reading ? _jsx(Spinner, { size: "sm", label: "Reading again" }) : src;
    const moreLink = more ?? (moreHref ? _jsx("a", { href: moreHref, children: moreLabel }) : null);
    const head = title != null ||
        count != null ||
        meta != null ||
        actions != null ||
        source != null ||
        moreLink != null ||
        description != null;
    const inner = (_jsxs(_Fragment, { children: [head ? (_jsxs("header", { className: "cap-panel-head", children: [title != null && _jsx(Heading, { id: headingId, children: title }), count != null && _jsx("span", { className: "cap-panel-count", children: count }), meta != null && _jsx("span", { className: "cap-panel-count", children: meta }), actions != null && _jsx("span", { className: "cap-panel-action", children: actions }), source != null && _jsx("span", { className: "cap-panel-src", children: source }), moreLink != null && _jsx("span", { className: "cap-panel-more", children: moreLink }), description != null && _jsx("p", { className: "cap-panel-desc", children: description })] })) : null, _jsx("div", { className: "cap-panel-body", "data-flush": flush ? "" : undefined, children: children }), footer != null && _jsx("footer", { className: "cap-panel-foot", children: footer })] }));
    const cls = className ? `cap-panel ${className}` : "cap-panel";
    if (href)
        return (_jsx("a", { ref: ref, href: href, className: cls, id: id, "data-section": section, "data-size": size, children: inner }));
    return (_jsx("section", { ref: ref, className: cls, id: id, "data-section": section, "data-size": size, "aria-labelledby": title != null ? headingId : undefined, "aria-busy": reading || undefined, children: inner }));
}
// An admin page's table in its panel: the heading names the table's scrolling region, a reread
// shows "Reading again" and marks the panel busy, and an empty answer is the Empty, never an empty
// table. Six of Foxhound's admin pages each wrote this frame.
export function TablePanel({ headingId, isEmpty, empty, reflow, children, ...panel }) {
    return (_jsx(Panel, { ...panel, headingId: headingId, flush: true, children: isEmpty ? (empty) : (_jsx("div", { className: "cap-table-wrap", "data-cap": "table", "data-reflow": reflow ? "" : undefined, role: "region", "aria-labelledby": headingId, tabIndex: 0, children: children })) }));
}
