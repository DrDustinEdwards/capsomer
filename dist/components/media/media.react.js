import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useId, useImperativeHandle, useLayoutEffect, useRef, useState, } from "react";
import { PlainForm } from "../plain-form/plain-form.react.js";
import { openDialog, wireDialog } from "../dialog/dialog.js";
import { copySnippets, createAutosave, } from "./media.js";
import { formatBytes } from "../format/format.js";
import { AddressCopy, FactsUsed, Ident, InspectorFooter } from "./media-inspector-parts.react.js";
import { InspectorFields } from "./media-inspector-fields.react.js";
import { PictureTools, nestedTool } from "./media-picture-tools.react.js";
export { MediaTile, MediaGrid } from "./media-grid.react.js";
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
        const read = () => setMode(getComputedStyle(el).getPropertyValue("--cap-media-mode").trim() === "pane"
            ? "pane"
            : "sheet");
        read();
        const ro = new ResizeObserver(read);
        ro.observe(el);
        return () => ro.disconnect();
    }, [layout]);
    return mode;
}
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
    return (_jsx("dialog", { ref: ref, className: "cap-dialog cap-media-inspector", "data-cap": "media-inspector", "data-placement": "right", "data-size": "md", id: base, "aria-labelledby": titleId, open: open && mode === "pane" && !!item, children: item ? (_jsx(InspectorBody, { ...props, item: item, base: base, titleId: titleId, firstRef: first }, item.key)) : (_jsx("p", { className: "cap-dialog-body", children: "Select a file to see its details." })) }));
}
function InspectorBody({ item, onSave, onClose, onBin, onRestore, onShowUnattached, onStep, base, titleId, firstRef, show = {}, saving = "auto", action, Form: F = PlainForm, closeHref, can = {}, tools = {}, onTool, more, }) {
    const formMode = saving === "form" && !!action;
    const toolRef = useRef(onTool);
    useLayoutEffect(() => {
        toolRef.current = onTool;
    });
    // One component for the inspector's life, so a re-render never remounts a tool and loses its state.
    // oxlint-disable-next-line react/refs -- nestedTool keeps the ref and reads it only when the tool runs, never while rendering
    const [Nested] = useState(() => nestedTool(toolRef));
    const Tool = formMode ? F : Nested;
    const shows = {
        alt: show.alt ?? true,
        title: show.title ?? true,
        caption: show.caption ?? true,
        tags: show.tags ?? true,
    };
    const draft = drafts.get(item.key);
    const initial = draft ?? {
        alt: item.alt,
        decorative: item.altState === "decorative",
        title: item.title,
        caption: item.caption,
        tags: item.tags,
    };
    const [fields, setFields] = useState(initial);
    const [state, setState] = useState(draft ? "failed" : "idle");
    const [error, setError] = useState(draft ? "the last save did not go through" : undefined);
    const latest = useRef(fields);
    useLayoutEffect(() => {
        latest.current = fields;
    });
    const onSaveRef = useRef(onSave);
    useLayoutEffect(() => {
        onSaveRef.current = onSave;
    });
    // One autosave for the inspector's life, made on the first render.
    // oxlint-disable-next-line react/refs -- the autosave keeps the refs and reads them only when it saves, never while rendering
    const [saver] = useState(() => createAutosave({
        save: () => {
            const f = latest.current;
            const clean = {
                alt: f.decorative ? "" : f.alt.trim(),
                decorative: f.decorative,
                title: f.title.trim(),
                caption: f.caption.trim(),
                tags: f.tags,
            };
            return onSaveRef.current(item.key, clean).then(() => void drafts.delete(item.key), (err) => {
                drafts.set(item.key, f);
                throw err;
            });
        },
        onState: (s, e) => {
            setState(s);
            setError(e);
        },
    }));
    // Leaving this file saves what is unsaved first.
    useEffect(() => () => {
        void saver.flush();
    }, [saver]);
    const edit = (patch, now = false) => {
        const next = { ...latest.current, ...patch };
        latest.current = next;
        setFields(next);
        // In form mode each form's own Save button sends it.
        if (formMode)
            return;
        saver.schedule();
        if (now)
            void saver.flush();
    };
    const img = item.kind === "image";
    const url = item.url;
    const snippets = copySnippets({
        url,
        kind: item.kind,
        alt: fields.alt,
        decorative: fields.decorative,
        name: item.name,
    });
    const sub = [
        item.type.split("/").pop()?.toUpperCase(),
        formatBytes(item.bytes),
        item.width && item.height ? `${item.width} by ${item.height}` : "",
    ]
        .filter(Boolean)
        .join(" · ");
    const onKeyDown = (e) => {
        if (e.altKey &&
            !e.ctrlKey &&
            !e.metaKey &&
            (e.key === "ArrowLeft" ||
                e.key === "ArrowUp" ||
                e.key === "ArrowRight" ||
                e.key === "ArrowDown")) {
            e.preventDefault();
            void saver.flush();
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
                            void saver.flush();
                        },
                        onBlur: (e) => {
                            const t = e.target;
                            if (/^(INPUT|TEXTAREA)$/.test(t.tagName) && t.dataset.capPart !== "tag-input")
                                void saver.flush();
                        },
                    }), children: [_jsx("input", { type: "hidden", name: "key", value: item.key, "data-cap-part": "key" }), _jsx("div", { className: "cap-media-preview", children: img && item.thumb ? (_jsx("img", { "data-cap-part": "preview", src: item.thumb, alt: "", width: 640, height: 427 })) : (_jsx("span", { className: "cap-media-doc", "aria-hidden": "true", children: (item.name.split(".").pop() ?? "file").slice(0, 5).toUpperCase() })) }), _jsx(InspectorFields, { item: item, base: base, fields: fields, edit: edit, formMode: formMode, F: F, action: action, shows: shows, firstRef: firstRef }), img && !binned && (tools.focus || tools.replace || tools.crop) && action ? (_jsx(PictureTools, { item: item, base: base, tools: tools, action: action, Tool: Tool })) : null, more && action
                        ? more({ Tool, ident: (intent) => _jsx(Ident, { item: item, intent: intent }), base })
                        : null, _jsx(AddressCopy, { base: base, url: url, snippets: snippets }), _jsx(FactsUsed, { item: item, base: base, onShowUnattached: onShowUnattached })] }), _jsx(InspectorFooter, { item: item, state: state, error: error, onRetry: () => void saver.retry(), formMode: formMode, F: F, action: action, can: can, onBin: onBin, onRestore: onRestore, onClose: onClose, closeHref: closeHref })] }));
}
