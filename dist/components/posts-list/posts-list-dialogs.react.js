import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import {} from "../content/content.js";
import {} from "../plain-form/plain-form.react.js";
import { Time } from "../time/time.react.js";
import { Dialog, DialogBody, DialogClose, DialogDescription, DialogFooter, DialogHeader, DialogTitle, } from "../dialog/dialog.react.js";
import { copyText } from "../copy/copy.js";
import { useBrowserZone, useCleanId } from "../hooks/hooks.react.js";
import { fromDateTimeLocal, toDateTimeLocal } from "../field/field.js";
import { toMs } from "../time/time.js";
// The new time for a reschedule, in the person's own zone; the UTC time it means is posted as
// publishAt. As delivered (the update page with no script) it is a text field in UTC that starts
// at the time it moves from, since a form with no script cannot add the zone the site needs.
export function RescheduleField({ id, at }) {
    const [local, setLocal] = useState(null);
    const zone = useBrowserZone(null);
    // oxlint-disable-next-line react/set-state-in-effect -- the person's own zone is known only in the browser, after hydration
    useEffect(() => setLocal(zone ? toDateTimeLocal(new Date(toMs(at)), zone) : null), [at, zone]);
    if (local === null) {
        return (_jsxs("div", { className: "cap-field", children: [_jsx("label", { className: "cap-field-label", htmlFor: id, children: "New time, UTC" }), _jsx("input", { className: "cap-input", id: id, name: "publishAt", defaultValue: at.replace(/\.\d{3}Z$/, "Z"), autoComplete: "off", spellCheck: false, "aria-describedby": `${id}-help` }), _jsx("p", { className: "cap-field-description", id: `${id}-help`, children: "As 2030-01-01T15:00:00Z" })] }));
    }
    return (_jsxs("div", { className: "cap-field", children: [_jsx("label", { className: "cap-field-label", htmlFor: id, children: "New time" }), _jsx("input", { className: "cap-input", type: "datetime-local", id: id, value: local, onChange: (e) => setLocal(e.target.value), "aria-describedby": `${id}-help`, required: true }), _jsx("input", { type: "hidden", name: "publishAt", value: fromDateTimeLocal(local, zone ?? undefined)
                    ?.toISOString()
                    .replace(/\.\d{3}Z$/, "Z") ?? "" }), _jsxs("p", { className: "cap-field-description", id: `${id}-help`, children: ["In your time zone, ", zone, "."] })] }));
}
// The small dialog Reschedule… opens: the time field and Reschedule. Its form posts inside the
// list (or the update page), so the script path runs it like any other intent.
export function RescheduleDialog({ moving, action, Form, onClose, }) {
    const uid = useCleanId();
    return (_jsx(Dialog, { open: !!moving, onOpenChange: (open) => (open ? undefined : onClose()), size: "sm", described: true, children: moving ? (_jsxs(_Fragment, { children: [_jsxs(DialogHeader, { children: [_jsxs(DialogTitle, { children: ["Reschedule ", moving.name] }), _jsxs(DialogDescription, { children: ["It goes out ", _jsx(Time, { at: moving.at, format: "exact" }), "."] })] }), _jsxs(Form, { method: "post", action: action, className: "cap-posts-reschedule", onSubmit: () => onClose(), children: [_jsx("input", { type: "hidden", name: "intent", value: "reschedule" }), _jsx("input", { type: "hidden", name: "ids", value: moving.id }), moving.version ? _jsx("input", { type: "hidden", name: "versions", value: moving.version }) : null, _jsx(DialogBody, { children: _jsx(RescheduleField, { id: `${uid}-at`, at: moving.at }, moving.id + moving.at) }), _jsxs(DialogFooter, { children: [_jsx(DialogClose, { part: "cancel", children: "Close" }), _jsx("button", { type: "submit", className: "cap-btn", "data-variant": "primary", children: "Reschedule" })] })] })] })) : null }));
}
// A slug as the contract's ContentId takes it ("notes-on-the-survey"). The kit checks it again.
const SLUG = "[A-Za-z0-9][A-Za-z0-9._\\-]{0,199}";
// The small dialog Rename… opens (site-api v0.17.0): the new slug, starting at the old one, and
// what happens to the old address. It posts `rename` with `newId` inside the list, as Reschedule does.
export function RenameDialog({ renaming, action, Form, onClose, }) {
    const uid = useCleanId();
    return (_jsx(Dialog, { open: !!renaming, onOpenChange: (open) => (open ? undefined : onClose()), size: "sm", described: !!renaming?.path, children: renaming ? (_jsxs(_Fragment, { children: [_jsxs(DialogHeader, { children: [_jsxs(DialogTitle, { children: ["Rename ", renaming.name] }), renaming.path ? (_jsxs(DialogDescription, { children: ["Its address is ", renaming.path, " now. The old address will redirect to the new one, so links to it keep working."] })) : null] }), _jsxs(Form, { method: "post", action: action, className: "cap-posts-rename", onSubmit: () => onClose(), children: [_jsx("input", { type: "hidden", name: "intent", value: "rename" }), _jsx("input", { type: "hidden", name: "ids", value: renaming.id }), renaming.version ? (_jsx("input", { type: "hidden", name: "versions", value: renaming.version })) : null, _jsx(DialogBody, { children: _jsxs("div", { className: "cap-field", children: [_jsx("label", { className: "cap-field-label", htmlFor: `${uid}-slug`, children: "New slug" }), _jsx("input", { className: "cap-input", id: `${uid}-slug`, name: "newId", defaultValue: renaming.id, pattern: SLUG, maxLength: 200, required: true, autoComplete: "off", spellCheck: false, "aria-describedby": `${uid}-slug-help` }), _jsx("p", { className: "cap-field-description", id: `${uid}-slug-help`, children: "Letters, digits, dots, dashes and underscores, starting with a letter or a digit." })] }) }), _jsxs(DialogFooter, { children: [_jsx(DialogClose, { part: "cancel", children: "Close" }), _jsx("button", { type: "submit", className: "cap-btn", "data-variant": "primary", children: "Rename" })] })] })] })) : null }));
}
// The preview link the last post made (`preview-link`, site-api v0.17.0): its address in a field
// that selects whole, Copy with script, and when it stops working in the reader's own zone. A status
// region, so the new link and a copy are said where the person is looking.
export function PreviewLinkBox({ link, name, noun, scripted, }) {
    const uid = useCleanId();
    const [copied, setCopied] = useState("");
    const [copiedFor, setCopiedFor] = useState(link?.url);
    if (link?.url !== copiedFor) {
        setCopiedFor(link?.url);
        setCopied("");
    }
    return (_jsx("div", { className: "cap-posts-preview", role: "status", "aria-label": "Preview link", children: link ? (_jsxs(_Fragment, { children: [_jsx("label", { className: "cap-field-label", htmlFor: `${uid}-url`, children: name ? `Preview link for ${name}` : "Preview link" }), _jsxs("div", { className: "cap-posts-preview-row", children: [_jsx("input", { className: "cap-input", id: `${uid}-url`, value: link.url, readOnly: true, onFocus: (e) => e.currentTarget.select(), "aria-describedby": `${uid}-until` }), scripted ? (_jsx("button", { type: "button", className: "cap-btn", onClick: () => void copyText(link.url).then((ok) => setCopied(ok ? "Copied." : "Could not copy. Select the address and copy it.")), children: "Copy" })) : null] }), _jsxs("p", { className: "cap-field-description", id: `${uid}-until`, children: ["Anyone with the link can read the ", noun, " until", " ", _jsx(Time, { at: link.expiresAt, format: "exact" }), ". ", copied] })] })) : null }));
}
// Asks before canceling an update: it has no Undo.
export const cancelRequest = (id, name, noun, version) => ({
    intent: "cancel-schedule",
    title: `Cancel the scheduled update to ${name}?`,
    lead: `The live ${noun} stays as it is and the update's changes are dropped. This cannot be undone.`,
    action: "Cancel the update",
    cancelLabel: "Keep the update",
    items: [name],
    fields: version ? { ids: [id], versions: [version] } : { ids: [id] },
});
