import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useRef, } from "react";
import { liveSubmit, SEARCH_DELAY_MS } from "./filter-bar.js";
export { clearedHref, isFiltered, withParams } from "./filter-bar.js";
export function FilterBar(props) {
    const { label, children, count, clearHref, Form = "form", action, live = false, delay = SEARCH_DELAY_MS, applyLabel = "Apply", applyVariant = "default", clearLabel = "Clear filters", renderLink, onSubmit, className, } = props;
    const ref = useRef(null);
    useEffect(() => {
        const form = ref.current;
        if (!live || !form)
            return;
        return liveSubmit(form, delay);
    }, [live, delay]);
    const clear = clearHref == null ? null : renderLink ? (renderLink({ href: clearHref, className: "cap-btn", children: clearLabel })) : (_jsx("a", { className: "cap-btn", href: clearHref, children: clearLabel }));
    const body = (_jsxs(_Fragment, { children: [_jsx("div", { className: "cap-filter-bar-fields", children: children }), _jsxs("div", { className: "cap-filter-bar-actions", children: [_jsx("button", { type: "submit", className: live ? "cap-sr-only" : "cap-btn", "data-variant": live || applyVariant === "default" ? undefined : applyVariant, children: applyLabel }), clear] }), _jsx("p", { className: "cap-filter-bar-count", role: "status", children: count ?? "" })] }));
    const attrs = {
        method: "get",
        action,
        role: "search",
        "aria-label": label,
        className: className ? `cap-filter-bar ${className}` : "cap-filter-bar",
        "data-cap": "filter-bar",
        "data-cap-ready": "",
        "data-live": live ? "" : undefined,
        onSubmit,
    };
    if (Form === "form")
        return (_jsx("form", { ref: ref, ...attrs, children: body }));
    return (_jsx(Form, { ref: ref, ...attrs, replace: live, preventScrollReset: true, children: body }));
}
