import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
const HEART = "M12 20.5l-1.4-1.3C6 15.1 3 12.4 3 9.1 3 6.6 5 4.7 7.5 4.7c1.5 0 2.9.7 3.8 1.8l.7.8.7-.8c.9-1.1 2.3-1.8 3.8-1.8C21 4.7 23 6.6 23 9.1c0 3.3-3 6-7.6 10.1L12 20.5z";
// The HTML contract in like-button.md.
export function LikeButton({ liked, count, onChange, label, pending, disabled, error, }) {
    return (_jsxs("div", { className: "cap-like", children: [_jsxs("button", { type: "button", className: "cap-like-button", "aria-pressed": liked, "aria-busy": pending ? "true" : undefined, disabled: disabled || pending, onClick: () => onChange?.(!liked), children: [_jsx("svg", { viewBox: "0 0 24 24", "aria-hidden": "true", focusable: "false", children: _jsx("path", { d: HEART }) }), _jsxs("span", { className: "cap-sr-only", children: [label ? `Like ${label}` : "Like", ", "] }), _jsx("span", { children: count.toLocaleString("en-US") })] }), error ? (_jsx("p", { className: "cap-like-error", role: "alert", children: error })) : null] }));
}
