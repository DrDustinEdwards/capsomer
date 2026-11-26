import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useRef, useState, } from "react";
import { nounsOf, } from "../content/content.js";
import { ContentBulkBar, useIntents } from "../content/content.react.js";
import { PlainForm } from "../plain-form/plain-form.react.js";
import { Empty } from "../empty/empty.react.js";
import { TabLink, TabsNav } from "../tabs/tabs.react.js";
import { NO_FILTERS, STATUS_TABS, contentStatus, countLine, emptyWords, postActions, postsHref, trashLine, withFilter, } from "./posts-list.js";
import { useCleanId, useHydrated } from "../hooks/hooks.react.js";
import { PostsFind } from "./posts-list-find.react.js";
import { PostsTable } from "./posts-list-table.react.js";
import { PreviewLinkBox, RenameDialog, RescheduleDialog, cancelRequest, } from "./posts-list-dialogs.react.js";
export { PostScheduledUpdate } from "./posts-list-update.react.js";
export { contentStatus };
// One page of one site's posts: status tabs with counts, search and filters, the table with its
// row menus, the bulk bar with each item's outcome, Undo, and the confirmation for what cannot be
// undone. Every action is a form post, so it all works with no script; `submit` adds the in-place
// path. The site and the person decide what is offered (data.offers, data.can).
export function PostsList({ data, action, Form = PlainForm, submit, result = null, labels, now, }) {
    const uid = useCleanId();
    const formId = `${uid}-bulk`;
    const { noun, plural } = nounsOf(labels, "post");
    const title = plural.charAt(0).toUpperCase() + plural.slice(1);
    // False on the server and while hydrating, true once hydrated.
    const mounted = useHydrated();
    // The time the list was drawn, when the page does not pass one.
    const [drawnAt] = useState(() => Date.now());
    const clock = now ?? drawnAt;
    const { rows, query, page, offers, can } = data;
    const { bulk, withheld } = postActions(data, labels);
    const inTrash = !!(offers.trash && query.trashed);
    const authors = offers.filters?.includes("author")
        ? Array.from(new Set([...(offers.authors ?? []), ...(query.author ? [query.author] : [])]))
        : [];
    const dates = !!offers.filters?.includes("published");
    const selectable = bulk.length > 0;
    const names = useMemo(() => new Map(rows.map((r) => [r.id, r.title || "Untitled"])), [rows]);
    const tags = useMemo(() => Array.from(new Set(rows.flatMap((r) => r.tags ?? []))).sort(), [rows]);
    const [selected, setSelected] = useState([]);
    // A new page or filter keeps only what is still in view, in the same render.
    const [pickedFrom, setPickedFrom] = useState(names);
    if (names !== pickedFrom) {
        setPickedFrom(names);
        setSelected((s) => s.filter((id) => names.has(id)));
    }
    const href = (q) => postsHref(action, q);
    const intents = useIntents({
        action,
        Form,
        submit,
        result,
        names,
        cancelHref: href(query),
        onDone: () => setSelected([]),
    });
    const [moving, setMoving] = useState(null);
    const [renaming, setRenaming] = useState(null);
    // Where focus goes when a post leaves the list under it (Move to Trash, Restore, Delete for good,
    // with script): the title of the post that took its place, or of the one before when it was the
    // last; after the bulk bar, the table; with nothing left, the current tab. Never the page's top.
    const lastRow = useRef(-1);
    const placeFocus = useRef(null);
    const onFocus = (e) => {
        const tr = e.target.closest("tbody tr");
        lastRow.current = tr?.parentElement
            ? Array.prototype.indexOf.call(tr.parentElement.children, tr)
            : -1;
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
        const target = at >= 0 && titles.length
            ? titles[Math.min(at, titles.length - 1)]
            : root.querySelector(titles.length ? ".cap-posts-wrap" : ".cap-posts-tabs [aria-current='page']");
        target?.focus();
    }, [rows, intents.rootRef]);
    // With script, Reschedule… opens the dialog and Cancel the update asks first; with no script
    // their links go to the page that does it.
    const menuItems = (row, list) => list.map(({ publishAt, ...item }) => {
        if (!mounted || !submit)
            return item;
        const name = row.title || "Untitled";
        if (item.value === "reschedule" && publishAt)
            return {
                ...item,
                onSelect: () => setMoving({ id: row.id, name, at: publishAt, version: row.version }),
            };
        if (item.value === "cancel-schedule")
            return {
                ...item,
                onSelect: () => intents.ask(cancelRequest(row.id, name, noun, row.version)),
            };
        if (item.value === "rename")
            return {
                ...item,
                onSelect: () => setRenaming({ id: row.id, name, path: row.path, version: row.version }),
            };
        return item;
    });
    if (intents.confirmPage) {
        return (_jsx("section", { className: "cap-posts", "data-cap": "posts-list", "aria-label": title, children: intents.confirmPage }));
    }
    const selectedItems = rows
        .filter((r) => selected.includes(r.id))
        .map((r) => ({ id: r.id, label: r.title || "Untitled" }));
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
    return (_jsxs("section", { className: "cap-posts", "data-cap": "posts-list", "aria-label": title, ref: intents.setRoot, onSubmit: onSubmit, onFocus: onFocus, children: [_jsxs(TabsNav, { "aria-label": `${title} by status`, className: "cap-posts-tabs", children: [STATUS_TABS.map((t) => (_jsx(TabLink, { href: href(withFilter(query, { status: t.status, trashed: undefined })), current: !query.trashed && query.status === t.status, count: count(t.status), children: t.label }, t.label))), offers.trash ? (_jsx(TabLink, { href: href(withFilter(query, { status: undefined, trashed: "1" })), current: !!query.trashed, count: data.counts?.trash, children: "Trash" })) : null] }), _jsx(PostsFind, { uid: uid, query: query, kinds: data.kinds, tags: tags, authors: authors, dates: dates, action: action, Form: Form, plural: plural, href: href }), _jsxs("div", { className: "cap-posts-bar", children: [empty ? _jsx("span", {}) : _jsx("p", { className: "cap-posts-count", children: countLine(data, labels) }), _jsxs("div", { className: "cap-posts-tools", children: [data.extra?.toolbar?.length ? (_jsx(Form, { method: "post", action: action, className: "cap-posts-extra", children: data.extra.toolbar.map((a) => (_jsx("button", { type: "submit", className: "cap-btn", name: "intent", value: a.intent, children: a.label }, a.intent))) })) : null, can.edit && data.newHref ? (_jsxs("a", { className: "cap-btn", "data-variant": "primary", href: data.newHref, children: ["New ", noun] })) : null] })] }), inTrash ? _jsx("p", { className: "cap-posts-trash-note", children: trashLine(labels) }) : null, withheld.length ? (_jsx("ul", { className: "cap-posts-withheld", children: withheld.map((w) => (_jsx("li", { children: w }, w))) })) : null, intents.resultBox, offers.previewLinks ? (_jsx(PreviewLinkBox, { link: linked, name: linkedId ? names.get(linkedId) : undefined, noun: noun, scripted: mounted })) : null, selectable ? (_jsx(ContentBulkBar, { formId: formId, action: action, Form: Form, formClass: "cap-posts-bulk-form", items: selectedItems, total: rows.length, onSelectAll: mounted ? () => setAll(true) : undefined, onClear: () => setSelected([]), plural: plural, actions: bulk, tag: offers.tags && can.edit && !inTrash, intents: intents })) : null, empty ? (_jsx(Empty, { kind: words.kind, title: words.title, action: words.kind === "no-match" ? (_jsx("a", { className: "cap-btn", href: href(withFilter(query, NO_FILTERS)), children: "Clear filters" })) : !query.status && !query.trashed && can.edit && data.newHref ? (_jsxs("a", { className: "cap-btn", "data-variant": "primary", href: data.newHref, children: ["New ", noun] })) : undefined })) : (_jsx(PostsTable, { uid: uid, data: data, action: action, title: title, noun: noun, plural: plural, formId: formId, inTrash: inTrash, selectable: selectable, mounted: mounted, selected: selected, setOne: setOne, setAll: setAll, onKeyDown: onTableKey, clock: clock, now: now, menuItems: menuItems })), query.cursor || page.nextCursor ? (_jsxs("nav", { className: "cap-posts-pages", "aria-label": `${title} pages`, children: [query.cursor ? (_jsx("a", { className: "cap-btn", href: href(withFilter(query, {})), children: "First page" })) : null, page.nextCursor ? (_jsx("a", { className: "cap-btn", href: href({ ...query, cursor: page.nextCursor }), children: "Next page" })) : null] })) : null, _jsx(RescheduleDialog, { moving: moving, action: action, Form: Form, onClose: () => setMoving(null) }), _jsx(RenameDialog, { renaming: renaming, action: action, Form: Form, onClose: () => setRenaming(null) }), intents.confirmDialog] }));
}
