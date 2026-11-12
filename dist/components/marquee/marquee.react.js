import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// A marquee's HTML contract (marquee.md): the items twice, the second copy hidden and inert.
export function Marquee({ label, items, direction, }) {
    // The loop's length is the site's --marquee-duration (120s), set in CSS: a style attribute would
    // break style-src 'self'.
    return (_jsx("div", { className: "cap-marquee", "data-direction": direction, children: _jsxs("div", { className: "cap-marquee-track", children: [_jsx("ul", { className: "cap-marquee-list", "aria-label": label, children: items.map((item, i) => (_jsx("li", { children: item }, i))) }), _jsx("ul", { className: "cap-marquee-list", "aria-hidden": "true", inert: true, children: items.map((item, i) => (_jsx("li", { children: item }, i))) })] }) }));
}
// The group's one visible Pause control; put it in the .cap-marquee-group with the marquees.
export function MarqueePause({ children = "Pause the logos" }) {
    return (_jsxs("label", { className: "cap-marquee-pause", children: [_jsx("input", { type: "checkbox" }), children] }));
}
