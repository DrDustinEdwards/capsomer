import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { pageItems, statusText } from "./pagination.js";
// The HTML contract in pagination.md. One page or none renders nothing: there is nowhere to go.
export function Pagination({ page, pageCount, hrefFor, onPageChange, total, perPage, noun = "items", prevLabel = "Previous", nextLabel = "Next", label = "Pagination" }) {
    if (pageCount <= 1)
        return null;
    const links = typeof hrefFor === "function";
    const control = (to, className, content, extra) => {
        const common = {
            className,
            "data-kind": extra.kind,
            "aria-label": extra.name,
            "aria-current": extra.current ? "page" : undefined,
        };
        const off = !extra.current && (to < 1 || to > pageCount);
        if (links) {
            return off ? (_jsx("a", { ...common, role: "link", "aria-disabled": "true", children: content })) : (_jsx("a", { ...common, href: hrefFor(to), rel: extra.rel, children: content }));
        }
        return (_jsx("button", { type: "button", ...common, "aria-disabled": off ? true : undefined, onClick: () => (!off && !extra.current ? onPageChange?.(to) : undefined), children: content }));
    };
    return (_jsxs("nav", { className: "cap-pagination", "aria-label": label, children: [perPage && total != null ? (_jsx("p", { className: "cap-pagination-status", role: links ? undefined : "status", children: statusText(page, perPage, total, noun) })) : null, _jsxs("ul", { className: "cap-pagination-list", children: [_jsx("li", { children: control(page - 1, "cap-page", prevLabel, { kind: "prev", rel: "prev" }) }, "prev"), pageItems(page, pageCount).map((it) => typeof it === "number" ? (_jsx("li", { className: "cap-pagination-num", children: control(it, "cap-page", String(it), { current: it === page, name: `Page ${it}` }) }, it)) : (_jsx("li", { className: "cap-pagination-num", children: _jsxs("span", { className: "cap-page-gap", children: [_jsx("span", { "aria-hidden": "true", children: "…" }), _jsx("span", { className: "cap-sr-only", children: "More pages" })] }) }, it))), _jsxs("li", { className: "cap-pagination-where", children: ["Page ", page, " of ", pageCount] }, "where"), _jsx("li", { children: control(page + 1, "cap-page", nextLabel, { kind: "next", rel: "next" }) }, "next")] })] }));
}
