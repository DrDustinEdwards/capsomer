import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export function RouteSplash({ mark, label = "Loading..." }) {
    return (_jsxs("div", { className: "cap-route-splash", role: "status", children: [_jsx("img", { className: "cap-route-splash-mark", src: mark.src, alt: mark.alt, width: 96, height: 96 }), _jsx("p", { className: "cap-route-splash-label", children: label })] }));
}
