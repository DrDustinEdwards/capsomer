import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// A panel is a plain <section> with a heading, not a named region, unless it is given a
// headingId: a page of panels would otherwise fill the landmark list.
export function Panel({ title, level = 2, count, src, more, description, actions, footer, size, headingId, ref, flush = false, id, section, className, children }) {
    const Heading = level === 3 ? "h3" : "h2";
    return (_jsxs("section", { ref: ref, className: className ? `cap-panel ${className}` : "cap-panel", id: id, "data-section": section, "data-size": size, "aria-labelledby": headingId, children: [_jsxs("header", { className: "cap-panel-head", children: [_jsx(Heading, { id: headingId, children: title }), count != null && _jsx("span", { className: "cap-panel-count", children: count }), actions != null && _jsx("span", { className: "cap-panel-action", children: actions }), src != null && _jsx("span", { className: "cap-panel-src", children: src }), more != null && _jsx("span", { className: "cap-panel-more", children: more }), description != null && _jsx("p", { className: "cap-panel-desc", children: description })] }), _jsx("div", { className: "cap-panel-body", "data-flush": flush ? "" : undefined, children: children }), footer != null && _jsx("footer", { className: "cap-panel-foot", children: footer })] }));
}
