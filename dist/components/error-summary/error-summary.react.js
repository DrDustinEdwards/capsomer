import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useId, useRef } from "react";
import { setTitleError, wireSummary } from "./error-summary.js";
// The error summary for a React form: pass the errors found on submit. A new errors list takes
// focus and puts "Error: " on the page title; an empty one renders the summary hidden.
export function ErrorSummary({ errors, title = "There is a problem" }) {
    const ref = useRef(null);
    const titleId = useId();
    useEffect(() => (ref.current ? wireSummary(ref.current) : undefined), []);
    // Keyed on which fields are in error, not on the array: a parent that re-renders with a new array
    // of the same errors must not pull focus off the field being edited.
    const fields = errors.map((e) => e.id).join("\n");
    useEffect(() => {
        if (!fields)
            return;
        ref.current?.focus();
        setTitleError(true);
        return () => setTitleError(false);
    }, [fields]);
    return (_jsxs("div", { className: "cap-error-summary", "data-cap": "error-summary", tabIndex: -1, role: "alert", "aria-labelledby": titleId, hidden: errors.length === 0, ref: ref, children: [_jsx("h2", { className: "cap-error-summary-title", id: titleId, children: title }), _jsx("ul", { className: "cap-error-summary-list", children: errors.map((e) => (_jsx("li", { children: _jsx("a", { href: `#${e.id}`, children: e.text }) }, e.id))) })] }));
}
