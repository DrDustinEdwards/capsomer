import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { ContentBulkBar, PlainForm, useIntents } from "../content/content.react.js";
import { Empty } from "../empty/empty.react.js";
import { FormMenu } from "../menu/menu.react.js";
import { Pill, Status } from "../status/status.react.js";
import { TabLink, TabsNav } from "../tabs/tabs.react.js";
import { Time } from "../time/time.react.js";
import { SORTS, STATUS_TABS, contentStatus, countLine, emptyWords, nounsOf, postActions, postsHref, rowActions, withFilter } from "./posts-list.js";
export { contentStatus };
function HeadCheck({ checked, mixed, label, onChange }) {
    const ref = useRef(null);
    useEffect(() => {
        if (ref.current)
            ref.current.indeterminate = mixed;
    }, [mixed]);
    return (_jsxs("label", { className: "cap-check", children: [_jsx("input", { type: "checkbox", ref: ref, checked: checked, onChange: (e) => onChange(e.target.checked) }), _jsx("span", { className: "cap-sr-only", children: label })] }));
}
// One page of one site's posts: status tabs with counts, search and filters, the table with its
// row menus, the bulk bar with each item's outcome, Undo, and the confirmation for what cannot be
// undone. Every action is a form post, so it all works with no script; `submit` adds the in-place
// path. The site and the person decide what is offered (data.offers, data.can).
export function PostsList({ data, action, Form = PlainForm, submit, result = null, labels, now }) {
    const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
    const formId = `${uid}-bulk`;
    const { noun, plural } = nounsOf(labels);
    const title = plural.charAt(0).toUpperCase() + plural.slice(1);
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);
    const clock = now ?? Date.now();
    const { rows, query, page, offers, can } = data;
    const { bulk, withheld } = postActions(data, labels);
    const selectable = bulk.length > 0;
    const names = useMemo(() => new Map(rows.map((r) => [r.id, r.title || "Untitled"])), [rows]);
    const tags = useMemo(() => Array.from(new Set(rows.flatMap((r) => r.tags ?? []))).sort(), [rows]);
    const withMenus = rows.some((r) => rowActions(r, data).length > 0);
    const [selected, setSelected] = useState([]);
    // A new page or filter keeps only what is still in view.
    useEffect(() => setSelected((s) => s.filter((id) => names.has(id))), [names]);
    const href = (q) => postsHref(action, q);
    const intents = useIntents({ action, Form, submit, result, names, cancelHref: href(query), onDone: () => setSelected([]) });
    if (intents.confirmPage) {
        return (_jsx("section", { className: "cap-posts", "data-cap": "posts-list", "aria-label": title, children: intents.confirmPage }));
    }
    const selectedItems = rows.filter((r) => selected.includes(r.id)).map((r) => ({ id: r.id, label: r.title || "Untitled" }));
    const setOne = (id, on) => setSelected((s) => (on ? (s.includes(id) ? s : [...s, id]) : s.filter((x) => x !== id)));
    const setAll = (on) => setSelected(on ? rows.map((r) => r.id) : []);
    const onTableKey = (e) => {
        if (e.key === "Escape" && selected.length > 0 && !e.defaultPrevented) {
            e.preventDefault();
            setSelected([]);
        }
    };
    const empty = rows.length === 0;
    const words = emptyWords(query, labels);
    const count = (s) => data.counts?.[(s ?? "all")];
    const extraColumns = data.extra?.columns ?? [];
    return (_jsxs("section", { className: "cap-posts", "data-cap": "posts-list", "aria-label": title, ref: (el) => void (intents.rootRef.current = el), onSubmit: intents.onSubmit, children: [_jsx(TabsNav, { "aria-label": `${title} by status`, className: "cap-posts-tabs", children: STATUS_TABS.map((t) => (_jsx(TabLink, { href: href(withFilter(query, { status: t.status })), current: query.status === t.status, count: count(t.status), children: t.label }, t.label))) }), _jsxs(Form, { method: "get", action: action.split("?")[0], className: "cap-posts-filters", role: "search", "aria-label": `Find ${plural}`, children: [query.status ? _jsx("input", { type: "hidden", name: "status", value: query.status }) : null, _jsxs("div", { className: "cap-field cap-posts-search", children: [_jsx("label", { className: "cap-field-label", htmlFor: `${uid}-q`, children: "Search" }), _jsx("input", { className: "cap-input", type: "search", id: `${uid}-q`, name: "q", defaultValue: query.q ?? "" })] }), data.kinds.length > 1 ? (_jsxs("div", { className: "cap-field", children: [_jsx("label", { className: "cap-field-label", htmlFor: `${uid}-kind`, children: "Kind" }), _jsx("div", { className: "cap-select-wrap", "data-native": "", children: _jsxs("select", { className: "cap-select", id: `${uid}-kind`, name: "kind", defaultValue: query.kind ?? "", children: [_jsx("option", { value: "", children: "Any kind" }), data.kinds.map((k) => (_jsx("option", { value: k, children: k }, k)))] }) })] })) : null, tags.length > 0 || query.tag ? (_jsxs("div", { className: "cap-field", children: [_jsx("label", { className: "cap-field-label", htmlFor: `${uid}-tag`, children: "Tag" }), _jsx("div", { className: "cap-select-wrap", "data-native": "", children: _jsxs("select", { className: "cap-select", id: `${uid}-tag`, name: "tag", defaultValue: query.tag ?? "", children: [_jsx("option", { value: "", children: "Any tag" }), Array.from(new Set([...tags, ...(query.tag ? [query.tag] : [])])).map((t) => (_jsx("option", { value: t, children: t }, t)))] }) })] })) : null, _jsxs("div", { className: "cap-field", children: [_jsx("label", { className: "cap-field-label", htmlFor: `${uid}-sort`, children: "Sort by" }), _jsx("div", { className: "cap-select-wrap", "data-native": "", children: _jsx("select", { className: "cap-select", id: `${uid}-sort`, name: "sort", defaultValue: query.sort ?? "updated", children: SORTS.map((s) => (_jsx("option", { value: s.value, children: s.label }, s.value))) }) })] }), _jsx("button", { type: "submit", className: "cap-btn", children: "Show" })] }), _jsxs("div", { className: "cap-posts-bar", children: [empty ? _jsx("span", {}) : _jsx("p", { className: "cap-posts-count", children: countLine(data, labels) }), _jsxs("div", { className: "cap-posts-tools", children: [data.extra?.toolbar?.length ? (_jsx(Form, { method: "post", action: action, className: "cap-posts-extra", children: data.extra.toolbar.map((a) => (_jsx("button", { type: "submit", className: "cap-btn", name: "intent", value: a.intent, children: a.label }, a.intent))) })) : null, can.edit && data.newHref ? (_jsxs("a", { className: "cap-btn", "data-variant": "primary", href: data.newHref, children: ["New ", noun] })) : null] })] }), withheld.length ? (_jsx("ul", { className: "cap-posts-withheld", children: withheld.map((w) => (_jsx("li", { children: w }, w))) })) : null, intents.resultBox, selectable ? (_jsx(ContentBulkBar, { formId: formId, action: action, Form: Form, formClass: "cap-posts-bulk-form", items: selectedItems, total: rows.length, onSelectAll: mounted ? () => setAll(true) : undefined, onClear: () => setSelected([]), plural: plural, actions: bulk, tag: offers.tags && can.edit, intents: intents })) : null, empty ? (_jsx(Empty, { kind: words.kind, title: words.title, action: words.kind === "no-match" ? (_jsx("a", { className: "cap-btn", href: href(withFilter(query, { q: undefined, kind: undefined, tag: undefined })), children: "Clear filters" })) : !query.status && can.edit && data.newHref ? (_jsxs("a", { className: "cap-btn", "data-variant": "primary", href: data.newHref, children: ["New ", noun] })) : undefined, children: words.text })) : (_jsx("div", { className: "cap-table-wrap cap-posts-wrap", role: "region", "aria-labelledby": `${uid}-cap`, tabIndex: 0, onKeyDown: onTableKey, children: _jsxs("table", { className: "cap-table cap-posts-table", children: [_jsxs("caption", { id: `${uid}-cap`, className: "cap-sr-only", children: [title, " on ", data.site.name] }), _jsx("thead", { children: _jsxs("tr", { children: [selectable ? (_jsx("th", { scope: "col", className: "cap-posts-check", children: mounted ? _jsx(HeadCheck, { checked: selected.length > 0 && selected.length === rows.length, mixed: selected.length > 0 && selected.length < rows.length, label: `Select all ${rows.length} ${rows.length === 1 ? noun : plural}`, onChange: setAll }) : _jsx("span", { className: "cap-sr-only", children: "Select" }) })) : null, _jsx("th", { scope: "col", children: "Title" }), _jsx("th", { scope: "col", children: "Status" }), _jsx("th", { scope: "col", children: "Updated" }), extraColumns.map((c) => (_jsx("th", { scope: "col", children: c.label }, c.id))), withMenus ? (_jsx("th", { scope: "col", children: _jsx("span", { className: "cap-sr-only", children: "Actions" }) })) : null] }) }), _jsx("tbody", { children: rows.map((row) => {
                                const st = contentStatus(row.status, row.publishAt, clock);
                                const name = row.title || "Untitled";
                                const items = rowActions(row, data);
                                return (_jsxs("tr", { "data-status": row.status, "data-selected": selected.includes(row.id) ? "" : undefined, children: [selectable ? (_jsx("td", { className: "cap-posts-check", children: _jsxs("label", { className: "cap-check", children: [_jsx("input", { type: "checkbox", name: "ids", value: row.id, form: formId, checked: selected.includes(row.id), onChange: (e) => setOne(row.id, e.target.checked) }), _jsxs("span", { className: "cap-sr-only", children: ["Select ", name] })] }) })) : null, _jsxs("th", { scope: "row", className: "cap-posts-title", children: [_jsx("a", { className: "cap-table-open", href: row.href, children: name }), _jsxs("span", { className: "cap-posts-meta", children: [_jsx("span", { className: "cap-posts-path", children: row.path ?? "Not on the site yet" }), data.kinds.length > 1 ? _jsx("span", { className: "cap-posts-kind", children: row.kind }) : null] }), row.notes?.length ? (_jsx("span", { className: "cap-posts-notes", children: row.notes.map((n) => n.tone ? (_jsx(Pill, { tone: n.tone, children: n.text }, n.text)) : (_jsx(Pill, { variant: "secondary", children: n.text }, n.text))) })) : null] }), _jsxs("td", { className: "cap-posts-status", children: [_jsx(Status, { tone: st.tone, children: st.word }), st.when ? (_jsxs(_Fragment, { children: [" ", _jsx("span", { className: "cap-posts-when", children: st.when })] })) : null] }), _jsx("td", { className: "cap-posts-updated", children: row.updatedAt ? _jsx(Time, { at: row.updatedAt, now: now }) : _jsx("span", { className: "cap-posts-none", children: "No date" }) }), extraColumns.map((c) => (_jsx("td", { children: c.cells[row.id] ?? "" }, c.id))), withMenus ? (_jsx("td", { className: "cap-posts-actions", children: items.length ? _jsx(FormMenu, { label: "Actions", "aria-label": `Actions for ${name}`, action: action, hidden: { ids: row.id }, items: items }) : null })) : null] }, row.id));
                            }) })] }) })), query.cursor || page.nextCursor ? (_jsxs("nav", { className: "cap-posts-pages", "aria-label": `${title} pages`, children: [query.cursor ? (_jsx("a", { className: "cap-btn", href: href(withFilter(query, {})), children: "First page" })) : null, page.nextCursor ? (_jsx("a", { className: "cap-btn", href: href({ ...query, cursor: page.nextCursor }), children: "Next page" })) : null] })) : null, intents.confirmDialog] }));
}
