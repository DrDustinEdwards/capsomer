import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import {} from "../content/content.js";
import { Disclosure } from "../disclosure/disclosure.react.js";
import { Keys } from "../shortcuts/shortcuts.react.js";
import { TabLink, TabsNav } from "../tabs/tabs.react.js";
import { countLine, KIND_WORDS, ORIENTATION_WORDS, SORT_WORDS, withMedia, } from "./media-library.js";
const GROUP_WORDS = { flat: "None", folder: "Folder", month: "Month" };
const KEYS = [
    [["Mod+k", "/"], "Find a file"],
    [["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"], "Move through the files"],
    [["Home", "End"], "First or last file"],
    ["Enter", "Open the file's details"],
    [["Space", "x"], "Select the file"],
    ["Escape", "Clear the selection, then close the details"],
];
// The tabs, the search, the tag and lens chips, and the bar with the count, the layout, the filters,
// the display and the toolbar's actions.
export function LibraryToolbar({ m }) {
    const { Form, action, can, data, dir, display, filterWords, filters, href, labels, layout, lensHint, lenses, mounted, offers, path, picker, plural, query, remember, rows, setUploadOpen, shown, shrinkAll, sort, submit, tileSize, title, trash, uid, uploads, } = m;
    const chipLinks = (label, options, current, to, onPick) => (_jsxs("nav", { className: "cap-media-lib-layout", "aria-label": label, children: [_jsx("span", { className: "cap-media-lib-tool-label", "aria-hidden": "true", children: label }), options.map(([v, text]) => (_jsx("a", { className: "cap-chip", href: href(to(v)), "aria-current": current === v ? "true" : undefined, onClick: onPick ? () => onPick(v) : undefined, children: text }, v)))] }));
    return (_jsxs(_Fragment, { children: [!picker && offers.trash ? (_jsxs(TabsNav, { "aria-label": `${title}: library or Trash`, className: "cap-media-lib-tabs", children: [_jsx(TabLink, { href: href(withMedia(query, { view: undefined })), current: !trash, count: data.counts?.library, children: "Library" }), _jsx(TabLink, { href: href(withMedia(query, { view: "trash" })), current: trash, count: data.counts?.trash, children: "Trash" })] })) : null, _jsxs(Form, { method: "get", action: path, className: "cap-field-row", role: "search", "aria-label": `Find ${plural}`, children: [[
                        "view",
                        "layout",
                        "size",
                        "tag",
                        "kind",
                        "orientation",
                        "lens",
                        "sort",
                        "dir",
                        "group",
                    ].map((k) => (query[k] ? _jsx("input", { type: "hidden", name: k, value: query[k] }, k) : null)), _jsxs("div", { className: "cap-field cap-field-wide", children: [_jsx("label", { className: "cap-field-label", htmlFor: `${uid}-q`, children: "Search" }), _jsx("input", { className: "cap-input", type: "search", id: `${uid}-q`, name: "q", defaultValue: query.q ?? "" })] }), _jsx("button", { type: "submit", className: "cap-btn", children: "Show" })] }), data.tags.length || lenses.length ? (_jsxs("nav", { className: "cap-media-lib-chips", "aria-label": `Narrow the ${plural}`, children: [data.tags.length ? (_jsxs("ul", { className: "cap-chips", "aria-label": "Tags", children: [_jsx("li", { children: _jsx("a", { className: "cap-chip", href: href(withMedia(query, { tag: undefined })), "aria-current": !query.tag ? "true" : undefined, children: "Any tag" }) }), data.tags.map((t) => (_jsx("li", { children: _jsxs("a", { className: "cap-chip", href: href(withMedia(query, { tag: t.tag })), "aria-current": query.tag === t.tag ? "true" : undefined, children: [t.tag, t.count != null ? _jsx("span", { className: "cap-chip-count", children: t.count }) : null] }) }, t.tag)))] })) : null, lenses.length ? (_jsx("ul", { className: "cap-chips", "aria-label": "Lenses", children: lenses.map((l) => (_jsx("li", { children: _jsxs("a", { className: "cap-chip", href: href(withMedia(query, { lens: query.lens === l.id ? undefined : l.id })), "aria-current": query.lens === l.id ? "true" : undefined, title: l.hint, children: [l.label, l.count != null ? _jsx("span", { className: "cap-chip-count", children: l.count }) : null] }) }, l.id))) })) : null, lensHint ? _jsx("p", { className: "cap-media-lib-note", children: lensHint }) : null] })) : null, _jsxs("div", { className: "cap-media-lib-bar", children: [_jsx("p", { className: "cap-media-lib-count", children: shown.length === 0 ? "" : countLine({ ...data, rows: shown }, labels) }), _jsxs("div", { className: "cap-media-lib-tools", children: [!picker ? (_jsxs("nav", { className: "cap-media-lib-layout", "aria-label": "Show as", children: [_jsx("a", { className: "cap-chip", href: href(withMedia(query, { layout: undefined })), "aria-current": layout === "grid" ? "true" : undefined, onClick: () => remember({ layout: "grid" }), children: "Grid" }), _jsx("a", { className: "cap-chip", href: href(withMedia(query, { layout: "list" })), "aria-current": layout === "list" ? "true" : undefined, onClick: () => remember({ layout: "list" }), children: "List" })] })) : null, filters ? (_jsx(Disclosure, { summary: `Filter: ${filterWords}`, children: _jsxs("div", { className: "cap-media-lib-display", children: [chipLinks("Type", [
                                            ["any", "Any"],
                                            ...Object.entries(KIND_WORDS),
                                        ], query.kind ?? "any", (v) => withMedia(query, { kind: v === "any" ? undefined : v })), chipLinks("Orientation", [
                                            ["any", "Any"],
                                            ...Object.entries(ORIENTATION_WORDS),
                                        ], query.orientation ?? "any", (v) => withMedia(query, { orientation: v === "any" ? undefined : v }))] }) })) : null, !picker ? (_jsx(Disclosure, { summary: `Display: ${display}`, children: _jsxs("div", { className: "cap-media-lib-display", children: [chipLinks("Sort", [
                                            ["added", SORT_WORDS.added],
                                            ["name", SORT_WORDS.name],
                                            ["size", SORT_WORDS.size],
                                            ...(offers.usage ? [["used", SORT_WORDS.used]] : []),
                                        ], sort, (v) => withMedia(query, { sort: v })), chipLinks("Direction", [
                                            ["desc", "Descending"],
                                            ["asc", "Ascending"],
                                        ], dir, (v) => withMedia(query, { sort, dir: v })), chipLinks("Group by", [
                                            ["flat", GROUP_WORDS.flat],
                                            ["folder", GROUP_WORDS.folder],
                                            ["month", GROUP_WORDS.month],
                                        ], query.group ?? "flat", (v) => withMedia(query, { group: v === "flat" ? undefined : v })), layout === "grid"
                                            ? chipLinks("Tile size", [
                                                ["s", "S"],
                                                ["m", "M"],
                                                ["l", "L"],
                                            ], tileSize, (v) => withMedia(query, { size: v }), (v) => remember({ size: v }))
                                            : null] }) })) : null, !picker && trash && can.deleteMedia && offers.trash && rows.length > 0 ? (_jsx(Form, { method: "post", action: action, className: "cap-media-lib-extra", children: _jsx("button", { type: "submit", className: "cap-btn", "data-variant": "danger", name: "intent", value: "empty-trash", children: "Empty Trash" }) })) : null, shrinkAll.length > 0 ? (_jsxs(Form, { method: "post", action: action, className: "cap-media-lib-extra", children: [_jsx("input", { type: "hidden", name: "intent", value: "resize" }), shrinkAll.map((r) => (_jsxs("span", { hidden: true, children: [_jsx("input", { type: "hidden", name: "ids", value: r.key }), _jsx("input", { type: "hidden", name: "versions", value: r.version })] }, r.key))), _jsxs("button", { type: "submit", className: "cap-btn", children: ["Shrink", " ", shrinkAll.length === 1 ? "this picture" : `all ${shrinkAll.length} on this page`] })] })) : null, !picker && data.extra?.toolbar?.length ? (_jsx(Form, { method: "post", action: action, className: "cap-media-lib-extra", children: data.extra.toolbar.map((a) => (_jsx("button", { type: "submit", className: "cap-btn", name: "intent", value: a.intent, children: a.label }, a.intent))) })) : null, uploads ? (_jsx("a", { className: "cap-btn cap-media-lib-upload-open", "data-variant": "primary", href: href(withMedia(query, { upload: true })), "aria-haspopup": mounted && submit ? "dialog" : undefined, onClick: (e) => {
                                    if (!submit)
                                        return;
                                    e.preventDefault();
                                    setUploadOpen(true);
                                }, children: "Upload" })) : null] })] })] }));
}
// The notes under the toolbar: sorted on this page only, what was copied, what others changed, what
// the site withheld and why.
export function LibraryNotes({ m }) {
    const { copied, href, inspected, inspectedMoved, live, page, picker, polling, query, stale, withheld, } = m;
    return (_jsxs(_Fragment, { children: [page.sortedOnPage ? (_jsx("p", { className: "cap-media-lib-note", children: "Sorted on this page only: this site does not sort its whole library." })) : null, !picker ? (_jsx("p", { className: "cap-media-lib-note", role: "status", children: copied })) : null, polling ? (_jsx("p", { className: "cap-media-lib-note", role: "status", "data-cap-part": "live", children: stale ? (_jsxs(_Fragment, { children: ["The library changed more than this page can follow.", " ", _jsx("a", { href: href(query), children: "Load it again" }), "."] })) : live.updated || live.elsewhere || inspectedMoved ? (_jsxs(_Fragment, { children: [[
                            live.updated
                                ? `${live.updated} ${live.updated === 1 ? "file was" : "files were"} changed elsewhere and ${live.updated === 1 ? "is" : "are"} shown as ${live.updated === 1 ? "it is" : "they are"} now.`
                                : null,
                            live.elsewhere
                                ? `${live.elsewhere} more changed that this page does not show.`
                                : null,
                            inspectedMoved ? `${inspected?.name} changed since you opened it.` : null,
                        ]
                            .filter(Boolean)
                            .join(" "), " ", live.elsewhere || inspectedMoved ? (_jsx("a", { href: href(query), children: "Load the page again" })) : null] })) : null })) : null, !picker && withheld.length ? (_jsx("ul", { className: "cap-media-lib-withheld", children: withheld.map((w) => (_jsx("li", { children: w }, w))) })) : null] }));
}
// The pager and the keyboard help.
export function LibraryFooter({ m }) {
    const { href, page, picker, query, shortcuts, title } = m;
    return (_jsxs(_Fragment, { children: [query.cursor || page.nextCursor ? (_jsxs("nav", { className: "cap-media-lib-pages", "aria-label": `${title} pages`, children: [query.cursor ? (_jsx("a", { className: "cap-btn", href: href(withMedia(query, {})), children: "First page" })) : null, page.nextCursor ? (_jsx("a", { className: "cap-btn", href: href({ ...withMedia(query, {}), cursor: page.nextCursor }), children: "Next page" })) : null] })) : null, !picker && shortcuts ? (_jsx(Disclosure, { summary: "Keyboard shortcuts", children: _jsx("dl", { className: "cap-media-lib-keys", children: KEYS.map(([spec, what]) => (_jsxs("div", { children: [_jsx("dt", { children: _jsx(Keys, { spec: spec }) }), _jsx("dd", { children: what })] }, what))) }) })) : null] }));
}
