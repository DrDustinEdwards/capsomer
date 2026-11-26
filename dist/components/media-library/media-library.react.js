import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { CommandMenu } from "../command-menu/command-menu.react.js";
import { nounsOf, } from "../content/content.js";
import { ContentBulkBar } from "../content/content.react.js";
import {} from "../plain-form/plain-form.react.js";
import { Empty } from "../empty/empty.react.js";
import { MediaGrid, MediaInspector } from "../media/media.react.js";
import { MediaMore } from "./media-library-more.react.js";
import { mediaHref, withMedia } from "./media-library.js";
import { useMediaLibrary } from "./media-library-model.react.js";
import { LibraryFooter, LibraryNotes, LibraryToolbar } from "./media-library-chrome.react.js";
import { PickForm } from "./media-library-pick.react.js";
import { ImportForm, KeepSize, UploadDialog, UploadForm } from "./media-library-upload.react.js";
// One page of one site's files, the same component in Carrel and in every site admin: search, tag
// chips, the library and Trash, the grid or list of tiles, upload checked against the site's limits,
// the bulk bar with each file's outcome, the inspector (from ?inspect=) in form or autosave mode,
// Undo, and the confirmation for what cannot be undone. In picker mode, the same grid offers images
// and asks for the alt text this use needs. Every action is a form post, so it works with no
// script; `submit` adds the in-place path.
export function MediaLibrary(props) {
    const m = useMediaLibrary(props);
    const { Form, action, active, bulk, canImport, canUpload, data, find, finding, formId, go, goRef, goTo, groups, href, iOffers, insRef, inspected, inspector, inspectorMode, intents, labels, layout, layoutRef, mounted, nameOf, offers, onGridKey, onSubmit, openFile, path, picker, plural, query, rows, rules, save, search, selectable, selected, setActive, setFinding, setLast, setSelected, setUploadOpen, shown, submit, tileSize, title, toOpen, tools, trash, uid, uploadOpen, words, } = m;
    if (intents.confirmPage) {
        return (_jsx("section", { className: "cap-media-lib", "data-cap": "media-library", "aria-label": title, children: intents.confirmPage }));
    }
    const uploadForm = canUpload && rules ? _jsx(UploadForm, { m: m }) : null;
    const importForm = canImport ? _jsx(ImportForm, { m: m }) : null;
    return (_jsxs("section", { className: "cap-media-lib", "data-cap": "media-library", "data-mode": picker ? "picker" : undefined, "aria-label": title, ref: intents.setRoot, onSubmit: onSubmit, children: [_jsx("div", { ref: goRef, hidden: true, children: _jsx(Form, { method: "get", action: path, children: [...new URLSearchParams(mediaHref("", goTo ?? {}).split("?")[1] ?? "")].map(([k, v]) => (_jsx("input", { type: "hidden", name: k, value: v }, k))) }) }), _jsx(LibraryToolbar, { m: m }), _jsx(LibraryNotes, { m: m }), picker ? uploadForm : null, !picker && (uploadForm || importForm) ? (_jsx(UploadDialog, { open: uploadOpen, onOpenChange: setUploadOpen, scripted: mounted && !!submit, inPage: !!query.upload, closeHref: href(withMedia(query, { upload: undefined })), rules: canUpload && rules ? { ...rules, maxBytes: offers.upload?.maxBytes } : null, resize: _jsx(KeepSize, { uid: uid, id: "dlg", resize: offers.resize }), noScript: uploadForm, importForm: importForm, submit: submit, onDone: (r) => {
                    setLast(r);
                    intents.show(r);
                }, labels: labels })) : null, intents.resultBox, toOpen.length > 0 ? (_jsx("ul", { className: "cap-media-lib-opened", "aria-label": "Files to open", children: toOpen.map((f) => (_jsx("li", { children: _jsx("a", { href: href(withMedia(query, { inspect: f.id })), children: f.why === "duplicate"
                            ? `Open ${nameOf(f.id)}, the file already stored`
                            : f.why === "copy"
                                ? `Open the new file, ${nameOf(f.id)}`
                                : `Open ${nameOf(f.id)}` }) }, `${f.why}:${f.id}`))) })) : null, selectable ? (_jsx(ContentBulkBar, { formId: formId, action: action, Form: Form, formClass: "cap-media-lib-bulk-form", items: rows
                    .filter((r) => selected.includes(r.key))
                    .map((r) => ({ id: r.key, label: r.name })), total: shown.length, onSelectAll: mounted
                    ? () => setSelected(shown
                        .filter((r) => r.state === "ready" || r.state === "binned")
                        .map((r) => r.key))
                    : undefined, onClear: () => setSelected([]), plural: plural, actions: bulk, tag: bulk.some((a) => a.intent === "tag-add"), tagName: "tags", intents: intents })) : null, _jsx("div", { className: "cap-media", "data-size": tileSize, "data-view": layout === "list" ? "list" : undefined, children: _jsxs("div", { className: "cap-media-layout", ref: layoutRef, children: [_jsx("div", { className: "cap-media-main", onKeyDown: onGridKey, children: shown.length === 0 ? (_jsx(Empty, { kind: words.kind, title: words.title, action: words.kind === "no-match" ? (_jsx("a", { className: "cap-btn", href: href(withMedia(query, { q: undefined, tag: undefined, lens: undefined })), children: "Clear filters" })) : undefined })) : (_jsx(MediaGrid, { items: groups ? undefined : shown, groups: groups ?? undefined, activeKey: active, onActiveChange: setActive, selected: selected, onSelectedChange: setSelected, selectable: selectable, selectForm: selectable ? formId : undefined, hrefFor: (key) => href(withMedia(query, picker ? { pick: key } : { inspect: key })), onOpen: openFile, inspecting: !!inspected, label: picker ? "Images" : trash ? "Files in Trash" : "Files" })) }), inspected ? (_jsx(MediaInspector, { ref: insRef, id: `${uid}-ins`, item: inspected, open: true, mode: inspectorMode, onSave: save, onClose: () => go(withMedia(query, { inspect: undefined })), onStep: (dir) => {
                                const keys = shown
                                    .filter((r) => r.state === "ready" || r.state === "binned")
                                    .map((r) => r.key);
                                const next = keys[keys.indexOf(inspected.key) + (dir === "next" ? 1 : -1)];
                                if (next)
                                    go(withMedia(query, { inspect: next }));
                            }, show: {
                                alt: iOffers.alt,
                                title: false,
                                caption: iOffers.caption,
                                tags: iOffers.tags,
                            }, tools: tools(inspected), onTool: (form) => void intents.run(form), saving: inspector === "autosave" && submit ? "auto" : "form", action: action, Form: Form, closeHref: href(withMedia(query, { inspect: undefined })), can: { trash: iOffers.trash, delete: iOffers.delete && (trash || !offers.trash) }, more: ({ Tool, ident, base }) => (_jsx(MediaMore, { item: inspected, data: data, Tool: Tool, ident: ident, base: base, action: action, inspectHref: (key) => href(withMedia(query, { inspect: key })), suggestHref: href(withMedia(query, { inspect: inspected.key, suggest: true })), unsuggestHref: href(withMedia(query, { inspect: inspected.key })) })) })) : null] }) }), _jsx(PickForm, { m: m }), _jsx(LibraryFooter, { m: m }), search && !picker ? (_jsx(CommandMenu, { open: finding, onOpenChange: setFinding, commands: [], search: find, bindKeys: false, label: `Find a ${nounsOf(labels, "file").noun}`, placeholder: "Name, address or alt text" })) : null, intents.confirmDialog] }));
}
