import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useRef } from "react";
import { enhance } from "./timeline.js";
// The HTML contract in timeline.md.
export function Timeline({ steps, level: H = "h3", className }) {
    const ref = useRef(null);
    useEffect(() => (ref.current?.parentElement ? enhance(ref.current.parentElement) : undefined), []);
    return (_jsx("ol", { ref: ref, className: className ? `cap-timeline ${className}` : "cap-timeline", "data-cap": "timeline", children: steps.map((s, i) => (_jsxs("li", { className: "cap-timeline-step", children: [_jsx("span", { className: "cap-timeline-node", "aria-hidden": "true", children: s.mark }), _jsxs("div", { className: "cap-timeline-body", children: [s.icon ? (_jsx("span", { className: "cap-timeline-icon", "aria-hidden": "true", children: s.icon })) : null, _jsx(H, { className: "cap-timeline-title", children: s.title }), s.children ? _jsx("div", { className: "cap-timeline-text", children: s.children }) : null] })] }, i))) }));
}
