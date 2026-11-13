import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { useCleanId } from "../hooks/hooks.react.js";
import { useEffect, useRef, useState } from "react";
import { nounsOf, } from "../content/content.js";
import { Dialog, DialogBody, DialogClose, DialogDescription, DialogFooter, DialogHeader, DialogTitle, } from "../dialog/dialog.react.js";
import { DropZone } from "../drop-zone/drop-zone.react.js";
import { formatBytes } from "../drop-zone/drop-zone.js";
const isPicture = (f) => /^image\/(png|jpeg|gif|webp|avif)$/.test(f.type);
// The uploads as one result: the sentence names the count, and each file has its outcome, so the
// bulk bar's list says which one the site refused and why.
export function uploadsResult(done, plural) {
    if (done.length === 1)
        return done[0].result;
    const outcomes = done.flatMap(({ name, result }) => result.outcomes?.length
        ? result.outcomes
        : [{ id: name, ok: result.ok, message: result.message }]);
    const ok = done.filter((d) => d.result.ok).length;
    const message = ok === done.length
        ? `Uploaded ${ok} ${plural}.`
        : ok === 0
            ? `None of the ${done.length} ${plural} was uploaded. Each one's reason is in the dialog.`
            : `Uploaded ${ok} of ${done.length} ${plural}. The rest are in the dialog with the site's reason.`;
    return { ok: ok === done.length, message, outcomes };
}
export function UploadDialog(props) {
    const { scripted, inPage, closeHref, noScript, importForm, labels } = props;
    const uid = useCleanId();
    const { noun } = nounsOf(labels, "file");
    if (!scripted) {
        if (!inPage)
            return null;
        // As delivered: in the page until a page with script takes it, its form posting as it is.
        return (_jsxs("dialog", { className: "cap-dialog cap-media-upload", "data-cap": "dialog", "data-cap-inline": "", "data-placement": "center", "data-size": "lg", open: true, "aria-labelledby": `${uid}-title`, children: [_jsx("div", { className: "cap-dialog-header", children: _jsxs("h2", { className: "cap-dialog-title", id: `${uid}-title`, children: ["Upload a ", noun] }) }), _jsxs("div", { className: "cap-dialog-body", children: [noScript, importForm] }), _jsx("div", { className: "cap-dialog-footer", children: _jsx("a", { className: "cap-btn", "data-cap-part": "cancel", href: closeHref, children: "Close" }) })] }));
    }
    return _jsx(ScriptedUpload, { ...props, uid: uid });
}
function ScriptedUpload({ open, onOpenChange, rules, resize, importForm, submit, onDone, labels, uid, }) {
    const { noun, plural } = nounsOf(labels, "file");
    const formId = `${uid}-files`;
    const [files, setFiles] = useState([]);
    const [busy, setBusy] = useState(null);
    // The previews alive now, so each is revoked once, when its file leaves or the dialog goes.
    const previews = useRef(new Set());
    useEffect(() => {
        const live = previews.current;
        return () => {
            for (const u of live)
                URL.revokeObjectURL(u);
            live.clear();
        };
    }, []);
    const drop = (keys) => setFiles((fs) => fs.filter((f) => {
        if (!keys.has(f.key))
            return true;
        if (f.preview) {
            URL.revokeObjectURL(f.preview);
            previews.current.delete(f.preview);
        }
        return false;
    }));
    const change = (key, patch) => setFiles((fs) => fs.map((f) => (f.key === key ? { ...f, ...patch, error: undefined } : f)));
    const add = (picked) => setFiles((fs) => [
        ...fs,
        ...picked.map((file, i) => {
            const preview = isPicture(file) ? URL.createObjectURL(file) : null;
            if (preview)
                previews.current.add(preview);
            return {
                key: `${Date.now()}-${fs.length + i}-${file.name}`,
                file,
                alt: "",
                decorative: false,
                preview,
            };
        }),
    ]);
    const close = (next) => {
        if (busy)
            return;
        onOpenChange(next);
        if (!next)
            drop(new Set(files.map((f) => f.key)));
    };
    const onSubmit = async (e) => {
        e.preventDefault();
        if (!submit || busy || files.length === 0)
            return;
        const keepFull = new FormData(e.currentTarget).get("resize") === "no";
        const done = [];
        const refused = new Map();
        const stored = new Set();
        for (const [i, f] of files.entries()) {
            setBusy({ at: i + 1, of: files.length });
            const form = new FormData();
            form.set("intent", "upload");
            form.set("file", f.file, f.file.name);
            // Decorative sends no alt text: the site refuses a file that is both.
            if (f.decorative)
                form.set("decorative", "on");
            else
                form.set("alt", f.alt.trim());
            if (keepFull)
                form.set("resize", "no");
            let result;
            try {
                result = await submit(form);
            }
            catch (err) {
                const why = err instanceof Error && err.message ? err.message : "the site did not answer";
                result = { ok: false, message: `${f.file.name} was not uploaded: ${why}.` };
            }
            done.push({ name: f.file.name, result });
            if (result.ok)
                stored.add(f.key);
            else
                refused.set(f.key, result.message);
        }
        setBusy(null);
        drop(stored);
        setFiles((fs) => fs.map((f) => (refused.has(f.key) ? { ...f, error: refused.get(f.key) } : f)));
        onDone(uploadsResult(done, plural));
        if (refused.size === 0)
            onOpenChange(false);
    };
    const count = files.length;
    return (_jsxs(Dialog, { open: open, onOpenChange: close, size: "lg", className: "cap-media-upload", busy: !!busy, modalLock: count > 0, children: [_jsxs(DialogHeader, { children: [_jsxs(DialogTitle, { children: ["Upload ", plural] }), _jsxs(DialogDescription, { children: ["Choose ", plural, ", then say what each picture shows for a person who cannot see it, or mark it decorative if it adds nothing a reader would miss. The site stores nothing undescribed."] })] }), _jsxs(DialogBody, { children: [rules ? (_jsxs("form", { id: formId, className: "cap-media-upload-form", "aria-label": `Upload ${plural}`, onSubmit: (e) => void onSubmit(e), children: [_jsx(DropZone, { multiple: true, accept: rules.accept, maxBytes: rules.maxBytes, hint: rules.hint, acceptedList: false, disabled: !!busy, onAccepted: add }), count > 0 ? (_jsx("ol", { className: "cap-media-upload-list", "aria-label": `${plural.charAt(0).toUpperCase()}${plural.slice(1)} to upload`, children: files.map((f) => (_jsxs("li", { className: "cap-media-upload-row", children: [_jsx("span", { className: "cap-media-upload-thumb", "aria-hidden": "true", children: f.preview ? (_jsx("img", { src: f.preview, alt: "" })) : (_jsx("span", { children: f.file.name.split(".").pop() })) }), _jsxs("div", { className: "cap-media-upload-fields", children: [_jsxs("p", { className: "cap-media-upload-name", children: [_jsx("span", { children: f.file.name }), " ", _jsx("span", { children: formatBytes(f.file.size) })] }), _jsxs("div", { className: "cap-field", children: [_jsxs("label", { className: "cap-field-label", htmlFor: `${uid}-${f.key}-alt`, children: ["Alt text", _jsxs("span", { className: "cap-sr-only", children: [" for ", f.file.name] })] }), _jsx("input", { className: "cap-input", id: `${uid}-${f.key}-alt`, type: "text", autoComplete: "off", value: f.decorative ? "" : f.alt, required: !f.decorative, disabled: f.decorative || !!busy, "aria-invalid": f.error ? "true" : undefined, "aria-describedby": f.error ? `${uid}-${f.key}-error` : undefined, onChange: (e) => change(f.key, { alt: e.target.value }) })] }), _jsxs("label", { className: "cap-check", children: [_jsx("input", { type: "checkbox", checked: f.decorative, "aria-label": `Decorative: ${f.file.name}`, disabled: !!busy, onChange: (e) => change(f.key, { decorative: e.target.checked }) }), " ", "Decorative"] }), f.error ? (_jsx("p", { className: "cap-field-error", id: `${uid}-${f.key}-error`, children: f.error })) : null] }), _jsxs("button", { type: "button", className: "cap-btn cap-media-upload-remove", "data-variant": "quiet", disabled: !!busy, onClick: () => drop(new Set([f.key])), children: ["Remove", _jsxs("span", { className: "cap-sr-only", children: [" ", f.file.name] })] })] }, f.key))) })) : null, count > 0 ? resize : null] })) : null, _jsx("div", { onSubmitCapture: () => close(false), children: importForm }), _jsx("p", { className: "cap-media-upload-progress", role: "status", children: busy ? `Uploading ${busy.at} of ${busy.of}…` : "" })] }), _jsxs(DialogFooter, { children: [_jsx(DialogClose, { part: "cancel", children: "Cancel" }), rules ? (_jsx("button", { type: "submit", form: formId, className: "cap-btn", "data-variant": "primary", disabled: count === 0 || !!busy, children: count === 0 ? `Upload` : `Upload ${count === 1 ? `1 ${noun}` : `${count} ${plural}`}` })) : null] })] }));
}
