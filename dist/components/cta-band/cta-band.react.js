import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useId } from "react";
import { Eyebrow } from "../eyebrow/eyebrow.react.js";
export function CtaBand({ title, eyebrow, children, actions, quiet = false, note, headingLevel: H = "h2", className, }) {
    const titleId = useId();
    return (_jsxs("section", { className: className ? `cap-cta-band ${className}` : "cap-cta-band", "aria-labelledby": titleId, "data-quiet": quiet ? "" : undefined, children: [eyebrow ? _jsx(Eyebrow, { tone: "accent", children: eyebrow }) : null, _jsx(H, { id: titleId, className: "cap-cta-band-title", children: title }), children ? _jsx("p", { className: "cap-cta-band-text", children: children }) : null, _jsx("div", { className: "cap-cta-band-actions", children: actions }), note ? _jsx("p", { className: "cap-cta-band-note", children: note }) : null] }));
}
