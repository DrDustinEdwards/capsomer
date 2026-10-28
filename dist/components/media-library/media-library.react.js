import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { ContentBulkBar, PlainForm, useIntents } from "../content/content.react.js";
import { DropZone } from "../drop-zone/drop-zone.react.js";
import { Empty } from "../empty/empty.react.js";
import { MediaGrid, MediaInspector, useMediaMode } from "../media/media.react.js";
import { suggestedAlt } from "../media/media.js";
import { TabLink, TabsNav } from "../tabs/tabs.react.js";
import { countLine, emptyWords, inspectorOffers, mediaActions, mediaHref, nounsOf, pickable, uploadRules, withMedia } from "./media-library.js";
// One page of one site's files, the same component in Carrel and in every site admin: search, tag
// chips, the library and Trash, the grid or list of tiles, upload checked against the site's limits,
// the bulk bar with each file's outcome, the inspector (from ?inspect=) in form or autosave mode,
// Undo, and the confirmation for what cannot be undone. In picker mode, the same grid offers images
// and asks for the alt text this use needs. Every action is a form post, so it works with no
// script; `submit` adds the in-place path.
export function MediaLibrary({ data, action, Form = PlainForm, submit, result = null, labels, mode = "library", inspector = "form", onPick }) {
    const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
    const formId = `${uid}-bulk`;
    const { plural } = nounsOf(labels);
    const title = mode === "picker" ? "Choose an image" : plural.charAt(0).toUpperCase() + plural.slice(1);
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);
    const { rows, query, page, offers, can } = data;
    const path = action.split("?")[0] ?? action;
    const href = (q) => mediaHref(path, q);
    const picker = mode === "picker";
    const trash = query.view === "trash";
    const { bulk, withheld } = mediaActions(data, labels);
    const selectable = !picker && bulk.length > 0;
    const shown = picker ? pickable(rows) : rows;
    const names = useMemo(() => new Map(rows.map((r) => [r.key, r.name])), [rows]);
    const [selected, setSelected] = useState([]);
    useEffect(() => setSelected((s) => s.filter((k) => names.has(k))), [names]);
    const [active, setActive] = useState(query.inspect ?? query.pick ?? shown[0]?.key ?? "");
    const [chosen, setChosen] = useState(query.pick);
    useEffect(() => setChosen(query.pick), [query.pick]);
    const intents = useIntents({ action, Form, submit, result, names, cancelHref: href(withMedia(query, {})), onDone: () => setSelected([]) });
    // Moving to another view of the library (open a file, close it) with script is a GET of the
    // library's own form, so the host's router (React Router's <Form>) makes it a navigation in the
    // app and the loader reads the file with where it is used.
    const goRef = useRef(null);
    const [goTo, setGoTo] = useState(null);
    useEffect(() => {
        if (!goTo)
            return;
        goRef.current?.querySelector("form")?.requestSubmit();
    }, [goTo]);
    const go = (q) => setGoTo(q);
    const layoutRef = useRef(null);
    const inspectorMode = useMediaMode(layoutRef);
    const insRef = useRef(null);
    const inspected = picker ? null : (data.inspected ?? null);
    // A file the person opened (Enter or a click) gets focus in its first field once it is here; one
    // that came with the page leaves focus where the page put it.
    const opening = useRef(false);
    useEffect(() => {
        if (!opening.current)
            return;
        opening.current = false;
        if (picker)
            document.getElementById(`${uid}-pick-alt`)?.focus();
        else
            insRef.current?.focus();
    }, [inspected?.key, chosen, picker, uid]);
    const iOffers = inspectorOffers(data);
    // The inspector's autosave posts one `save` with every field the site keeps.
    const save = async (key, fields) => {
        if (!submit)
            return;
        const form = new FormData();
        form.set("intent", "save");
        form.set("ids", key);
        const version = rows.find((r) => r.key === key)?.version ?? inspected?.version;
        if (version)
            form.set("version", version);
        if (iOffers.alt) {
            form.set("alt", fields.alt);
            if (fields.decorative)
                form.set("decorative", "on");
        }
        if (iOffers.tags)
            form.set("tags", fields.tags.join(", "));
        const r = await submit(form);
        if (!r.ok)
            throw new Error(r.message);
    };
    // Picker mode with `onPick`: the alt step hands the file to the host instead of posting.
    const onSubmit = (e) => {
        const form = e.target;
        if (onPick && form instanceof HTMLFormElement && form.dataset.capPart === "pick") {
            e.preventDefault();
            const fd = new FormData(form, e.nativeEvent.submitter);
            const item = rows.find((r) => r.key === fd.get("ids"));
            if (item)
                onPick({ id: item.key, url: item.url, alt: fd.get("decorative") ? "" : String(fd.get("alt") ?? "").trim() });
            return;
        }
        intents.onSubmit(e);
    };
    if (intents.confirmPage) {
        return (_jsx("section", { className: "cap-media-lib", "data-cap": "media-library", "aria-label": title, children: intents.confirmPage }));
    }
    const pick = picker && chosen ? rows.find((r) => r.key === chosen) : undefined;
    const words = emptyWords(query, labels);
    const rules = offers.upload ? uploadRules(offers.upload, picker) : null;
    const canUpload = !!rules && can.edit && !trash;
    const layout = query.layout ?? "grid";
    return (_jsxs("section", { className: "cap-media-lib", "data-cap": "media-library", "data-mode": picker ? "picker" : undefined, "aria-label": title, ref: (el) => void (intents.rootRef.current = el), onSubmit: onSubmit, children: [_jsx("div", { ref: goRef, hidden: true, children: _jsx(Form, { method: "get", action: path, children: Object.entries(goTo ?? {}).map(([k, v]) => (v ? _jsx("input", { type: "hidden", name: k, value: v }, k) : null)) }) }), !picker && offers.trash ? (_jsxs(TabsNav, { "aria-label": `${title}: library or Trash`, className: "cap-media-lib-tabs", children: [_jsx(TabLink, { href: href(withMedia(query, { view: undefined })), current: !trash, count: data.counts?.library, children: "Library" }), _jsx(TabLink, { href: href(withMedia(query, { view: "trash" })), current: trash, count: data.counts?.trash, children: "Trash" })] })) : null, _jsxs(Form, { method: "get", action: path, className: "cap-media-lib-filters", role: "search", "aria-label": `Find ${plural}`, children: [["view", "layout", "tag", "lens"].map((k) => (query[k] ? _jsx("input", { type: "hidden", name: k, value: query[k] }, k) : null)), _jsxs("div", { className: "cap-field cap-media-lib-search", children: [_jsx("label", { className: "cap-field-label", htmlFor: `${uid}-q`, children: "Search" }), _jsx("input", { className: "cap-input", type: "search", id: `${uid}-q`, name: "q", defaultValue: query.q ?? "" })] }), _jsx("button", { type: "submit", className: "cap-btn", children: "Show" })] }), data.tags.length || data.extra?.lenses?.length ? (_jsxs("nav", { className: "cap-media-lib-chips", "aria-label": `Narrow the ${plural}`, children: [data.tags.length ? (_jsxs("ul", { className: "cap-chips", "aria-label": "Tags", children: [_jsx("li", { children: _jsx("a", { className: "cap-chip", href: href(withMedia(query, { tag: undefined })), "aria-current": !query.tag ? "true" : undefined, children: "Any tag" }) }), data.tags.map((t) => (_jsx("li", { children: _jsxs("a", { className: "cap-chip", href: href(withMedia(query, { tag: t.tag })), "aria-current": query.tag === t.tag ? "true" : undefined, children: [t.tag, t.count != null ? _jsx("span", { className: "cap-chip-count", children: t.count }) : null] }) }, t.tag)))] })) : null, data.extra?.lenses?.length && !picker ? (_jsx("ul", { className: "cap-chips", "aria-label": "Lenses", children: data.extra.lenses.map((l) => (_jsx("li", { children: _jsxs("a", { className: "cap-chip", href: href(withMedia(query, { lens: query.lens === l.id ? undefined : l.id })), "aria-current": query.lens === l.id ? "true" : undefined, children: [l.label, l.count != null ? _jsx("span", { className: "cap-chip-count", children: l.count }) : null] }) }, l.id))) })) : null] })) : null, _jsxs("div", { className: "cap-media-lib-bar", children: [_jsx("p", { className: "cap-media-lib-count", children: shown.length === 0 ? "" : countLine({ ...data, rows: shown }, labels) }), _jsxs("div", { className: "cap-media-lib-tools", children: [!picker ? (_jsxs("nav", { className: "cap-media-lib-layout", "aria-label": "Show as", children: [_jsx("a", { className: "cap-chip", href: href(withMedia(query, { layout: undefined })), "aria-current": layout === "grid" ? "true" : undefined, children: "Grid" }), _jsx("a", { className: "cap-chip", href: href(withMedia(query, { layout: "list" })), "aria-current": layout === "list" ? "true" : undefined, children: "List" })] })) : null, !picker && data.extra?.toolbar?.length ? (_jsx(Form, { method: "post", action: action, className: "cap-media-lib-extra", children: data.extra.toolbar.map((a) => (_jsx("button", { type: "submit", className: "cap-btn", name: "intent", value: a.intent, children: a.label }, a.intent))) })) : null] })] }), !picker && withheld.length ? (_jsx("ul", { className: "cap-media-lib-withheld", children: withheld.map((w) => (_jsx("li", { children: w }, w))) })) : null, canUpload && rules ? (_jsxs(Form, { method: "post", action: action, encType: "multipart/form-data", className: "cap-media-lib-upload", "aria-label": `Upload a ${nounsOf(labels).noun}`, children: [_jsx("input", { type: "hidden", name: "intent", value: "upload" }), _jsx(DropZone, { name: "file", accept: rules.accept, maxBytes: offers.upload?.maxBytes, hint: rules.hint }), _jsxs("div", { className: "cap-field", children: [_jsx("label", { className: "cap-field-label", htmlFor: `${uid}-upalt`, children: "Alt text" }), _jsx("input", { className: "cap-input", id: `${uid}-upalt`, name: "alt", type: "text", autoComplete: "off", "aria-describedby": `${uid}-upalt-help` }), _jsx("p", { className: "cap-field-help", id: `${uid}-upalt-help`, children: "What the picture shows, for a person who cannot see it. You can add it later." })] }), _jsx("button", { type: "submit", className: "cap-btn", "data-variant": "primary", children: "Upload" })] })) : null, intents.resultBox, selectable ? (_jsx(ContentBulkBar, { formId: formId, action: action, Form: Form, formClass: "cap-media-lib-bulk-form", items: rows.filter((r) => selected.includes(r.key)).map((r) => ({ id: r.key, label: r.name })), total: shown.length, onSelectAll: mounted ? () => setSelected(shown.filter((r) => r.state === "ready" || r.state === "binned").map((r) => r.key)) : undefined, onClear: () => setSelected([]), plural: plural, actions: bulk, tag: bulk.some((a) => a.intent === "add-tags"), intents: intents })) : null, _jsx("div", { className: "cap-media", "data-size": "m", "data-view": layout === "list" ? "list" : undefined, children: _jsxs("div", { className: "cap-media-layout", ref: layoutRef, children: [_jsx("div", { className: "cap-media-main", children: shown.length === 0 ? (_jsx(Empty, { kind: words.kind, title: words.title, action: words.kind === "no-match" ? (_jsx("a", { className: "cap-btn", href: href(withMedia(query, { q: undefined, tag: undefined, lens: undefined })), children: "Clear filters" })) : undefined, children: words.text })) : (_jsx(MediaGrid, { items: shown, activeKey: active, onActiveChange: setActive, selected: selected, onSelectedChange: setSelected, selectable: selectable, selectForm: selectable ? formId : undefined, hrefFor: (key) => href(withMedia(query, picker ? { pick: key } : { inspect: key })), onOpen: (key) => {
                                    if (key === (picker ? chosen : inspected?.key)) {
                                        if (picker)
                                            document.getElementById(`${uid}-pick-alt`)?.focus();
                                        else
                                            insRef.current?.focus();
                                        return;
                                    }
                                    opening.current = true;
                                    if (picker)
                                        return setChosen(key);
                                    go(withMedia(query, { inspect: key }));
                                }, inspecting: !!inspected, label: picker ? "Images" : trash ? "Files in Trash" : "Files" })) }), inspected ? (_jsx(MediaInspector, { ref: insRef, id: `${uid}-ins`, item: inspected, open: true, mode: inspectorMode, onSave: save, onClose: () => go(withMedia(query, { inspect: undefined })), onStep: (dir) => {
                                const keys = shown.filter((r) => r.state === "ready" || r.state === "binned").map((r) => r.key);
                                const next = keys[keys.indexOf(inspected.key) + (dir === "next" ? 1 : -1)];
                                if (next)
                                    go(withMedia(query, { inspect: next }));
                            }, show: { alt: iOffers.alt, title: false, caption: false, tags: iOffers.tags }, saving: inspector === "autosave" && submit ? "auto" : "form", action: action, Form: Form, closeHref: href(withMedia(query, { inspect: undefined })), can: { trash: iOffers.trash, delete: iOffers.delete && (trash || !offers.trash) } })) : null] }) }), pick ? (_jsxs(Form, { method: "post", action: action, className: "cap-media-pick", "data-cap-part": "pick", "aria-labelledby": `${uid}-pick-h`, children: [_jsx("input", { type: "hidden", name: "intent", value: "pick" }), _jsx("input", { type: "hidden", name: "ids", value: pick.key }), _jsxs("h3", { className: "cap-media-pick-title", id: `${uid}-pick-h`, children: ["Alt text for ", pick.name] }), pick.thumb ? _jsx("img", { className: "cap-media-pick-preview", src: pick.thumb, alt: "", width: 160, height: 160 }) : null, _jsxs("div", { className: "cap-field", children: [_jsx("label", { className: "cap-field-label", htmlFor: `${uid}-pick-alt`, children: "Alt text (required)" }), _jsx("textarea", { className: "cap-input", id: `${uid}-pick-alt`, name: "alt", rows: 2, required: true, defaultValue: pick.alt, "aria-describedby": `${uid}-pick-help` }), _jsxs("p", { className: "cap-field-help", id: `${uid}-pick-help`, children: ["What a person who cannot see the picture needs to know here. ", pick.alt ? "It starts with the file's own alt text." : `Suggested: ${suggestedAlt(pick.name)}.`] })] }), _jsxs("div", { className: "cap-media-pick-actions", children: [_jsx("button", { type: "submit", className: "cap-btn", "data-variant": "primary", children: "Insert" }), _jsx("button", { type: "submit", className: "cap-btn", name: "decorative", value: "on", formNoValidate: true, children: "Insert as decorative" }), _jsx("a", { className: "cap-btn", "data-variant": "quiet", href: href(withMedia(query, { pick: undefined })), onClick: (e) => {
                                    if (!mounted)
                                        return;
                                    e.preventDefault();
                                    setChosen(undefined);
                                }, children: "Choose another" })] })] })) : null, query.cursor || page.nextCursor ? (_jsxs("nav", { className: "cap-media-lib-pages", "aria-label": `${title} pages`, children: [query.cursor ? (_jsx("a", { className: "cap-btn", href: href(withMedia(query, {})), children: "First page" })) : null, page.nextCursor ? (_jsx("a", { className: "cap-btn", href: href({ ...withMedia(query, {}), cursor: page.nextCursor }), children: "Next page" })) : null] })) : null, intents.confirmDialog] }));
}
