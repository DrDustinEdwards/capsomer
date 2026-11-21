import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useId } from "react";
export function CtaBand({ title, children, actions, quiet = false, headingLevel: H = "h2", className, }) {
    const titleId = useId();
    return (_jsxs("section", { className: className ? `cap-cta-band ${className}` : "cap-cta-band", "aria-labelledby": titleId, "data-quiet": quiet ? "" : undefined, children: [_jsx(H, { id: titleId, className: "cap-cta-band-title", children: title }), children ? _jsx("p", { className: "cap-cta-band-text", children: children }) : null, _jsx("div", { className: "cap-cta-band-actions", children: actions })] }));
}
