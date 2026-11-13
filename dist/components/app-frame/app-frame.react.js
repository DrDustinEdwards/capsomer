import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
// The HTML contract in app-frame.md.
export function AppFrame({ children, address, variant = "browser", foot, decorative, description, }) {
    return (_jsxs(_Fragment, { children: [decorative && description ? _jsx("p", { className: "cap-sr-only", children: description }) : null, _jsxs("div", { className: "cap-app-frame", "data-variant": variant === "app" ? "app" : undefined, "aria-hidden": decorative ? "true" : undefined, children: [_jsxs("div", { className: "cap-app-frame-bar", children: [variant === "browser" ? (_jsx("span", { className: "cap-app-frame-dots", "aria-hidden": "true", children: _jsx("span", {}) })) : null, address ? _jsx("span", { className: "cap-app-frame-address", children: address }) : null] }), _jsx("div", { className: "cap-app-frame-body", children: children }), foot ? _jsx("div", { className: "cap-app-frame-foot", children: foot }) : null] })] }));
}
