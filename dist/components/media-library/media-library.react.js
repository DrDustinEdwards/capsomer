import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { CommandMenu } from "../command-menu/command-menu.react.js";
import { ContentBulkBar, PlainForm, useIntents } from "../content/content.react.js";
import { Disclosure } from "../disclosure/disclosure.react.js";
import { DropZone } from "../drop-zone/drop-zone.react.js";
import { Empty } from "../empty/empty.react.js";
import { MediaGrid, MediaInspector, useMediaMode } from "../media/media.react.js";
import { bareType, byteSize, copyText, CROPPABLE } from "../media/media.js";
import { acceptLabel, formatBytes } from "../drop-zone/drop-zone.js";
import { readPref, writePref } from "../shell/shell.js";
import { Keys, useShortcut } from "../shortcuts/shortcuts.react.js";
import { TabLink, TabsNav } from "../tabs/tabs.react.js";
import { MediaMore } from "./media-library-more.react.js";
import { applyChanges, countLine, dirOf, emptyWords, filesToOpen, groupRows, inspectorOffers, KIND_WORDS, lensChips, mediaActions, mediaHref, nounsOf, ORIENTATION_WORDS, oversized, pickable, recordOfKit, SORT_DIR, uploadRules, withMedia } from "./media-library.js";
// The viewer's last layout and tile size, remembered in this browser (shell.ts readPref).
const LAYOUT_PREF = "cap-media-layout";
const SIZE_PREF = "cap-media-size";
const SORT_WORDS = { added: "Newest", name: "A to Z", size: "Largest", used: "Most used" };
// How often the library asks for what others changed, with script and `changes` (site-api v0.13.0).
const LIVE_MS = 15000;
const GROUP_WORDS = { flat: "None", folder: "Folder", month: "Month" };
const KEYS = [
    [["Mod+k", "/"], "Find a file"],
    [["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"], "Move through the files"],
    [["Home", "End"], "First or last file"],
    ["Enter", "Open the file's details"],
    [["Space", "x"], "Select the file"],
    ["Escape", "Clear the selection, then close the details"],
];
// One page of one site's files, the same component in Carrel and in every site admin: search, tag
// chips, the library and Trash, the grid or list of tiles, upload checked against the site's limits,
// the bulk bar with each file's outcome, the inspector (from ?inspect=) in form or autosave mode,
// Undo, and the confirmation for what cannot be undone. In picker mode, the same grid offers images
// and asks for the alt text this use needs. Every action is a form post, so it works with no
// script; `submit` adds the in-place path.
export function MediaLibrary({ data, action, Form = PlainForm, submit, result = null, labels, mode = "library", inspector = "form", onPick, search, shortcuts = true, bytesHref, changes }) {
    const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
    const formId = `${uid}-bulk`;
    const { plural } = nounsOf(labels);
    const title = mode === "picker" ? "Choose an image" : plural.charAt(0).toUpperCase() + plural.slice(1);
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);
    const { query, page, offers, can } = data;
    const path = action.split("?")[0] ?? action;
    const href = (q) => mediaHref(path, q);
    const picker = mode === "picker";
    // Live: what others changed, put over the page's rows until the page itself is loaded again.
    const [changed, setChanged] = useState(new Map());
    const [stale, setStale] = useState(false);
    useEffect(() => {
        setChanged(new Map());
        setStale(false);
    }, [data.rows]);
    const cursor = page.changeCursor;
    const polling = !!changes && !!offers.live && !!cursor && !picker;
    const changesRef = useRef(changes);
    changesRef.current = changes;
    useEffect(() => {
        if (!polling || !cursor)
            return;
        const stop = new AbortController();
        let from = cursor;
        let timer = 0;
        const next = (ms) => {
            timer = window.setTimeout(() => void poll(), ms);
        };
        const poll = async () => {
            if (document.hidden)
                return next(LIVE_MS);
            try {
                const got = await changesRef.current?.(from, stop.signal);
                if (!got || stop.signal.aborted)
                    return;
                if ("reload" in got)
                    return setStale(true);
                if (got.rows.length || got.removed.length) {
                    setChanged((was) => {
                        const now = new Map(was);
                        for (const r of got.rows)
                            now.set(r.id, recordOfKit(r));
                        for (const id of got.removed)
                            now.set(id, null);
                        return now;
                    });
                }
                from = got.changeCursor;
                next(got.more ? 0 : LIVE_MS);
            }
            catch {
                // The site did not answer: ask again later, quietly.
                if (!stop.signal.aborted)
                    next(LIVE_MS * 2);
            }
        };
        next(LIVE_MS);
        return () => {
            stop.abort();
            window.clearTimeout(timer);
        };
    }, [polling, cursor]);
    const live = useMemo(() => applyChanges(data.rows, changed, query), [data.rows, changed, query]);
    const rows = live.rows;
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
    // The last result the script path got, for the links to what an upload, an import or a turn left
    // to open; the page's own result otherwise.
    const [last, setLast] = useState(null);
    useEffect(() => setLast(null), [result]);
    const tracked = submit
        ? async (form) => {
            const r = await submit(form);
            setLast(r);
            return r;
        }
        : undefined;
    const intents = useIntents({ action, Form, submit: tracked, result, names, cancelHref: href(withMedia(query, {})), onDone: () => setSelected([]) });
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
    const pickAlt = useRef(null);
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
    const inspectedMoved = !!inspected && changed.has(inspected.key) && changed.get(inspected.key)?.version !== inspected.version;
    // Grid or list and the tile size: the address's when a link set them, else this viewer's last
    // choice (read after mount, so the server's HTML and the first paint agree).
    const [pref, setPref] = useState({});
    useEffect(() => {
        const l = readPref(LAYOUT_PREF);
        const z = readPref(SIZE_PREF);
        setPref({ ...(l === "grid" || l === "list" ? { layout: l } : {}), ...(z === "s" || z === "m" || z === "l" ? { size: z } : {}) });
    }, []);
    const remember = (change) => {
        if (change.layout)
            writePref(LAYOUT_PREF, change.layout);
        if (change.size)
            writePref(SIZE_PREF, change.size);
        setPref((p) => ({ ...p, ...change }));
    };
    // Quick search: the command menu over the host's matches, or focus in the search field.
    const [finding, setFinding] = useState(false);
    useShortcut(["Mod+k", "/"], () => {
        if (search)
            return setFinding(true);
        const field = document.getElementById(`${uid}-q`);
        if (field instanceof HTMLInputElement) {
            field.focus();
            field.select();
        }
    }, { label: `Find a ${nounsOf(labels).noun}`, group: "Media", when: () => shortcuts && !picker });
    // Copying an address says so, in words, where the person is looking.
    const [copied, setCopied] = useState("");
    const copyAddress = async (r) => {
        const ok = await copyText(r.url);
        setCopied(ok ? `Copied the address of ${r.name}.` : `Could not copy. The address of ${r.name} is ${r.url}`);
    };
    const find = async (text, signal) => {
        const found = (search ? await search(text, signal) : []).slice(0, 8);
        return [
            ...found.map((r) => ({
                id: `file-${r.key}`,
                label: r.name,
                group: plural.charAt(0).toUpperCase() + plural.slice(1),
                keywords: [r.key],
                hint: [r.type.split("/").pop()?.toUpperCase(), byteSize(r.bytes)].filter(Boolean).join(" · "),
                run: () => {
                    opening.current = true;
                    go(withMedia(query, { inspect: r.key }));
                },
            })),
            ...found.map((r) => ({ id: `copy-${r.key}`, label: `Copy the address of ${r.name}`, group: "Copy the address", keywords: [r.key], run: () => void copyAddress(r) })),
            { id: "search-all", label: `Search for “${text}”`, group: "Search", run: () => go(withMedia(query, { q: text })) },
        ];
    };
    // Esc on a tile clears the selection first, then closes the file's details.
    const onGridKey = (e) => {
        if (e.key !== "Escape" || e.defaultPrevented || !e.target.closest(".cap-media-tile"))
            return;
        if (selected.length) {
            e.preventDefault();
            setSelected([]);
        }
        else if (inspected) {
            e.preventDefault();
            opening.current = false;
            go(withMedia(query, { inspect: undefined }));
        }
    };
    // The inspector's autosave posts the content kit's own intents, one for each field group that
    // changed (`alt`, `caption`, `tags`), each on the version the last write made (site-api's
    // Outcome.version), so a host passes every form straight on. What was saved, and on which version,
    // is kept per file until the host's rows catch up.
    const savedRef = useRef(new Map());
    const save = async (key, fields) => {
        if (!submit)
            return;
        const item = rows.find((r) => r.key === key) ?? (inspected?.key === key ? inspected : undefined);
        const kept = savedRef.current.get(key);
        const fresh = !kept || (item?.version !== kept.base && item?.version !== kept.version);
        const was = !fresh && kept ? kept.fields : { alt: item?.alt ?? "", decorative: item?.altState === "decorative", title: item?.title ?? "", caption: item?.caption ?? "", tags: item?.tags ?? [] };
        let version = !fresh && kept ? kept.version : item?.version;
        const base = item?.version;
        const writes = [];
        if (iOffers.alt && (fields.alt !== was.alt || fields.decorative !== was.decorative)) {
            writes.push(["alt", (f) => {
                    f.set("alt", fields.decorative ? "" : fields.alt);
                    if (fields.decorative)
                        f.set("decorative", "on");
                }, (d) => ({ ...d, alt: fields.alt, decorative: fields.decorative })]);
        }
        if (iOffers.caption && fields.caption !== was.caption)
            writes.push(["caption", (f) => f.set("caption", fields.caption), (d) => ({ ...d, caption: fields.caption })]);
        if (iOffers.tags && fields.tags.join(", ") !== was.tags.join(", "))
            writes.push(["tags", (f) => f.set("tags", fields.tags.join(", ")), (d) => ({ ...d, tags: fields.tags })]);
        let done = was;
        for (const [intent, fill, after] of writes) {
            const form = new FormData();
            form.set("intent", intent);
            form.set("ids", key);
            if (version)
                form.set("versions", version);
            fill(form);
            const r = await submit(form);
            if (!r.ok)
                throw new Error(r.message);
            version = r.outcomes?.find((o) => o.id === key)?.version ?? version;
            done = after(done);
            savedRef.current.set(key, { base, version, fields: done });
        }
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
    // The model's alt text for the picked file, where the host read it (the kit's detail for `pick`
    // with `suggest`). Shown and offered; never put in the field unless the person chooses it.
    const suggestions = pick && data.inspected?.key === pick.key ? data.suggestions : undefined;
    const pickSuggestion = suggestions?.alt ?? "";
    const words = emptyWords(query, labels);
    const rules = offers.upload ? uploadRules(offers.upload, picker) : null;
    const canUpload = !!rules && can.edit && !trash;
    const canImport = !picker && can.edit && !trash && !!offers.import && !!offers.upload;
    // Where the site shrinks large pictures at upload, a box keeps this one at its own size.
    const keepSize = (id) => offers.resize ? (_jsxs("div", { className: "cap-field", children: [_jsxs("label", { className: "cap-check", children: [_jsx("input", { type: "checkbox", name: "resize", value: "no", "aria-describedby": `${uid}-${id}-size-help` }), " Keep it at full size"] }), _jsxs("p", { className: "cap-field-help", id: `${uid}-${id}-size-help`, children: ["This site shrinks a picture whose longer edge is over ", offers.resize.maxEdge, " pixels."] })] })) : null;
    const filters = !picker && !trash && !!offers.filters;
    const filterWords = [query.kind ? KIND_WORDS[query.kind] : null, query.orientation ? ORIENTATION_WORDS[query.orientation] : null].filter(Boolean).join(", ") || "everything";
    const toOpen = picker ? [] : filesToOpen(last ?? result);
    const nameOf = (id) => names.get(id) ?? id.split("/").pop() ?? id;
    // The resize pass: every oversized picture on this page, from the oversized lens.
    const shrinkAll = !picker && query.lens === "oversized" && iOffers.resize != null ? rows.filter((r) => r.state === "ready" && !!r.version && oversized(r, iOffers.resize)) : [];
    // The picture tools for the open file: the focal point, replace (the file's own type, the site's
    // size limit) and crop (with script and the host's same-origin bytes).
    const tools = (item) => {
        const type = bareType(item.type);
        const asNew = can.edit && !!offers.upload?.types.includes(type);
        const replace = iOffers.replace && !!item.version && offers.upload ? { accept: type, hint: `A new ${acceptLabel(type)} file, up to ${formatBytes(offers.upload.maxBytes)}.` } : null;
        const crop = bytesHref && submit && CROPPABLE.includes(type) && (asNew || replace)
            ? {
                src: bytesHref(item.key),
                asNew,
                inPlace: !!replace,
                onSave: async (file, how) => {
                    const form = new FormData();
                    form.set("intent", how === "new" ? "upload" : "replace");
                    if (how === "replace") {
                        form.set("ids", item.key);
                        if (item.version)
                            form.set("versions", item.version);
                    }
                    form.set("file", file);
                    const r = await intents.run(form);
                    if (!r?.ok)
                        throw new Error(r?.message ?? "The crop was not saved.");
                    const made = how === "new" ? r.outcomes?.find((o) => o.ok)?.id : undefined;
                    if (made)
                        go(withMedia(query, { inspect: made }));
                },
            }
            : null;
        return { focus: iOffers.focus && !!item.version, replace, crop, keepsSize: !!offers.replaceKeepsSize };
    };
    const layout = query.layout ?? pref.layout ?? "grid";
    const tileSize = query.size ?? pref.size ?? "m";
    const sort = query.sort ?? "added";
    const dir = dirOf(query);
    const lenses = picker || trash ? [] : lensChips(data);
    const lensHint = lenses.find((l) => l.id === query.lens)?.hint;
    const groups = groupRows(shown, query.group);
    const display = [`${SORT_WORDS[sort]}${dir === SORT_DIR[sort] ? "" : ", reversed"}`, query.group ? `by ${query.group}` : null, layout === "grid" ? `size ${tileSize.toUpperCase()}` : null].filter(Boolean).join(", ");
    const chipLinks = (label, options, current, to, onPick) => (_jsxs("nav", { className: "cap-media-lib-layout", "aria-label": label, children: [_jsx("span", { className: "cap-media-lib-tool-label", "aria-hidden": "true", children: label }), options.map(([v, text]) => (_jsx("a", { className: "cap-chip", href: href(to(v)), "aria-current": current === v ? "true" : undefined, onClick: onPick ? () => onPick(v) : undefined, children: text }, v)))] }));
    return (_jsxs("section", { className: "cap-media-lib", "data-cap": "media-library", "data-mode": picker ? "picker" : undefined, "aria-label": title, ref: (el) => void (intents.rootRef.current = el), onSubmit: onSubmit, children: [_jsx("div", { ref: goRef, hidden: true, children: _jsx(Form, { method: "get", action: path, children: [...new URLSearchParams(mediaHref("", goTo ?? {}).split("?")[1] ?? "")].map(([k, v]) => (_jsx("input", { type: "hidden", name: k, value: v }, k))) }) }), !picker && offers.trash ? (_jsxs(TabsNav, { "aria-label": `${title}: library or Trash`, className: "cap-media-lib-tabs", children: [_jsx(TabLink, { href: href(withMedia(query, { view: undefined })), current: !trash, count: data.counts?.library, children: "Library" }), _jsx(TabLink, { href: href(withMedia(query, { view: "trash" })), current: trash, count: data.counts?.trash, children: "Trash" })] })) : null, _jsxs(Form, { method: "get", action: path, className: "cap-media-lib-filters", role: "search", "aria-label": `Find ${plural}`, children: [["view", "layout", "size", "tag", "kind", "orientation", "lens", "sort", "dir", "group"].map((k) => (query[k] ? _jsx("input", { type: "hidden", name: k, value: query[k] }, k) : null)), _jsxs("div", { className: "cap-field cap-media-lib-search", children: [_jsx("label", { className: "cap-field-label", htmlFor: `${uid}-q`, children: "Search" }), _jsx("input", { className: "cap-input", type: "search", id: `${uid}-q`, name: "q", defaultValue: query.q ?? "" })] }), _jsx("button", { type: "submit", className: "cap-btn", children: "Show" })] }), data.tags.length || lenses.length ? (_jsxs("nav", { className: "cap-media-lib-chips", "aria-label": `Narrow the ${plural}`, children: [data.tags.length ? (_jsxs("ul", { className: "cap-chips", "aria-label": "Tags", children: [_jsx("li", { children: _jsx("a", { className: "cap-chip", href: href(withMedia(query, { tag: undefined })), "aria-current": !query.tag ? "true" : undefined, children: "Any tag" }) }), data.tags.map((t) => (_jsx("li", { children: _jsxs("a", { className: "cap-chip", href: href(withMedia(query, { tag: t.tag })), "aria-current": query.tag === t.tag ? "true" : undefined, children: [t.tag, t.count != null ? _jsx("span", { className: "cap-chip-count", children: t.count }) : null] }) }, t.tag)))] })) : null, lenses.length ? (_jsx("ul", { className: "cap-chips", "aria-label": "Lenses", children: lenses.map((l) => (_jsx("li", { children: _jsxs("a", { className: "cap-chip", href: href(withMedia(query, { lens: query.lens === l.id ? undefined : l.id })), "aria-current": query.lens === l.id ? "true" : undefined, title: l.hint, children: [l.label, l.count != null ? _jsx("span", { className: "cap-chip-count", children: l.count }) : null] }) }, l.id))) })) : null, lensHint ? _jsx("p", { className: "cap-media-lib-note", children: lensHint }) : null] })) : null, _jsxs("div", { className: "cap-media-lib-bar", children: [_jsx("p", { className: "cap-media-lib-count", children: shown.length === 0 ? "" : countLine({ ...data, rows: shown }, labels) }), _jsxs("div", { className: "cap-media-lib-tools", children: [!picker ? (_jsxs("nav", { className: "cap-media-lib-layout", "aria-label": "Show as", children: [_jsx("a", { className: "cap-chip", href: href(withMedia(query, { layout: undefined })), "aria-current": layout === "grid" ? "true" : undefined, onClick: () => remember({ layout: "grid" }), children: "Grid" }), _jsx("a", { className: "cap-chip", href: href(withMedia(query, { layout: "list" })), "aria-current": layout === "list" ? "true" : undefined, onClick: () => remember({ layout: "list" }), children: "List" })] })) : null, filters ? (_jsx(Disclosure, { summary: `Filter: ${filterWords}`, children: _jsxs("div", { className: "cap-media-lib-display", children: [chipLinks("Type", [["any", "Any"], ...Object.entries(KIND_WORDS)], query.kind ?? "any", (v) => withMedia(query, { kind: v === "any" ? undefined : v })), chipLinks("Orientation", [["any", "Any"], ...Object.entries(ORIENTATION_WORDS)], query.orientation ?? "any", (v) => withMedia(query, { orientation: v === "any" ? undefined : v }))] }) })) : null, !picker ? (_jsx(Disclosure, { summary: `Display: ${display}`, children: _jsxs("div", { className: "cap-media-lib-display", children: [chipLinks("Sort", [["added", SORT_WORDS.added], ["name", SORT_WORDS.name], ["size", SORT_WORDS.size], ...(offers.usage ? [["used", SORT_WORDS.used]] : [])], sort, (v) => withMedia(query, { sort: v })), chipLinks("Direction", [["desc", "Descending"], ["asc", "Ascending"]], dir, (v) => withMedia(query, { sort, dir: v })), chipLinks("Group by", [["flat", GROUP_WORDS.flat], ["folder", GROUP_WORDS.folder], ["month", GROUP_WORDS.month]], query.group ?? "flat", (v) => withMedia(query, { group: v === "flat" ? undefined : v })), layout === "grid" ? chipLinks("Tile size", [["s", "S"], ["m", "M"], ["l", "L"]], tileSize, (v) => withMedia(query, { size: v }), (v) => remember({ size: v })) : null] }) })) : null, !picker && trash && can.deleteMedia && offers.trash && rows.length > 0 ? (_jsx(Form, { method: "post", action: action, className: "cap-media-lib-extra", children: _jsx("button", { type: "submit", className: "cap-btn", "data-variant": "danger", name: "intent", value: "empty-trash", children: "Empty Trash" }) })) : null, shrinkAll.length > 0 ? (_jsxs(Form, { method: "post", action: action, className: "cap-media-lib-extra", children: [_jsx("input", { type: "hidden", name: "intent", value: "resize" }), shrinkAll.map((r) => (_jsxs("span", { hidden: true, children: [_jsx("input", { type: "hidden", name: "ids", value: r.key }), _jsx("input", { type: "hidden", name: "versions", value: r.version })] }, r.key))), _jsxs("button", { type: "submit", className: "cap-btn", children: ["Shrink ", shrinkAll.length === 1 ? "this picture" : `all ${shrinkAll.length} on this page`] })] })) : null, !picker && data.extra?.toolbar?.length ? (_jsx(Form, { method: "post", action: action, className: "cap-media-lib-extra", children: data.extra.toolbar.map((a) => (_jsx("button", { type: "submit", className: "cap-btn", name: "intent", value: a.intent, children: a.label }, a.intent))) })) : null] })] }), page.sortedOnPage ? _jsx("p", { className: "cap-media-lib-note", children: "Sorted on this page only: this site does not sort its whole library." }) : null, !picker ? (_jsx("p", { className: "cap-media-lib-note", role: "status", children: copied })) : null, polling ? (_jsx("p", { className: "cap-media-lib-note", role: "status", "data-cap-part": "live", children: stale ? (_jsxs(_Fragment, { children: ["The library changed more than this page can follow. ", _jsx("a", { href: href(query), children: "Load it again" }), "."] })) : live.updated || live.elsewhere || inspectedMoved ? (_jsxs(_Fragment, { children: [[live.updated ? `${live.updated} ${live.updated === 1 ? "file was" : "files were"} changed elsewhere and ${live.updated === 1 ? "is" : "are"} shown as ${live.updated === 1 ? "it is" : "they are"} now.` : null, live.elsewhere ? `${live.elsewhere} more changed that this page does not show.` : null, inspectedMoved ? `${inspected?.name} changed since you opened it.` : null].filter(Boolean).join(" "), " ", live.elsewhere || inspectedMoved ? _jsx("a", { href: href(query), children: "Load the page again" }) : null] })) : null })) : null, !picker && withheld.length ? (_jsx("ul", { className: "cap-media-lib-withheld", children: withheld.map((w) => (_jsx("li", { children: w }, w))) })) : null, canUpload && rules ? (_jsxs(Form, { method: "post", action: action, encType: "multipart/form-data", className: "cap-media-lib-upload", "aria-label": `Upload a ${nounsOf(labels).noun}`, children: [_jsx("input", { type: "hidden", name: "intent", value: "upload" }), _jsx(DropZone, { name: "file", accept: rules.accept, maxBytes: offers.upload?.maxBytes, hint: rules.hint }), _jsxs("div", { className: "cap-field", children: [_jsx("label", { className: "cap-field-label", htmlFor: `${uid}-upalt`, children: "Alt text" }), _jsx("input", { className: "cap-input", id: `${uid}-upalt`, name: "alt", type: "text", autoComplete: "off", "aria-describedby": `${uid}-upalt-help` }), _jsx("p", { className: "cap-field-help", id: `${uid}-upalt-help`, children: "What the picture shows, for a person who cannot see it. A picture without it is flagged No alt text, and every use of it asks for alt text or a decorative choice." })] }), keepSize("up"), _jsx("button", { type: "submit", className: "cap-btn", "data-variant": "primary", children: "Upload" })] })) : null, canImport ? (_jsx(Disclosure, { summary: "Import from a web address", children: _jsxs(Form, { method: "post", action: action, className: "cap-media-lib-upload", "aria-label": `Import a ${nounsOf(labels).noun} from the web`, children: [_jsx("input", { type: "hidden", name: "intent", value: "import" }), _jsxs("div", { className: "cap-field", children: [_jsx("label", { className: "cap-field-label", htmlFor: `${uid}-import`, children: "Web address" }), _jsx("input", { className: "cap-input", id: `${uid}-import`, name: "url", type: "url", inputMode: "url", autoComplete: "off", required: true, placeholder: "https://", "aria-describedby": `${uid}-import-help` }), _jsxs("p", { className: "cap-field-help", id: `${uid}-import-help`, children: ["The site fetches its own copy and serves that, never the other site's. An https address only. ", rules ? rules.hint : ""] })] }), _jsxs("div", { className: "cap-field", children: [_jsx("label", { className: "cap-field-label", htmlFor: `${uid}-imalt`, children: "Alt text" }), _jsx("input", { className: "cap-input", id: `${uid}-imalt`, name: "alt", type: "text", autoComplete: "off", "aria-describedby": `${uid}-upalt-help` })] }), keepSize("im"), _jsx("button", { type: "submit", className: "cap-btn", children: "Import" })] }) })) : null, intents.resultBox, toOpen.length > 0 ? (_jsx("ul", { className: "cap-media-lib-opened", "aria-label": "Files to open", children: toOpen.map((f) => (_jsx("li", { children: _jsx("a", { href: href(withMedia(query, { inspect: f.id })), children: f.why === "duplicate" ? `Open ${nameOf(f.id)}, the file already stored` : f.why === "copy" ? `Open the new file, ${nameOf(f.id)}` : `Open ${nameOf(f.id)}` }) }, `${f.why}:${f.id}`))) })) : null, selectable ? (_jsx(ContentBulkBar, { formId: formId, action: action, Form: Form, formClass: "cap-media-lib-bulk-form", items: rows.filter((r) => selected.includes(r.key)).map((r) => ({ id: r.key, label: r.name })), total: shown.length, onSelectAll: mounted ? () => setSelected(shown.filter((r) => r.state === "ready" || r.state === "binned").map((r) => r.key)) : undefined, onClear: () => setSelected([]), plural: plural, actions: bulk, tag: bulk.some((a) => a.intent === "tag-add"), tagName: "tags", intents: intents })) : null, _jsx("div", { className: "cap-media", "data-size": tileSize, "data-view": layout === "list" ? "list" : undefined, children: _jsxs("div", { className: "cap-media-layout", ref: layoutRef, children: [_jsx("div", { className: "cap-media-main", onKeyDown: onGridKey, children: shown.length === 0 ? (_jsx(Empty, { kind: words.kind, title: words.title, action: words.kind === "no-match" ? (_jsx("a", { className: "cap-btn", href: href(withMedia(query, { q: undefined, tag: undefined, lens: undefined })), children: "Clear filters" })) : undefined, children: words.text })) : (_jsx(MediaGrid, { items: groups ? undefined : shown, groups: groups ?? undefined, activeKey: active, onActiveChange: setActive, selected: selected, onSelectedChange: setSelected, selectable: selectable, selectForm: selectable ? formId : undefined, hrefFor: (key) => href(withMedia(query, picker ? { pick: key } : { inspect: key })), onOpen: (key) => {
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
                            }, show: { alt: iOffers.alt, title: false, caption: iOffers.caption, tags: iOffers.tags }, tools: tools(inspected), onTool: (form) => void intents.run(form), saving: inspector === "autosave" && submit ? "auto" : "form", action: action, Form: Form, closeHref: href(withMedia(query, { inspect: undefined })), can: { trash: iOffers.trash, delete: iOffers.delete && (trash || !offers.trash) }, more: ({ Tool, ident, base }) => (_jsx(MediaMore, { item: inspected, data: data, Tool: Tool, ident: ident, base: base, action: action, inspectHref: (key) => href(withMedia(query, { inspect: key })), suggestHref: href(withMedia(query, { inspect: inspected.key, suggest: true })), unsuggestHref: href(withMedia(query, { inspect: inspected.key })) })) })) : null] }) }), pick ? (_jsxs(Form, { method: "post", action: action, className: "cap-media-pick", "data-cap-part": "pick", "aria-labelledby": `${uid}-pick-h`, children: [_jsx("input", { type: "hidden", name: "intent", value: "pick" }), _jsx("input", { type: "hidden", name: "ids", value: pick.key }), _jsxs("h3", { className: "cap-media-pick-title", id: `${uid}-pick-h`, children: ["Alt text for ", pick.name] }), pick.thumb ? _jsx("img", { className: "cap-media-pick-preview", src: pick.thumb, alt: "", width: 160, height: 160 }) : null, _jsxs("div", { className: "cap-field", children: [_jsx("label", { className: "cap-field-label", htmlFor: `${uid}-pick-alt`, children: "Alt text (required)" }), _jsx("textarea", { ref: pickAlt, className: "cap-input", id: `${uid}-pick-alt`, name: "alt", rows: 2, required: true, defaultValue: pick.alt, "aria-describedby": `${uid}-pick-help` }), _jsxs("p", { className: "cap-field-help", id: `${uid}-pick-help`, children: ["What a person who cannot see the picture needs to know here, or Insert as decorative if it adds nothing. ", pick.alt ? "It starts with the file's own alt text." : null] }), pickSuggestion ? (_jsxs("p", { className: "cap-field-help", "data-cap-part": "pick-suggestion", children: [suggestions?.model, " suggests: \u201C", pickSuggestion, "\u201D", " ", mounted ? (_jsx("button", { type: "button", className: "cap-btn", "data-variant": "quiet", onClick: () => {
                                            if (!pickAlt.current)
                                                return;
                                            pickAlt.current.value = pickSuggestion;
                                            pickAlt.current.focus();
                                        }, children: "Use it" })) : null] })) : iOffers.suggest && offers.alt && suggestions === undefined ? (_jsxs("p", { className: "cap-field-help", children: [_jsx("a", { href: href(withMedia(query, { pick: pick.key, suggest: true })), children: "Suggest alt text" }), " asks the site's model; nothing is filled in unless you choose it."] })) : null] }), _jsxs("div", { className: "cap-media-pick-actions", children: [_jsx("button", { type: "submit", className: "cap-btn", "data-variant": "primary", children: "Insert" }), _jsx("button", { type: "submit", className: "cap-btn", name: "decorative", value: "on", formNoValidate: true, children: "Insert as decorative" }), _jsx("a", { className: "cap-btn", "data-variant": "quiet", href: href(withMedia(query, { pick: undefined })), onClick: (e) => {
                                    if (!mounted)
                                        return;
                                    e.preventDefault();
                                    setChosen(undefined);
                                }, children: "Choose another" })] })] })) : null, query.cursor || page.nextCursor ? (_jsxs("nav", { className: "cap-media-lib-pages", "aria-label": `${title} pages`, children: [query.cursor ? (_jsx("a", { className: "cap-btn", href: href(withMedia(query, {})), children: "First page" })) : null, page.nextCursor ? (_jsx("a", { className: "cap-btn", href: href({ ...withMedia(query, {}), cursor: page.nextCursor }), children: "Next page" })) : null] })) : null, !picker && shortcuts ? (_jsx(Disclosure, { summary: "Keyboard shortcuts", children: _jsx("dl", { className: "cap-media-lib-keys", children: KEYS.map(([spec, what]) => (_jsxs("div", { children: [_jsx("dt", { children: _jsx(Keys, { spec: spec }) }), _jsx("dd", { children: what })] }, what))) }) })) : null, search && !picker ? _jsx(CommandMenu, { open: finding, onOpenChange: setFinding, commands: [], search: find, bindKeys: false, label: `Find a ${nounsOf(labels).noun}`, placeholder: "Name, address or alt text" }) : null, intents.confirmDialog] }));
}
