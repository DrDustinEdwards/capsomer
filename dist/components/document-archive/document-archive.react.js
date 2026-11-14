import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useId } from "react";
import { Row, RowList } from "../row-list/row-list.react.js";
import { fileMeta } from "../generated-file/generated-file.js";
import { Signs } from "../manual/manual.react.js";
const plainLink = ({ children, ...props }) => _jsx("a", { ...props, children: children });
// One category's documents: a row list, each row's title the link to the document's page.
export function DocumentList({ docs, labelledBy, label, empty = "Nothing here yet.", renderLink = plainLink, }) {
    if (docs.length === 0)
        return _jsx("p", { className: "cap-archive-empty", children: empty });
    return (_jsx(RowList, { labelledBy: labelledBy, label: label, children: docs.map((d) => (_jsx(Row, { title: d.title, href: d.href, detail: d.detail, meta: d.meta, renderLink: renderLink }, d.key))) }));
}
// Every category, each under its heading with its list and, when it is cut short, a link to
// the rest.
export function DocumentArchive({ groups, level = 2, renderLink = plainLink, }) {
    const base = useId();
    const H = `h${level}`;
    return (_jsx("div", { className: "cap-archive", children: groups.map((g) => {
            const id = `${base}-${g.id}`;
            return (_jsxs("section", { className: "cap-archive-group", children: [_jsxs("div", { className: "cap-archive-head", children: [_jsx(H, { id: id, className: "cap-archive-title", children: g.title }), g.href
                                ? renderLink({
                                    href: g.href,
                                    className: "cap-archive-more",
                                    children: g.more ?? `All of ${g.title.toLowerCase()}`,
                                })
                                : null] }), _jsx(DocumentList, { docs: g.docs, labelledBy: id, empty: g.empty, renderLink: renderLink })] }, g.id));
        }) }));
}
// One document's page: its title, the download, the viewer the app gives it, and Previous and
// Next in its category.
export function DocumentViewer({ title, subtitle, level = 1, before, download, children, prev = null, next = null, collection, prevLabel = "Previous", nextLabel = "Next", renderLink = plainLink, }) {
    const H = `h${level}`;
    const format = download?.format ?? "PDF";
    return (_jsxs("article", { className: "cap-docview", children: [_jsxs("header", { className: "cap-docview-head", children: [before, _jsx(H, { className: "cap-docview-title", children: title }), subtitle != null && _jsx("p", { className: "cap-docview-sub", children: subtitle }), download && (_jsxs("p", { className: "cap-docview-download", children: [_jsx("a", { href: download.href, className: "cap-btn", "data-variant": "primary", download: true, children: download.label ?? `Download the ${format}` }), " ", _jsx("span", { className: "cap-link-meta", children: fileMeta(format, download.bytes ?? null) })] }))] }), children != null && _jsx("div", { className: "cap-docview-body", children: children }), _jsx(Signs, { label: `More in ${collection}`, prev: prev ? { ...prev, label: prevLabel } : null, next: next ? { ...next, label: nextLabel } : null, renderLink: renderLink })] }));
}
