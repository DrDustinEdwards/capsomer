import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export const SOURCE_KINDS = {
    credit: "Credit",
    music: "Music",
    image: "Image",
    article: "Article",
    book: "Book",
    web: "Web",
};
const external = (url) => /^https?:\/\//i.test(url);
// The HTML contract in sources-list.md.
export function SourcesList({ sources, label, isExternal = external }) {
    if (!sources.length)
        return null;
    return (_jsx("ol", { className: "cap-sources", "aria-label": label, children: sources.map((s, i) => (_jsxs("li", { className: "cap-source", children: [_jsx("span", { className: "cap-source-kind", children: SOURCE_KINDS[s.type] ?? s.type }), s.url ? (_jsxs("a", { className: "cap-source-title", href: s.url, children: [s.title, isExternal(s.url) ? _jsx("span", { className: "cap-sr-only", children: " (another site)" }) : null] })) : (_jsx("span", { className: "cap-source-title", children: s.title })), s.authors ? _jsx("span", { children: s.authors }) : null, s.publisher ? _jsx("span", { children: s.publisher }) : null, s.license ? _jsx("span", { className: "cap-source-license", children: s.license }) : null, s.note ? _jsx("span", { className: "cap-source-note", children: s.note }) : null] }, i))) }));
}
