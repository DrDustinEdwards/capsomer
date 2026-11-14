import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useId, useRef } from "react";
import { MIN_ITEMS, attach } from "./toc.js";
// The HTML contract in toc.md.
export function Toc({ items, variant, title = "Contents", min = MIN_ITEMS }) {
    const ref = useRef(null);
    const id = useId();
    // This list only: a sibling's own effect attaches the sibling.
    useEffect(() => (ref.current ? attach(ref.current) : undefined), []);
    if (items.length < min)
        return null;
    const list = (_jsx("ol", { className: "cap-toc-list", children: items.map((item) => (_jsx("li", { className: "cap-toc-item", "data-level": item.level === 3 ? "3" : undefined, children: _jsx("a", { className: "cap-toc-link", href: `#${item.id}`, children: item.text }) }, item.id))) }));
    if (variant === "inline")
        return (_jsxs("details", { className: "cap-toc", "data-variant": "inline", children: [_jsx("summary", { className: "cap-toc-title", children: title }), _jsx("nav", { ref: ref, "data-cap": "toc", "aria-label": "Contents", children: list })] }));
    return (_jsxs("nav", { ref: ref, className: "cap-toc", "data-variant": "sidebar", "data-cap": "toc", "aria-labelledby": id, children: [_jsx("p", { className: "cap-toc-title", id: id, children: title }), list] }));
}
