import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// The HTML contract in split.md.
export function Split({ heading, headingId, level: H = "h3", flip, media, caption, children, }) {
    return (_jsxs("section", { className: "cap-split", "aria-labelledby": headingId, "data-flip": flip ? "" : undefined, children: [_jsx(H, { className: "cap-split-head", id: headingId, children: heading }), children, _jsxs("figure", { className: "cap-split-media", children: [media, caption ? _jsx("figcaption", { children: caption }) : null] })] }));
}
