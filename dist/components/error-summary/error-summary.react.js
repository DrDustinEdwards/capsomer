import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useId, useRef } from "react";
import { setTitleError, wireSummary } from "./error-summary.js";
// The error summary for a React form: pass the errors found on submit. A new errors list takes
// focus and puts "Error: " on the page title; an empty one renders the summary hidden.
export function ErrorSummary({ errors, title = "There is a problem" }) {
    const ref = useRef(null);
    const titleId = useId();
    useEffect(() => (ref.current ? wireSummary(ref.current) : undefined), []);
    useEffect(() => {
        if (errors.length === 0)
            return;
        ref.current?.focus();
        setTitleError(true);
        return () => setTitleError(false);
    }, [errors]);
    return (_jsxs("div", { className: "cap-error-summary", "data-cap": "error-summary", tabIndex: -1, role: "alert", "aria-labelledby": titleId, hidden: errors.length === 0, ref: ref, children: [_jsx("h2", { className: "cap-error-summary-title", id: titleId, children: title }), _jsx("ul", { className: "cap-error-summary-list", children: errors.map((e) => (_jsx("li", { children: _jsx("a", { href: `#${e.id}`, children: e.text }) }, e.id))) })] }));
}
