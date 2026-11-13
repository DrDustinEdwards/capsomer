import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { snippetParts } from "./search-results.js";
// The snippet with its matches marked. React escapes every run; nothing in it is markup.
export function Snippet({ text, open, close }) {
    return (_jsx(_Fragment, { children: snippetParts(text, open, close).map((p, i) => p.match ? _jsx("mark", { children: p.text }, i) : p.text) }));
}
// One result: the kind, the title as a link, where it sits, the snippet and why it matched.
export function SearchResult({ href, title, kind, context, snippet, why, level = 2, }) {
    const Heading = level === 3 ? "h3" : "h2";
    return (_jsxs("li", { className: "cap-search-result", children: [_jsxs("div", { className: "cap-search-head", children: [kind != null ? (_jsx("span", { className: "cap-pill", "data-variant": "outline", children: kind })) : null, _jsx(Heading, { className: "cap-search-title", children: _jsx("a", { href: href, children: title }) })] }), context != null ? _jsx("p", { className: "cap-search-context", children: context }) : null, snippet ? (_jsx("p", { className: "cap-search-snippet", children: _jsx(Snippet, { text: snippet }) })) : null, why != null ? _jsx("p", { className: "cap-search-why", children: why }) : null] }));
}
// The page around the results: the count, the sort, the list or the empty state, the pages and
// the facets.
export function SearchResults({ count, children, facets, sort, empty, pager, label = "Search results", }) {
    const has = Array.isArray(children)
        ? children.length > 0
        : children != null && children !== false;
    return (_jsxs("div", { className: "cap-search", "data-facets": facets ? "" : undefined, children: [_jsxs("div", { className: "cap-search-main", children: [_jsx("p", { className: "cap-search-count", "aria-live": "polite", children: count }), has && sort ? _jsx("div", { className: "cap-search-sort", children: sort }) : null, has ? (_jsx("ol", { className: "cap-search-list", "aria-label": label, children: children })) : (empty), has ? pager : null] }), facets ? (_jsx("aside", { className: "cap-search-facets", "aria-label": "Filter results", children: facets })) : null] }));
}
