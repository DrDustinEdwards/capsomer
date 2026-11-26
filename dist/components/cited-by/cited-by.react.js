import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useId } from "react";
import { linkable } from "../hooks/hooks.js";
export function citedByHeading(total, shown) {
    return total > shown ? `Cited by ${shown} of ${total}` : `Cited by ${total}`;
}
const workHref = (w) => (linkable(w.href) && !w.href.startsWith("/") ? w.href : null) ??
    (w.doi ? `https://doi.org/${encodeURI(w.doi).replace(/[?#]/g, encodeURIComponent)}` : null);
export function CitedByCount({ count, href, source, readAt }) {
    if (typeof count !== "number" || !(count >= 1))
        return null;
    const words = `Cited by ${count}`;
    return (_jsxs("p", { className: "cap-cited-by-count", children: [linkable(href) ? _jsx("a", { href: href, children: words }) : words, " ", _jsxs("span", { className: "cap-cited-by-source", children: [source, ", read ", readAt ?? "an unrecorded date"] })] }));
}
// The list of works that cite a record, under a heading that gives the count, with where the list
// came from and when. Nothing is drawn for an empty list.
export function CitedBy({ total, works, source, readAt, order, headingLevel = 2 }) {
    const id = useId();
    if (works.length === 0)
        return null;
    const H = `h${headingLevel}`;
    return (_jsxs("section", { className: "cap-cited-by", "aria-labelledby": id, children: [_jsx(H, { className: "cap-cited-by-title", id: id, children: citedByHeading(total, works.length) }), _jsxs("p", { className: "cap-cited-by-source", children: [source, ", read ", readAt ?? "an unrecorded date", ".", order ? ` ${order}` : ""] }), _jsx("ol", { className: "cap-cited-by-list", children: works.map((w, i) => {
                    const href = workHref(w);
                    const title = w.title ?? w.doi ?? "Untitled";
                    return (_jsxs("li", { children: [href ? _jsx("a", { href: href, children: title }) : title, w.venue ? _jsxs("span", { className: "cap-cited-by-source", children: [", ", w.venue] }) : null, w.year ? _jsxs("span", { className: "cap-cited-by-source", children: [", ", w.year] }) : null] }, `${href ?? title}-${i}`));
                }) })] }));
}
