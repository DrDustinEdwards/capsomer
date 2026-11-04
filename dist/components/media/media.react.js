import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { lazy, Suspense, useEffect, useId, useImperativeHandle, useLayoutEffect, useRef, useState } from "react";
import { openDialog, wireDialog } from "../dialog/dialog.js";
import { Disclosure } from "../disclosure/disclosure.react.js";
import { Glyph } from "../status/status.react.js";
import { byteSize, copySnippets, copyText, createAutosave, parseTags } from "./media.js";
import { COPIED_MS, COPY_FAILED_MS } from "./media-actions.js";
import { MediaFocus, focusWords } from "./media-focus.react.js";
// The crop editor, loaded the first time Crop is pressed, so a library page does not carry it.
const MediaCrop = lazy(() => import("./media-crop.react.js"));
export { MediaTile, MediaGrid } from "./media-grid.react.js";
// ---------------------------------------------------------------------------------------
// MediaInspector: the details of one file, in a pane beside the grid or a side sheet over it, saving
// by itself. A failed save keeps what was typed, in the form and in `drafts`, so switching files
// and coming back does not lose it.
const drafts = new Map();
// Reads how the inspector sits ("pane" or "sheet") from the layout's container query, and follows
// it as the container resizes. Put the ref on the element with class cap-media-layout.
export function useMediaMode(layout) {
    const [mode, setMode] = useState("pane");
    useLayoutEffect(() => {
        const el = layout.current;
        if (!el)
            return;
        const read = () => setMode(getComputedStyle(el).getPropertyValue("--cap-media-mode").trim() === "pane" ? "pane" : "sheet");
        read();
        const ro = new ResizeObserver(read);
        ro.observe(el);
        return () => ro.disconnect();
    }, [layout]);
    return mode;
}
const PlainForm = (props) => _jsx("form", { ...props });
// The hidden fields every inspector form carries: what it is about and the version last seen.
function Ident({ item, intent }) {
    return (_jsxs(_Fragment, { children: [_jsx("input", { type: "hidden", name: "intent", value: intent }), _jsx("input", { type: "hidden", name: "ids", value: item.key }), item.version ? _jsx("input", { type: "hidden", name: "versions", value: item.version }) : null] }));
}
const SAVE_TEXT = { idle: "Changes save by themselves.", dirty: "Unsaved changes", saving: "Saving…", saved: "Saved", failed: "Could not save" };
export function MediaInspector(props) {
    const { item, open, mode, onClose, opener, id, ref: handle } = props;
    const own = useId();
    const base = id ?? own;
    const ref = useRef(null);
    const unwire = useRef(null);
    const first = useRef(null);
    useImperativeHandle(handle, () => ({ focus: () => first.current?.focus() }), []);
    useEffect(() => {
        const d = ref.current;
        if (!d)
            return;
        const modal = d.matches(":modal");
        if (open && item && mode === "pane") {
            if (modal)
                d.close();
            if (!d.open)
                d.show();
        }
        else if (open && item && mode === "sheet") {
            if (!modal) {
                if (d.open)
                    d.close();
                unwire.current?.();
                unwire.current = wireDialog(d, { returnTo: opener ?? null });
                openDialog(d, opener ?? document.activeElement, { focus: first.current });
            }
        }
        else if (d.open)
            d.close();
    }, [open, item, mode, opener]);
    useEffect(() => {
        const d = ref.current;
        if (!d)
            return;
        const onCloseEvent = () => {
            unwire.current?.();
            unwire.current = null;
            if (open)
                onClose();
        };
        d.addEventListener("close", onCloseEvent);
        return () => d.removeEventListener("close", onCloseEvent);
    }, [open, onClose]);
    const titleId = `${base}-title`;
    return (_jsx("dialog", { ref: ref, className: "cap-dialog cap-media-inspector", "data-cap": "media-inspector", "data-placement": "right", "data-size": "md", id: base, "aria-labelledby": titleId, open: open && mode === "pane" && !!item, children: item ? _jsx(InspectorBody, { ...props, item: item, base: base, titleId: titleId, firstRef: first }, item.key) : _jsx("p", { className: "cap-dialog-body", children: "Select a file to see its details." }) }));
}
function InspectorBody({ item, onSave, onClose, onBin, onRestore, onShowUnattached, onStep, base, titleId, firstRef, show = {}, saving = "auto", action, Form: F = PlainForm, closeHref, can = {}, tools = {}, onTool, more }) {
    const formMode = saving === "form" && !!action;
    const toolRef = useRef(onTool);
    toolRef.current = onTool;
    // One component for the inspector's life, so a re-render never remounts a tool and loses its state.
    const [Nested] = useState(() => nestedTool(toolRef));
    const Tool = formMode ? F : Nested;
    const shows = { alt: show.alt ?? true, title: show.title ?? true, caption: show.caption ?? true, tags: show.tags ?? true };
    const draft = drafts.get(item.key);
    const initial = draft ?? { alt: item.alt, decorative: item.altState === "decorative", title: item.title, caption: item.caption, tags: item.tags };
    const [fields, setFields] = useState(initial);
    const [tagText, setTagText] = useState("");
    const [state, setState] = useState(draft ? "failed" : "idle");
    const [error, setError] = useState(draft ? "the last save did not go through" : undefined);
    const [copied, setCopied] = useState(null);
    const latest = useRef(fields);
    latest.current = fields;
    const onSaveRef = useRef(onSave);
    onSaveRef.current = onSave;
    const saver = useRef(null);
    if (!saver.current) {
        saver.current = createAutosave({
            save: () => {
                const f = latest.current;
                const clean = { alt: f.decorative ? "" : f.alt.trim(), decorative: f.decorative, title: f.title.trim(), caption: f.caption.trim(), tags: f.tags };
                return onSaveRef.current(item.key, clean).then(() => void drafts.delete(item.key), (err) => {
                    drafts.set(item.key, f);
                    throw err;
                });
            },
            onState: (s, e) => {
                setState(s);
                setError(e);
            },
        });
    }
    // Leaving this file saves what is unsaved first.
    useEffect(() => () => {
        void saver.current?.flush();
    }, []);
    const edit = (patch, now = false) => {
        const next = { ...latest.current, ...patch };
        latest.current = next;
        setFields(next);
        // In form mode each form's own Save button sends it.
        if (formMode)
            return;
        saver.current?.schedule();
        if (now)
            void saver.current?.flush();
    };
    const img = item.kind === "image";
    const url = item.url;
    const snippets = copySnippets({ url, kind: item.kind, alt: fields.alt, decorative: fields.decorative, name: item.name });
    const copy = async (value, what) => {
        setCopied(null);
        const ok = await copyText(value);
        setCopied(ok ? (_jsxs(_Fragment, { children: [_jsx(Glyph, { name: "ok" }), "Copied the ", what, "."] })) : (_jsxs(_Fragment, { children: [_jsx(Glyph, { name: "crit" }), "Could not copy. The address is selected: press Ctrl+C or Cmd+C."] })));
        window.setTimeout(() => setCopied(null), ok ? COPIED_MS : COPY_FAILED_MS);
    };
    const sub = [item.type.split("/").pop()?.toUpperCase(), byteSize(item.bytes), item.width && item.height ? `${item.width} by ${item.height}` : ""].filter(Boolean).join(" · ");
    const addTag = (text) => {
        const add = parseTags(text);
        if (add.length)
            edit({ tags: [...fields.tags, ...add.filter((t) => !fields.tags.includes(t))] }, true);
        setTagText("");
    };
    const onKeyDown = (e) => {
        if (e.altKey && !e.ctrlKey && !e.metaKey && (e.key === "ArrowLeft" || e.key === "ArrowUp" || e.key === "ArrowRight" || e.key === "ArrowDown")) {
            e.preventDefault();
            void saver.current?.flush();
            onStep?.(e.key === "ArrowLeft" || e.key === "ArrowUp" ? "prev" : "next");
        }
    };
    const binned = item.state === "binned";
    // One autosaving form, or (form mode) a plain block holding one form per group of fields.
    const BodyTag = formMode ? "div" : "form";
    return (_jsxs(_Fragment, { children: [_jsxs("div", { className: "cap-dialog-header", "data-divider": true, children: [_jsx("h2", { className: "cap-dialog-title cap-media-title", id: titleId, "data-cap-part": "title", children: item.name }), _jsx("p", { className: "cap-dialog-description", "data-cap-part": "subtitle", children: sub })] }), _jsxs(BodyTag, { className: "cap-dialog-body cap-media-form", "data-cap-part": "form", ...(formMode
                    ? { onKeyDown }
                    : {
                        method: "post",
                        "aria-busy": state === "saving" ? true : undefined,
                        onKeyDown,
                        onSubmit: (e) => {
                            e.preventDefault();
                            void saver.current?.flush();
                        },
                        onBlur: (e) => {
                            const t = e.target;
                            if (/^(INPUT|TEXTAREA)$/.test(t.tagName) && t.dataset.capPart !== "tag-input")
                                void saver.current?.flush();
                        },
                    }), children: [_jsx("input", { type: "hidden", name: "key", value: item.key, "data-cap-part": "key" }), _jsx("div", { className: "cap-media-preview", children: img && item.thumb ? _jsx("img", { "data-cap-part": "preview", src: item.thumb, alt: "", width: 640, height: 427 }) : _jsx("span", { className: "cap-media-doc", "aria-hidden": "true", children: (item.name.split(".").pop() ?? "file").slice(0, 5).toUpperCase() }) }), img && shows.alt ? (_jsxs(Wrap, { on: formMode, F: F, action: action, label: "Alt text", intent: "alt", item: item, save: "Save alt text", children: [_jsxs("div", { className: "cap-field", "data-cap-part": "alt-field", children: [_jsx("label", { className: "cap-field-label", htmlFor: `${base}-alt`, children: "Alt text" }), _jsx("textarea", { ref: (el) => {
                                            if (el && !el.disabled)
                                                firstRef.current = el;
                                        }, className: "cap-input", id: `${base}-alt`, name: "alt", "data-cap-part": "alt", rows: 2, placeholder: "Describe what the picture shows", "aria-describedby": `${base}-alt-help`, disabled: fields.decorative && !formMode, value: fields.decorative ? "" : fields.alt, onChange: (e) => edit({ alt: e.target.value }) }), _jsx("p", { className: "cap-field-help", id: `${base}-alt-help`, children: "What a person who cannot see the picture needs to know. Leave out \u201Cimage of\u201D." })] }), _jsxs("div", { className: "cap-field", "data-cap-part": "decorative-field", children: [_jsxs("label", { className: "cap-check", children: [_jsx("input", { type: "checkbox", name: "decorative", "data-cap-part": "decorative", "aria-describedby": `${base}-deco-help`, checked: fields.decorative, onChange: (e) => edit({ decorative: e.target.checked, alt: e.target.checked ? "" : fields.alt }, true) }), " Decorative image"] }), _jsx("p", { className: "cap-field-help", id: `${base}-deco-help`, children: "It adds nothing a reader needs, so a screen reader skips it. This is a choice, not a missing description." })] })] })) : !img ? (_jsx("p", { className: "cap-field-help", "data-cap-part": "alt-document", children: "A document takes no alt text. What a reader hears is the link text, and that lives in the post." })) : null, shows.title || shows.caption ? (_jsxs(Wrap, { on: formMode, F: F, action: action, label: shows.title ? "Title and caption" : "Caption", intent: shows.title ? "save-details" : "caption", item: item, save: shows.title ? "Save title and caption" : "Save caption", children: [shows.title ? (_jsxs("div", { className: "cap-field", children: [_jsx("label", { className: "cap-field-label", htmlFor: `${base}-title-field`, children: "Title" }), _jsx("input", { className: "cap-input", id: `${base}-title-field`, "data-cap-part": "title-field", name: "title", type: "text", autoComplete: "off", value: fields.title, onChange: (e) => edit({ title: e.target.value }) })] })) : null, shows.caption ? (_jsxs("div", { className: "cap-field", children: [_jsx("label", { className: "cap-field-label", htmlFor: `${base}-caption`, children: "Caption" }), _jsx("textarea", { className: "cap-input", id: `${base}-caption`, "data-cap-part": "caption", name: "caption", rows: 2, value: fields.caption, onChange: (e) => edit({ caption: e.target.value }) })] })) : null] })) : null, shows.tags && formMode ? (_jsx(Wrap, { on: true, F: F, action: action, label: "Tags", intent: "tags", item: item, save: "Save tags", children: _jsxs("div", { className: "cap-field", children: [_jsx("label", { className: "cap-field-label", htmlFor: `${base}-tags-text`, children: "Tags" }), _jsx("input", { className: "cap-input", id: `${base}-tags-text`, name: "tags", type: "text", autoComplete: "off", "aria-describedby": `${base}-tags-help`, value: fields.tags.join(", "), onChange: (e) => edit({ tags: parseTags(e.target.value) }) }), _jsx("p", { className: "cap-field-help", id: `${base}-tags-help`, children: "Separate tags with commas." })] }) })) : null, shows.tags && !formMode ? (_jsxs("div", { className: "cap-media-section", role: "group", "aria-labelledby": `${base}-tags-l`, children: [_jsx("span", { className: "cap-field-label", id: `${base}-tags-l`, children: "Tags" }), _jsx("ul", { className: "cap-media-tags", "data-cap-part": "tags", children: fields.tags.map((t) => (_jsx("li", { children: _jsxs("button", { type: "button", className: "cap-chip", "aria-label": `Remove tag ${t}`, onClick: () => edit({ tags: fields.tags.filter((x) => x !== t) }, true), children: [t, " ", _jsx("span", { "aria-hidden": "true", children: "\u00D7" })] }) }, t))) }), _jsx("input", { type: "hidden", name: "tags", value: fields.tags.join(", "), "data-cap-part": "tags-value" }), _jsx("label", { className: "cap-sr-only", htmlFor: `${base}-tag-input`, children: "Add a tag" }), _jsx("input", { className: "cap-input", id: `${base}-tag-input`, type: "text", autoComplete: "off", placeholder: "Add a tag, then press Enter", "data-cap-part": "tag-input", value: tagText, onChange: (e) => setTagText(e.target.value), onKeyDown: (e) => {
                                    if (e.key === "Enter" || e.key === ",") {
                                        e.preventDefault();
                                        addTag(tagText);
                                    }
                                }, onBlur: () => tagText.trim() && addTag(tagText) }), _jsx("ul", { className: "cap-media-tags", "data-cap-part": "suggestions", children: (item.suggestedTags ?? [])
                                    .filter((t) => !fields.tags.includes(t))
                                    .map((t) => (_jsx("li", { children: _jsxs("button", { type: "button", className: "cap-chip", "aria-label": `Add suggested tag ${t}`, onClick: () => edit({ tags: [...fields.tags, t] }, true), children: ["+ ", t] }) }, t))) })] })) : null, img && !binned && (tools.focus || tools.replace || tools.crop) && action ? (_jsx(PictureTools, { item: item, base: base, tools: tools, action: action, Tool: Tool })) : null, more && action ? more({ Tool, ident: (intent) => _jsx(Ident, { item: item, intent: intent }), base }) : null, _jsxs("div", { className: "cap-media-section", role: "group", "aria-labelledby": `${base}-addr-l`, children: [_jsx("label", { className: "cap-field-label", id: `${base}-addr-l`, htmlFor: `${base}-addr`, children: "Address" }), _jsx("input", { className: "cap-input", id: `${base}-addr`, "data-cap-part": "address", readOnly: true, value: url }), _jsx("div", { className: "cap-media-copy", children: snippets.map((s) => (_jsx("button", { type: "button", className: "cap-btn", "data-size": "sm", "data-cap-copy-kind": s.id, "aria-label": s.name, onClick: () => void copy(s.value, s.name.replace(/^Copy (the )?/, "")), children: s.label }, s.id))) }), _jsx("p", { className: "cap-media-copied", role: "status", "data-cap-part": "copied", children: copied })] }), _jsxs("dl", { className: "cap-media-facts", "data-cap-part": "facts", children: [_jsx("dt", { children: "Key" }), _jsx("dd", { children: item.key }), _jsx("dt", { children: "Type" }), _jsx("dd", { children: item.type || "unknown" }), _jsx("dt", { children: "Size" }), _jsx("dd", { children: byteSize(item.bytes) }), _jsx("dt", { children: "Dimensions" }), _jsx("dd", { children: item.width && item.height ? `${item.width} by ${item.height}` : "not measured" }), _jsx("dt", { children: "Uploaded" }), _jsx("dd", { children: item.uploaded ?? "ships with the site" })] }), _jsxs("section", { className: "cap-media-section", "aria-labelledby": `${base}-used-l`, children: [_jsx("h3", { id: `${base}-used-l`, children: "Used in" }), _jsx("div", { "data-cap-part": "used", children: item.usedUnknown ? (_jsx("p", { className: "cap-media-note", children: "Where it is used was not checked for this list. Open the file to see." })) : item.used.length > 0 ? (_jsx("ul", { className: "cap-media-used", children: item.used.map((u) => (_jsxs("li", { children: [_jsx("a", { href: u.href, children: u.title }), u.how ? _jsx("span", { className: "cap-media-used-how", children: u.how }) : null] }, u.href))) })) : (_jsxs(_Fragment, { children: [_jsx("p", { className: "cap-media-used-empty", children: "Not used anywhere." }), _jsxs("p", { className: "cap-media-note", children: ["No post cites this file. That is not proof it is unused: a page built in code can still use it, so check before you delete it. The Unattached filter lists every file like this.", " ", onShowUnattached ? (_jsx("button", { type: "button", className: "cap-btn", "data-variant": "link", onClick: onShowUnattached, children: "Show unattached files" })) : null] })] })) })] })] }), _jsxs("div", { className: "cap-dialog-footer", children: [formMode ? null : (_jsxs("div", { className: "cap-media-save", "data-cap-part": "save", "data-state": state, children: [_jsx("p", { role: "status", "data-cap-part": "save-status", children: state !== "failed" ? (_jsxs(_Fragment, { children: [state === "saving" ? _jsx(Glyph, { name: "running" }) : state === "saved" ? _jsx(Glyph, { name: "ok" }) : state === "dirty" ? _jsx(Glyph, { name: "info" }) : null, SAVE_TEXT[state]] })) : null }), _jsx("p", { role: "alert", "data-cap-part": "save-error", children: state === "failed" ? (_jsxs(_Fragment, { children: [_jsx(Glyph, { name: "crit" }), "Could not save", error ? `: ${error.replace(/\.$/, "")}` : "", ". What you typed is still here."] })) : null }), _jsx("button", { type: "button", className: "cap-btn", "data-size": "sm", "data-cap-part": "retry-save", hidden: state !== "failed", onClick: () => void saver.current?.retry(), children: "Retry" })] })), action ? (_jsxs(_Fragment, { children: [binned ? (_jsxs(F, { method: "post", action: action, className: "cap-media-act", children: [_jsx(Ident, { item: item, intent: "restore" }), _jsx("button", { type: "submit", className: "cap-btn", "data-cap-part": "restore", children: "Restore" })] })) : can.trash !== false ? (_jsxs(F, { method: "post", action: action, className: "cap-media-act", children: [_jsx(Ident, { item: item, intent: "trash" }), _jsx("button", { type: "submit", className: "cap-btn", "data-cap-part": "bin", children: "Move to Trash" })] })) : null, can.delete ? (_jsxs(F, { method: "post", action: action, className: "cap-media-act", children: [_jsx(Ident, { item: item, intent: "delete" }), _jsx("button", { type: "submit", className: "cap-btn", "data-variant": "danger", "data-cap-part": "delete", children: "Delete for good" })] })) : null] })) : binned ? (_jsx("button", { type: "button", className: "cap-btn", "data-cap-part": "restore", onClick: () => onRestore?.(item.key), children: "Restore" })) : (_jsx("button", { type: "button", className: "cap-btn", "data-cap-part": "bin", onClick: () => onBin?.(item.key), children: "Move to Trash" }))] }), closeHref ? (_jsx("a", { className: "cap-btn cap-dialog-close", "data-variant": "quiet", "data-icon-only": true, "data-cap-part": "close", "aria-label": "Close", href: closeHref, onClick: (e) => {
                    e.preventDefault();
                    onClose();
                }, children: _jsx(CloseGlyph, {}) })) : (_jsx("button", { type: "button", className: "cap-btn cap-dialog-close", "data-variant": "quiet", "data-icon-only": true, "data-cap-part": "close", "aria-label": "Close", onClick: onClose, children: _jsx(CloseGlyph, {}) }))] }));
}
function CloseGlyph() {
    return (_jsx("svg", { viewBox: "0 0 16 16", width: "16", height: "16", "aria-hidden": "true", focusable: "false", children: _jsx("path", { d: "M4 4l8 8M12 4l-8 8", fill: "none", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round" }) }));
}
// In form mode, a group of fields is its own form with its own Save button, posting `intent`, the
// file's id and its version; otherwise the fields sit in the inspector's one autosaving form.
function Wrap({ on, F, action, label, intent, item, save, children }) {
    if (!on || !action)
        return _jsx(_Fragment, { children: children });
    return (_jsxs(F, { method: "post", action: action, className: "cap-media-field-form", "aria-label": label, children: [_jsx(Ident, { item: item, intent: intent }), children, _jsx("button", { type: "submit", className: "cap-btn", "data-size": "sm", children: save })] }));
}
// The tools that change the picture: the focal point, crop, and replace, each folded away (they are
// used now and then, and open each is as tall as the rest of the inspector). In form mode each is its
// own form; inside the autosaving form (`nested`) each is a group whose button hands its fields to
// `onTool`, since a form cannot sit inside a form.
function PictureTools({ item, base, tools, action, Tool }) {
    const [cropOpen, setCropOpen] = useState(false);
    const [opener, setOpener] = useState(null);
    const ident = (intent) => _jsx(Ident, { item: item, intent: intent });
    const size = item.width && item.height ? `${item.width} by ${item.height} pixels` : "the size of this one";
    const crop = tools.crop;
    return (_jsxs("div", { className: "cap-media-section", "data-cap-part": "tools", children: [tools.focus && item.thumb ? (_jsx(Disclosure, { summary: _jsxs(_Fragment, { children: ["Focal point ", _jsx("span", { className: "cap-media-summary-note", children: focusWords(item.focus) })] }), children: _jsx(MediaFocus, { name: item.name, src: item.thumb, focus: item.focus, action: action, Form: Tool, ident: ident("focus"), base: base }, `${item.key}:${item.version ?? ""}`) })) : null, crop || tools.replace ? (_jsxs(Disclosure, { summary: crop && tools.replace ? "Crop or replace the file" : tools.replace ? "Replace the file" : "Crop", children: [crop ? (_jsxs("div", { className: "cap-media-tool", "data-inline": "", children: [_jsxs("button", { type: "button", className: "cap-btn", "data-size": "sm", onClick: (e) => {
                                    setOpener(e.currentTarget);
                                    setCropOpen(true);
                                }, children: ["Crop", _jsxs("span", { className: "cap-sr-only", children: [" ", item.name] })] }), _jsx("p", { className: "cap-media-note", children: tools.keepsSize ? "Cut out part of the picture as a new file. This site takes a replacement only at the original's size, so a crop never replaces this one." : `Cut out part of the picture, as a new file${crop.inPlace ? " or in place of this one" : ""}.` }), opener ? (_jsx(Suspense, { fallback: null, children: _jsx(MediaCrop, { name: item.name, src: crop.src, asNew: crop.asNew, inPlace: crop.inPlace && !tools.keepsSize, keepsSize: tools.keepsSize, onSave: crop.onSave, open: cropOpen, opener: opener, onClose: () => setCropOpen(false) }) })) : null] })) : null, tools.replace ? (_jsxs(Tool, { method: "post", action: action, encType: "multipart/form-data", className: "cap-media-field-form cap-media-tool", "aria-label": "Replace the file", children: [ident("replace"), _jsxs("div", { className: "cap-field", children: [_jsx("label", { className: "cap-field-label", htmlFor: `${base}-replace`, children: "The new file" }), _jsxs("p", { className: "cap-field-help", id: `${base}-replace-help`, children: [tools.replace.hint, " ", tools.keepsSize ? `It must be ${size}: this site sizes its pages by them and refuses any other size. ` : "", "It goes under the same address, so every page that shows this file shows the new one, and the old one is gone from the site. Alt text, caption and tags stay; the focal point is cleared. Readers who already loaded the old picture may see it until their browser's cache expires."] }), _jsx("input", { className: "cap-input", id: `${base}-replace`, type: "file", name: "file", accept: tools.replace.accept, required: true, "aria-describedby": `${base}-replace-help` })] }), _jsx("div", { className: "cap-media-tool-actions", children: _jsxs("button", { type: "submit", className: "cap-btn", "data-size": "sm", "data-variant": "danger", children: ["Replace", _jsxs("span", { className: "cap-sr-only", children: [" ", item.name] })] }) })] }, `replace:${item.key}:${item.version ?? ""}`)) : null] })) : null] }));
}
// A tool inside the autosaving form: a group, not a form, whose submit buttons hand its named fields
// (and the pressed button's) to the handler the ref holds.
function nestedTool(handler) {
    return function NestedTool({ children, className, "aria-label": label }) {
        return (_jsx("div", { className: className, role: "group", "aria-label": label, onClickCapture: (e) => {
                const button = e.target.closest("button");
                if (!button || button.type !== "submit")
                    return;
                e.preventDefault();
                e.stopPropagation();
                const data = new FormData();
                for (const el of e.currentTarget.querySelectorAll("input[name], textarea[name], select[name]")) {
                    if ((el.type === "checkbox" || el.type === "radio") && !el.checked)
                        continue;
                    if (el.type === "file") {
                        if (!el.reportValidity())
                            return;
                        for (const f of el.files ?? [])
                            data.append(el.name, f);
                    }
                    else
                        data.append(el.name, el.value);
                }
                if (button.name)
                    data.append(button.name, button.value);
                handler.current?.(data);
                button.closest("details")?.removeAttribute("open");
            }, children: children }));
    };
}
