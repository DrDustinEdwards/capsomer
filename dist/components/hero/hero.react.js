import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useId } from "react";
export function Hero(props) {
    const { title, eyebrow, lead, children, actions, note, aside, backdrop, align = "start", card = false, headingLevel: H = "h1", id, className, } = props;
    const titleId = useId();
    return (_jsxs("section", { id: id, className: className ? `cap-hero ${className}` : "cap-hero", "aria-labelledby": titleId, "data-align": align === "center" ? "center" : undefined, "data-aside": aside ? "" : undefined, children: [backdrop ? (_jsx("div", { className: "cap-hero-backdrop", "aria-hidden": "true", children: backdrop })) : null, _jsxs("div", { className: "cap-hero-text", "data-card": card ? "" : undefined, children: [eyebrow ? _jsx("p", { className: "cap-hero-eyebrow", children: eyebrow }) : null, _jsx(H, { id: titleId, className: "cap-hero-title", children: title }), lead ? _jsx("p", { className: "cap-hero-lead", children: lead }) : null, children ? _jsx("div", { className: "cap-hero-body", children: children }) : null, actions ? _jsx("div", { className: "cap-hero-actions", children: actions }) : null, note ? _jsx("p", { className: "cap-hero-note", children: note }) : null] }), aside ? _jsx("div", { className: "cap-hero-aside", children: aside }) : null] }));
}
