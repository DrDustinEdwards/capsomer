import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { ContentBulkBar, PlainForm, useIntents } from "../content/content.react.js";
import { Empty } from "../empty/empty.react.js";
import { FormMenu } from "../menu/menu.react.js";
import { Pill, Status } from "../status/status.react.js";
import { TabLink, TabsNav } from "../tabs/tabs.react.js";
import { Time } from "../time/time.react.js";
import { Dialog, DialogBody, DialogClose, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../dialog/dialog.react.js";
import { DraftCompare, DraftPatch } from "../draft-compare/draft-compare.react.js";
import { PageHead } from "../page-head/page-head.react.js";
import { copyText } from "../media/media-actions.js";
import { NO_FILTERS, SORTS, STATUS_TABS, authorLine, contentStatus, countLine, emptyWords, filtered, inDays, isoFromLocal, localInputValue, nounsOf, postActions, postsHref, rowActions, rowStatus, trashLine, withFilter } from "./posts-list.js";
export { contentStatus };
function HeadCheck({ checked, mixed, label, onChange }) {
    const ref = useRef(null);
    useEffect(() => {
        if (ref.current)
            ref.current.indeterminate = mixed;
    }, [mixed]);
    return (_jsxs("label", { className: "cap-check", children: [_jsx("input", { type: "checkbox", ref: ref, checked: checked, onChange: (e) => onChange(e.target.checked) }), _jsx("span", { className: "cap-sr-only", children: label })] }));
}
// The new time for a reschedule, in the person's own zone; the UTC time it means is posted as
// publishAt. As delivered (the update page with no script) it is a text field in UTC that starts
// at the time it moves from, since a form with no script cannot add the zone the site needs.
function RescheduleField({ id, at }) {
    const [local, setLocal] = useState(null);
    useEffect(() => setLocal(localInputValue(at)), [at]);
    if (local === null) {
        return (_jsxs("div", { className: "cap-field", children: [_jsx("label", { className: "cap-field-label", htmlFor: id, children: "New time, UTC" }), _jsx("input", { className: "cap-input", id: id, name: "publishAt", defaultValue: at.replace(/\.\d{3}Z$/, "Z"), autoComplete: "off", spellCheck: false, "aria-describedby": `${id}-help` }), _jsx("p", { className: "cap-field-description", id: `${id}-help`, children: "As 2030-01-01T15:00:00Z" })] }));
    }
    return (_jsxs("div", { className: "cap-field", children: [_jsx("label", { className: "cap-field-label", htmlFor: id, children: "New time" }), _jsx("input", { className: "cap-input", type: "datetime-local", id: id, value: local, onChange: (e) => setLocal(e.target.value), "aria-describedby": `${id}-help`, required: true }), _jsx("input", { type: "hidden", name: "publishAt", value: isoFromLocal(local) }), _jsxs("p", { className: "cap-field-description", id: `${id}-help`, children: ["In your time zone, ", Intl.DateTimeFormat().resolvedOptions().timeZone, "."] })] }));
}
// The small dialog Reschedule… opens: the time field and Reschedule. Its form posts inside the
// list (or the update page), so the script path runs it like any other intent.
function RescheduleDialog({ moving, action, Form, onClose, now }) {
    const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
    return (_jsx(Dialog, { open: !!moving, onOpenChange: (open) => (open ? undefined : onClose()), size: "sm", described: true, children: moving ? (_jsxs(_Fragment, { children: [_jsxs(DialogHeader, { children: [_jsxs(DialogTitle, { children: ["Reschedule ", moving.name] }), _jsxs(DialogDescription, { children: ["It goes out ", _jsx(Time, { at: moving.at, format: "exact" }), ". Choose the new time."] })] }), _jsxs(Form, { method: "post", action: action, className: "cap-posts-reschedule", onSubmit: () => onClose(), children: [_jsx("input", { type: "hidden", name: "intent", value: "reschedule" }), _jsx("input", { type: "hidden", name: "ids", value: moving.id }), moving.version ? _jsx("input", { type: "hidden", name: "versions", value: moving.version }) : null, _jsx(DialogBody, { children: _jsx(RescheduleField, { id: `${uid}-at`, at: moving.at }, moving.id + moving.at) }), _jsxs(DialogFooter, { children: [_jsx(DialogClose, { part: "cancel", children: "Close" }), _jsx("button", { type: "submit", className: "cap-btn", "data-variant": "primary", children: "Reschedule" })] })] })] })) : null }));
}
// A slug as the contract's ContentId takes it ("notes-on-lambda"). The kit checks it again.
const SLUG = "[A-Za-z0-9][A-Za-z0-9._\\-]{0,199}";
// The small dialog Rename… opens (site-api v0.17.0): the new slug, starting at the old one, and
// what happens to the old address. It posts `rename` with `newId` inside the list, as Reschedule does.
function RenameDialog({ renaming, action, Form, onClose }) {
    const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
    return (_jsx(Dialog, { open: !!renaming, onOpenChange: (open) => (open ? undefined : onClose()), size: "sm", described: true, children: renaming ? (_jsxs(_Fragment, { children: [_jsxs(DialogHeader, { children: [_jsxs(DialogTitle, { children: ["Rename ", renaming.name] }), _jsx(DialogDescription, { children: renaming.path ? `Its address is ${renaming.path} now. The old address will redirect to the new one, so links to it keep working.` : "It has never been published, so no address changes." })] }), _jsxs(Form, { method: "post", action: action, className: "cap-posts-rename", onSubmit: () => onClose(), children: [_jsx("input", { type: "hidden", name: "intent", value: "rename" }), _jsx("input", { type: "hidden", name: "ids", value: renaming.id }), renaming.version ? _jsx("input", { type: "hidden", name: "versions", value: renaming.version }) : null, _jsx(DialogBody, { children: _jsxs("div", { className: "cap-field", children: [_jsx("label", { className: "cap-field-label", htmlFor: `${uid}-slug`, children: "New slug" }), _jsx("input", { className: "cap-input", id: `${uid}-slug`, name: "newId", defaultValue: renaming.id, pattern: SLUG, maxLength: 200, required: true, autoComplete: "off", spellCheck: false, "aria-describedby": `${uid}-slug-help` }), _jsx("p", { className: "cap-field-description", id: `${uid}-slug-help`, children: "Letters, digits, dots, dashes and underscores, starting with a letter or a digit." })] }) }), _jsxs(DialogFooter, { children: [_jsx(DialogClose, { part: "cancel", children: "Close" }), _jsx("button", { type: "submit", className: "cap-btn", "data-variant": "primary", children: "Rename" })] })] })] })) : null }));
}
// The preview link the last post made (`preview-link`, site-api v0.17.0): its address in a field
// that selects whole, Copy with script, and when it stops working in the reader's own zone. A status
// region, so the new link and a copy are said where the person is looking.
function PreviewLinkBox({ link, name, noun, scripted }) {
    const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
    const [copied, setCopied] = useState("");
    useEffect(() => setCopied(""), [link?.url]);
    return (_jsx("div", { className: "cap-posts-preview", role: "status", "aria-label": "Preview link", children: link ? (_jsxs(_Fragment, { children: [_jsx("label", { className: "cap-field-label", htmlFor: `${uid}-url`, children: name ? `Preview link for ${name}` : "Preview link" }), _jsxs("div", { className: "cap-posts-preview-row", children: [_jsx("input", { className: "cap-input", id: `${uid}-url`, value: link.url, readOnly: true, onFocus: (e) => e.currentTarget.select(), "aria-describedby": `${uid}-until` }), scripted ? (_jsx("button", { type: "button", className: "cap-btn", onClick: async () => setCopied((await copyText(link.url)) ? "Copied." : "Could not copy. Select the address and copy it."), children: "Copy" })) : null] }), _jsxs("p", { className: "cap-field-description", id: `${uid}-until`, children: ["Anyone with the link can read the ", noun, " until ", _jsx(Time, { at: link.expiresAt, format: "exact" }), ". ", copied] })] })) : null }));
}
// Asks before canceling an update: it has no Undo.
const cancelRequest = (id, name, noun, version) => ({
    intent: "cancel-schedule",
    title: `Cancel the scheduled update to ${name}?`,
    lead: `The live ${noun} stays as it is and the update's changes are dropped. This cannot be undone.`,
    action: "Cancel the update",
    cancelLabel: "Keep the update",
    items: [name],
    fields: version ? { ids: [id], versions: [version] } : { ids: [id] },
});
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
    const inTrash = !!(offers.trash && query.trashed);
    const authors = offers.filters?.includes("author") ? Array.from(new Set([...(offers.authors ?? []), ...(query.author ? [query.author] : [])])) : [];
    const dates = !!offers.filters?.includes("published");
    const selectable = bulk.length > 0;
    const names = useMemo(() => new Map(rows.map((r) => [r.id, r.title || "Untitled"])), [rows]);
    const tags = useMemo(() => Array.from(new Set(rows.flatMap((r) => r.tags ?? []))).sort(), [rows]);
    const withMenus = rows.some((r) => rowActions(r, data).length > 0);
    const [selected, setSelected] = useState([]);
    // A new page or filter keeps only what is still in view.
    useEffect(() => setSelected((s) => s.filter((id) => names.has(id))), [names]);
    const href = (q) => postsHref(action, q);
    const intents = useIntents({ action, Form, submit, result, names, cancelHref: href(query), onDone: () => setSelected([]) });
    const [moving, setMoving] = useState(null);
    const [renaming, setRenaming] = useState(null);
    // Where focus goes when a post leaves the list under it (Move to Trash, Restore, Delete for good,
    // with script): the title of the post that took its place, or of the one before when it was the
    // last; after the bulk bar, the table; with nothing left, the current tab. Never the page's top.
    const lastRow = useRef(-1);
    const placeFocus = useRef(null);
    const onFocus = (e) => {
        const tr = e.target.closest("tbody tr");
        lastRow.current = tr?.parentElement ? Array.prototype.indexOf.call(tr.parentElement.children, tr) : -1;
    };
    const onSubmit = (e) => {
        if (submit && e.target instanceof HTMLFormElement && e.target.method.toLowerCase() === "post")
            placeFocus.current = lastRow.current;
        intents.onSubmit(e);
    };
    useEffect(() => {
        const at = placeFocus.current;
        const root = intents.rootRef.current;
        placeFocus.current = null;
        if (at === null || !root)
            return;
        const active = document.activeElement;
        if (active && active !== document.body && active.isConnected)
            return;
        const titles = root.querySelectorAll("tbody .cap-table-open");
        const target = at >= 0 && titles.length ? titles[Math.min(at, titles.length - 1)] : root.querySelector(titles.length ? ".cap-posts-wrap" : ".cap-posts-tabs [aria-current='page']");
        target?.focus();
    }, [rows, intents.rootRef]);
    // With script, Reschedule… opens the dialog and Cancel the update asks first; with no script
    // their links go to the page that does it.
    const menuItems = (row, list) => list.map(({ publishAt, ...item }) => {
        if (!mounted || !submit)
            return item;
        const name = row.title || "Untitled";
        if (item.value === "reschedule" && publishAt)
            return { ...item, onSelect: () => setMoving({ id: row.id, name, at: publishAt, version: row.version }) };
        if (item.value === "cancel-schedule")
            return { ...item, onSelect: () => intents.ask(cancelRequest(row.id, name, noun, row.version)) };
        if (item.value === "rename")
            return { ...item, onSelect: () => setRenaming({ id: row.id, name, path: row.path, version: row.version }) };
        return item;
    });
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
    const linked = intents.latest?.previewLink;
    const linkedId = linked ? intents.latest?.outcomes?.[0]?.id : undefined;
    const count = (s) => data.counts?.[(s ?? "all")];
    const extraColumns = data.extra?.columns ?? [];
    return (_jsxs("section", { className: "cap-posts", "data-cap": "posts-list", "aria-label": title, ref: (el) => void (intents.rootRef.current = el), onSubmit: onSubmit, onFocus: onFocus, children: [_jsxs(TabsNav, { "aria-label": `${title} by status`, className: "cap-posts-tabs", children: [STATUS_TABS.map((t) => (_jsx(TabLink, { href: href(withFilter(query, { status: t.status, trashed: undefined })), current: !query.trashed && query.status === t.status, count: count(t.status), children: t.label }, t.label))), offers.trash ? (_jsx(TabLink, { href: href(withFilter(query, { status: undefined, trashed: "1" })), current: !!query.trashed, count: data.counts?.trash, children: "Trash" })) : null] }), _jsxs(Form, { method: "get", action: action.split("?")[0], className: "cap-posts-filters", role: "search", "aria-label": `Find ${plural}`, children: [query.status && !query.trashed ? _jsx("input", { type: "hidden", name: "status", value: query.status }) : null, query.trashed ? _jsx("input", { type: "hidden", name: "trashed", value: "1" }) : null, _jsxs("div", { className: "cap-field cap-posts-search", children: [_jsx("label", { className: "cap-field-label", htmlFor: `${uid}-q`, children: "Search" }), _jsx("input", { className: "cap-input", type: "search", id: `${uid}-q`, name: "q", defaultValue: query.q ?? "" })] }), data.kinds.length > 1 ? (_jsxs("div", { className: "cap-field", children: [_jsx("label", { className: "cap-field-label", htmlFor: `${uid}-kind`, children: "Kind" }), _jsx("div", { className: "cap-select-wrap", "data-native": "", children: _jsxs("select", { className: "cap-select", id: `${uid}-kind`, name: "kind", defaultValue: query.kind ?? "", children: [_jsx("option", { value: "", children: "Any kind" }), data.kinds.map((k) => (_jsx("option", { value: k, children: k }, k)))] }) })] })) : null, tags.length > 0 || query.tag ? (_jsxs("div", { className: "cap-field", children: [_jsx("label", { className: "cap-field-label", htmlFor: `${uid}-tag`, children: "Tag" }), _jsx("div", { className: "cap-select-wrap", "data-native": "", children: _jsxs("select", { className: "cap-select", id: `${uid}-tag`, name: "tag", defaultValue: query.tag ?? "", children: [_jsx("option", { value: "", children: "Any tag" }), Array.from(new Set([...tags, ...(query.tag ? [query.tag] : [])])).map((t) => (_jsx("option", { value: t, children: t }, t)))] }) })] })) : null, authors.length ? (_jsxs("div", { className: "cap-field", children: [_jsx("label", { className: "cap-field-label", htmlFor: `${uid}-author`, children: "Author" }), _jsx("div", { className: "cap-select-wrap", "data-native": "", children: _jsxs("select", { className: "cap-select", id: `${uid}-author`, name: "author", defaultValue: query.author ?? "", children: [_jsx("option", { value: "", children: "Any author" }), authors.map((a) => (_jsx("option", { value: a, children: a }, a)))] }) })] })) : null, dates ? (_jsxs(_Fragment, { children: [_jsxs("div", { className: "cap-field", children: [_jsx("label", { className: "cap-field-label", htmlFor: `${uid}-from`, children: "Published from" }), _jsx("input", { className: "cap-input", type: "date", id: `${uid}-from`, name: "from", defaultValue: query.from ?? "" })] }), _jsxs("div", { className: "cap-field", children: [_jsx("label", { className: "cap-field-label", htmlFor: `${uid}-to`, children: "Published to" }), _jsx("input", { className: "cap-input", type: "date", id: `${uid}-to`, name: "to", defaultValue: query.to ?? "" })] })] })) : null, _jsxs("div", { className: "cap-field", children: [_jsx("label", { className: "cap-field-label", htmlFor: `${uid}-sort`, children: "Sort by" }), _jsx("div", { className: "cap-select-wrap", "data-native": "", children: _jsx("select", { className: "cap-select", id: `${uid}-sort`, name: "sort", defaultValue: query.sort ?? "updated", children: SORTS.map((s) => (_jsx("option", { value: s.value, children: s.label }, s.value))) }) })] }), _jsx("button", { type: "submit", className: "cap-btn", children: "Show" }), filtered(query) ? (_jsx("a", { className: "cap-btn", "data-variant": "quiet", href: href(withFilter(query, NO_FILTERS)), children: "Clear filters" })) : null] }), _jsxs("div", { className: "cap-posts-bar", children: [empty ? _jsx("span", {}) : _jsx("p", { className: "cap-posts-count", children: countLine(data, labels) }), _jsxs("div", { className: "cap-posts-tools", children: [data.extra?.toolbar?.length ? (_jsx(Form, { method: "post", action: action, className: "cap-posts-extra", children: data.extra.toolbar.map((a) => (_jsx("button", { type: "submit", className: "cap-btn", name: "intent", value: a.intent, children: a.label }, a.intent))) })) : null, can.edit && data.newHref ? (_jsxs("a", { className: "cap-btn", "data-variant": "primary", href: data.newHref, children: ["New ", noun] })) : null] })] }), inTrash ? _jsx("p", { className: "cap-posts-trash-note", children: trashLine(labels) }) : null, withheld.length ? (_jsx("ul", { className: "cap-posts-withheld", children: withheld.map((w) => (_jsx("li", { children: w }, w))) })) : null, intents.resultBox, offers.previewLinks ? _jsx(PreviewLinkBox, { link: linked, name: linkedId ? names.get(linkedId) : undefined, noun: noun, scripted: mounted }) : null, selectable ? (_jsx(ContentBulkBar, { formId: formId, action: action, Form: Form, formClass: "cap-posts-bulk-form", items: selectedItems, total: rows.length, onSelectAll: mounted ? () => setAll(true) : undefined, onClear: () => setSelected([]), plural: plural, actions: bulk, tag: offers.tags && can.edit && !inTrash, intents: intents })) : null, empty ? (_jsx(Empty, { kind: words.kind, title: words.title, action: words.kind === "no-match" ? (_jsx("a", { className: "cap-btn", href: href(withFilter(query, NO_FILTERS)), children: "Clear filters" })) : !query.status && !query.trashed && can.edit && data.newHref ? (_jsxs("a", { className: "cap-btn", "data-variant": "primary", href: data.newHref, children: ["New ", noun] })) : undefined, children: words.text })) : (_jsx("div", { className: "cap-table-wrap cap-posts-wrap", "data-reflow": "", role: "region", "aria-labelledby": `${uid}-cap`, tabIndex: 0, onKeyDown: onTableKey, children: _jsxs("table", { className: "cap-table cap-posts-table", children: [_jsxs("caption", { id: `${uid}-cap`, className: "cap-sr-only", children: [inTrash ? `${title} in Trash` : title, " on ", data.site.name] }), _jsx("thead", { children: _jsxs("tr", { children: [selectable ? (_jsx("th", { scope: "col", className: "cap-posts-check", children: mounted ? _jsx(HeadCheck, { checked: selected.length > 0 && selected.length === rows.length, mixed: selected.length > 0 && selected.length < rows.length, label: `Select all ${rows.length} ${rows.length === 1 ? noun : plural}`, onChange: setAll }) : _jsx("span", { className: "cap-sr-only", children: "Select" }) })) : null, _jsx("th", { scope: "col", children: "Title" }), _jsx("th", { scope: "col", children: "Status" }), _jsx("th", { scope: "col", children: "Updated" }), extraColumns.map((c) => (_jsx("th", { scope: "col", children: c.label }, c.id))), withMenus ? (_jsx("th", { scope: "col", children: _jsx("span", { className: "cap-sr-only", children: "Actions" }) })) : null] }) }), _jsx("tbody", { children: rows.map((row) => {
                                const st = rowStatus(row, clock);
                                const name = row.title || "Untitled";
                                const items = rowActions(row, data);
                                return (_jsxs("tr", { "data-status": row.status, "data-selected": selected.includes(row.id) ? "" : undefined, children: [selectable ? (_jsx("td", { className: "cap-posts-check", children: _jsxs("label", { className: "cap-check", children: [_jsx("input", { type: "checkbox", name: "ids", value: row.id, form: formId, checked: selected.includes(row.id), onChange: (e) => setOne(row.id, e.target.checked) }), _jsxs("span", { className: "cap-sr-only", children: ["Select ", name] })] }) })) : null, _jsxs("th", { scope: "row", className: "cap-posts-title", children: [_jsx("a", { className: "cap-table-open", href: row.href, children: name }), _jsxs("span", { className: "cap-posts-meta", children: [_jsx("span", { className: "cap-posts-path", children: row.path ?? "Not on the site yet" }), data.kinds.length > 1 ? _jsx("span", { className: "cap-posts-kind", children: row.kind }) : null, row.authors?.length ? _jsx("span", { className: "cap-posts-authors", children: authorLine(row.authors) }) : null] }), row.excerpt ? _jsx("span", { className: "cap-posts-excerpt", children: row.excerpt }) : null, row.notes?.length ? (_jsx("span", { className: "cap-posts-notes", children: row.notes.map((n) => n.tone ? (_jsx(Pill, { tone: n.tone, children: n.text }, n.text)) : (_jsx(Pill, { variant: "secondary", children: n.text }, n.text))) })) : null] }), _jsxs("td", { className: "cap-posts-status", "data-label": "Status", children: [_jsx(Status, { tone: st.tone, children: st.word }), st.note ? _jsxs("span", { className: "cap-posts-when", children: [" \u00B7 ", st.note] }) : null] }), _jsx("td", { className: "cap-posts-updated", "data-label": "Updated", children: row.updatedAt ? _jsx(Time, { at: row.updatedAt, now: now }) : _jsx("span", { className: "cap-posts-none", children: "No date" }) }), extraColumns.map((c) => (_jsx("td", { className: "cap-posts-extra-cell", "data-label": c.label, children: c.cells[row.id] ?? "" }, c.id))), withMenus ? (_jsx("td", { className: "cap-posts-actions", children: items.length ? _jsx(FormMenu, { label: "Actions", "aria-label": `Actions for ${name}`, action: action, hidden: { ids: row.id }, items: menuItems(row, items) }) : null })) : null] }, row.id));
                            }) })] }) })), query.cursor || page.nextCursor ? (_jsxs("nav", { className: "cap-posts-pages", "aria-label": `${title} pages`, children: [query.cursor ? (_jsx("a", { className: "cap-btn", href: href(withFilter(query, {})), children: "First page" })) : null, page.nextCursor ? (_jsx("a", { className: "cap-btn", href: href({ ...query, cursor: page.nextCursor }), children: "Next page" })) : null] })) : null, _jsx(RescheduleDialog, { moving: moving, action: action, Form: Form, onClose: () => setMoving(null), now: now }), _jsx(RenameDialog, { renaming: renaming, action: action, Form: Form, onClose: () => setRenaming(null) }), intents.confirmDialog] }));
}
// The page of the update waiting on a live post: a page head with the post's title, when the
// update goes live and its actions, then the update beside the live post in the draft compare,
// with the unified patch under it. Reschedule… opens the dialog and Cancel the update asks
// first, posting the posts list's own intents; with no script both are plain forms under the
// head.
export function PostScheduledUpdate({ data, action, Form = PlainForm, submit, result = null, liveSince, crumbs, headingLevel, labels, now }) {
    const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
    const { noun } = nounsOf(labels);
    const name = data.title || "Untitled";
    const names = useMemo(() => new Map([[data.id, name]]), [data.id, name]);
    const intents = useIntents({ action, Form, submit, result, names, cancelHref: action });
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);
    const [moving, setMoving] = useState(null);
    const clock = now ?? Date.now();
    const scripted = mounted && !!submit;
    const Side = headingLevel === "h3" ? "h4" : headingLevel === "h2" ? "h3" : "h2";
    const may = data.can.publish;
    const actions = (_jsxs(_Fragment, { children: [may && scripted ? (_jsx("button", { type: "button", className: "cap-btn", "data-variant": "primary", onClick: () => setMoving({ id: data.id, name, at: data.publishAt, version: data.live.version }), children: "Reschedule\u2026" })) : null, data.can.edit ? (_jsx("a", { className: "cap-btn", href: data.editorHref, children: "Edit the update" })) : null, data.live.href ? (_jsxs("a", { className: "cap-btn", href: data.live.href, children: ["View the live ", noun] })) : null, may && scripted ? (_jsx("button", { type: "button", className: "cap-btn", "data-variant": "danger", "data-cap-part": "cancel-update", onClick: () => intents.ask(cancelRequest(data.id, name, noun, data.live.version)), children: "Cancel the update" })) : null] }));
    return (_jsxs("section", { className: "cap-posts-update-view", "data-cap": "posts-list", "aria-labelledby": `${uid}-h`, ref: (el) => void (intents.rootRef.current = el), onSubmit: intents.onSubmit, children: [_jsx(PageHead, { crumbs: crumbs, headingLevel: headingLevel, title: _jsx("span", { id: `${uid}-h`, children: name }), lead: _jsxs(_Fragment, { children: ["The update goes live ", _jsx(Time, { at: data.publishAt, format: "exact" }), ", ", inDays(data.publishAt, clock), ". Until then the site serves the live ", noun, "; then the update replaces it whole."] }), actions: actions }), intents.resultBox, may && !scripted ? (_jsxs(Form, { method: "post", action: action, className: "cap-posts-update-form", children: [_jsx("input", { type: "hidden", name: "ids", value: data.id }), _jsx("input", { type: "hidden", name: "versions", value: data.live.version }), _jsx(RescheduleField, { id: `${uid}-at`, at: data.publishAt }), _jsx("button", { type: "submit", className: "cap-btn", "data-variant": "primary", name: "intent", value: "reschedule", children: "Reschedule" }), _jsx("button", { type: "submit", className: "cap-btn", "data-variant": "danger", name: "intent", value: "cancel-schedule", children: "Cancel the update" })] })) : null, !may ? _jsx("p", { className: "cap-posts-withheld", children: "Rescheduling or canceling it needs a publisher's role." }) : null, _jsxs("div", { className: "cap-posts-update-sides", children: [_jsxs(Side, { className: "cap-posts-update-side", children: ["Live ", noun, liveSince ? (_jsxs("span", { className: "cap-posts-update-side-when", children: [" ", "\u00B7 on the site since ", _jsx(Time, { at: liveSince, format: "exact" })] })) : null] }), _jsxs(Side, { className: "cap-posts-update-side", children: ["Scheduled update", _jsxs("span", { className: "cap-posts-update-side-when", children: [" ", "\u00B7 goes live ", _jsx(Time, { at: data.publishAt, format: "exact" })] })] })] }), _jsx(DraftCompare, { before: { title: `Live ${noun}`, text: data.live.source }, after: { title: "Scheduled update", text: data.source }, labels: { before: "Live", after: "Scheduled" }, id: `${uid}-cmp`, heads: false }), _jsxs("details", { className: "cap-disclosure cap-posts-update-patch", children: [_jsx("summary", { children: "The change as a patch" }), _jsx(DraftPatch, { patch: data.patch, title: `The scheduled update to ${name}`, id: `${uid}-patch` })] }), _jsx(RescheduleDialog, { moving: moving, action: action, Form: Form, onClose: () => setMoving(null), now: now }), intents.confirmDialog] }));
}
