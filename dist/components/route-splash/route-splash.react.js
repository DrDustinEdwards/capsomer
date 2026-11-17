import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// The HTML contract in route-splash.md. Rendered by the persistent layout in place of its Outlet
// while shouldShowRouteSplash() is true.
export function RouteSplash({ mark, label = "Loading..." }) {
    return (_jsxs("div", { className: "cap-route-splash", role: "status", children: [_jsx("img", { className: "cap-route-splash-mark", src: mark.src, alt: mark.alt, width: 96, height: 96 }), _jsx("p", { className: "cap-route-splash-label", children: label })] }));
}
