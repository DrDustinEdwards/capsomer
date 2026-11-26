import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useRef } from "react";
import {} from "../content/content.js";
import { FormMenu } from "../menu/menu.react.js";
import { Pill, Status } from "../status/status.react.js";
import { Time } from "../time/time.react.js";
import { authorLine, rowActions, rowStatus } from "./posts-list.js";
function HeadCheck({ checked, mixed, label, onChange, }) {
    const ref = useRef(null);
    useEffect(() => {
        if (ref.current)
            ref.current.indeterminate = mixed;
    }, [mixed]);
    return (_jsxs("label", { className: "cap-check", children: [_jsx("input", { type: "checkbox", ref: ref, checked: checked, onChange: (e) => onChange(e.target.checked) }), _jsx("span", { className: "cap-sr-only", children: label })] }));
}
export function PostsTable({ uid, data, action, title, noun, plural, formId, inTrash, selectable, mounted, selected, setOne, setAll, onKeyDown, clock, now, menuItems, }) {
    const { rows } = data;
    const extraColumns = data.extra?.columns ?? [];
    const withMenus = rows.some((r) => rowActions(r, data).length > 0);
    return (_jsx("div", { className: "cap-table-wrap cap-posts-wrap", "data-reflow": "", role: "region", "aria-labelledby": `${uid}-cap`, tabIndex: 0, onKeyDown: onKeyDown, children: _jsxs("table", { className: "cap-table cap-posts-table", children: [_jsxs("caption", { id: `${uid}-cap`, className: "cap-sr-only", children: [inTrash ? `${title} in Trash` : title, " on ", data.site.name] }), _jsx("thead", { children: _jsxs("tr", { children: [selectable ? (_jsx("th", { scope: "col", className: "cap-posts-check", children: mounted ? (_jsx(HeadCheck, { checked: selected.length > 0 && selected.length === rows.length, mixed: selected.length > 0 && selected.length < rows.length, label: `Select all ${rows.length} ${rows.length === 1 ? noun : plural}`, onChange: setAll })) : (_jsx("span", { className: "cap-sr-only", children: "Select" })) })) : null, _jsx("th", { scope: "col", children: "Title" }), _jsx("th", { scope: "col", children: "Status" }), _jsx("th", { scope: "col", children: "Updated" }), extraColumns.map((c) => (_jsx("th", { scope: "col", children: c.label }, c.id))), withMenus ? (_jsx("th", { scope: "col", children: _jsx("span", { className: "cap-sr-only", children: "Actions" }) })) : null] }) }), _jsx("tbody", { children: rows.map((row) => {
                        const st = rowStatus(row, clock);
                        const name = row.title || "Untitled";
                        const items = rowActions(row, data);
                        return (_jsxs("tr", { "data-status": row.status, "data-selected": selected.includes(row.id) ? "" : undefined, children: [selectable ? (_jsx("td", { className: "cap-posts-check", children: _jsxs("label", { className: "cap-check", children: [_jsx("input", { type: "checkbox", name: "ids", value: row.id, form: formId, checked: selected.includes(row.id), onChange: (e) => setOne(row.id, e.target.checked) }), _jsxs("span", { className: "cap-sr-only", children: ["Select ", name] })] }) })) : null, _jsxs("th", { scope: "row", className: "cap-posts-title", children: [_jsx("a", { className: "cap-table-open", href: row.href, children: name }), _jsxs("span", { className: "cap-posts-meta", children: [_jsx("span", { className: "cap-posts-path", children: row.path ?? "Not on the site yet" }), data.kinds.length > 1 ? (_jsx("span", { className: "cap-posts-kind", children: row.kind })) : null, row.authors?.length ? (_jsx("span", { className: "cap-posts-authors", children: authorLine(row.authors) })) : null] }), row.excerpt ? _jsx("span", { className: "cap-posts-excerpt", children: row.excerpt }) : null, row.notes?.length ? (_jsx("span", { className: "cap-posts-notes", children: row.notes.map((n) => n.tone ? (_jsx(Pill, { tone: n.tone, children: n.text }, n.text)) : (_jsx(Pill, { variant: "secondary", children: n.text }, n.text))) })) : null] }), _jsxs("td", { className: "cap-posts-status", "data-label": "Status", children: [_jsx(Status, { tone: st.tone, children: st.word }), st.note ? _jsxs("span", { className: "cap-posts-when", children: [" \u00B7 ", st.note] }) : null] }), _jsx("td", { className: "cap-posts-updated", "data-label": "Updated", children: row.updatedAt ? (_jsx(Time, { at: row.updatedAt, now: now })) : (_jsx("span", { className: "cap-posts-none", children: "No date" })) }), extraColumns.map((c) => (_jsx("td", { className: "cap-posts-extra-cell", "data-label": c.label, children: c.cells[row.id] ?? "" }, c.id))), withMenus ? (_jsx("td", { className: "cap-posts-actions", children: items.length ? (_jsx(FormMenu, { label: "Actions", "aria-label": `Actions for ${name}`, action: action, hidden: { ids: row.id }, items: menuItems(row, items) })) : null })) : null] }, row.id));
                    }) })] }) }));
}
