import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Popover, PopoverContent, PopoverTrigger } from "../popover/popover.react.js";
import { foldedLevels } from "./breadcrumb.js";
const Dots = () => (_jsxs("svg", { viewBox: "0 0 16 16", "aria-hidden": "true", focusable: "false", children: [_jsx("circle", { cx: "3", cy: "8", r: "1.4", fill: "currentColor" }), _jsx("circle", { cx: "8", cy: "8", r: "1.4", fill: "currentColor" }), _jsx("circle", { cx: "13", cy: "8", r: "1.4", fill: "currentColor" })] }));
// The HTML contract in breadcrumb.md. A long trail renders its folded item at once, popover
// included, so the server's HTML already has the links.
export function Breadcrumb({ items, maxItems, label = "Breadcrumb", renderLink }) {
    if (items.length < 2)
        return null;
    const folded = new Set(maxItems ? foldedLevels(items.length, maxItems) : []);
    const link = (item, className) => renderLink ? renderLink({ href: item.href ?? "#", className, children: item.label }) : (_jsx("a", { className: className, href: item.href, children: item.label }));
    return (_jsx("nav", { className: "cap-breadcrumb", "aria-label": label, children: _jsx("ol", { className: "cap-breadcrumb-list", children: items.map((item, i) => {
                if (folded.has(i)) {
                    if (i !== Math.min(...folded))
                        return null;
                    const hidden = items.filter((_, j) => folded.has(j));
                    return (_jsx("li", { className: "cap-breadcrumb-item", "data-collapsed": "", children: _jsxs(Popover, { children: [_jsx(PopoverTrigger, { className: "cap-breadcrumb-ellipsis", "aria-label": `Show ${hidden.length} more levels`, children: _jsx(Dots, {}) }), _jsx(PopoverContent, { "aria-label": "More levels", side: "bottom", align: "start", size: "auto", "data-flush": "", children: _jsx("ul", { className: "cap-breadcrumb-more", children: hidden.map((h) => (_jsx("li", { children: link(h, "cap-breadcrumb-more-link") }, `${h.href}-${h.label}`))) }) })] }) }, `fold-${i}`));
                }
                const last = i === items.length - 1;
                return (_jsx("li", { className: "cap-breadcrumb-item", children: last ? (_jsx("span", { className: "cap-breadcrumb-page", "aria-current": "page", children: item.label })) : (link(item, "cap-breadcrumb-link")) }, `${item.href}-${i}`));
            }) }) }));
}
