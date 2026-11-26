import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { COPIED_MS, COPY_FAILED_MS, copyText } from "../copy/copy.js";
import { formatBytes } from "../format/format.js";
import { linkable } from "../hooks/hooks.js";
import { Glyph } from "../status/status.react.js";
import { SAVE_TEXT } from "./media.js";
// The hidden fields every inspector form carries: what it is about and the version last seen.
export function Ident({ item, intent }) {
    return (_jsxs(_Fragment, { children: [_jsx("input", { type: "hidden", name: "intent", value: intent }), _jsx("input", { type: "hidden", name: "ids", value: item.key }), item.version ? _jsx("input", { type: "hidden", name: "versions", value: item.version }) : null] }));
}
function CloseGlyph() {
    return (_jsx("svg", { viewBox: "0 0 16 16", width: "16", height: "16", "aria-hidden": "true", focusable: "false", children: _jsx("path", { d: "M4 4l8 8M12 4l-8 8", fill: "none", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round" }) }));
}
// In form mode, a group of fields is its own form with its own Save button, posting `intent`, the
// file's id and its version; otherwise the fields sit in the inspector's one autosaving form.
export function Wrap({ on, F, action, label, intent, item, save, children, }) {
    if (!on || !action)
        return _jsx(_Fragment, { children: children });
    return (_jsxs(F, { method: "post", action: action, className: "cap-media-field-form", "aria-label": label, children: [_jsx(Ident, { item: item, intent: intent }), children, _jsx("button", { type: "submit", className: "cap-btn", "data-size": "sm", children: save })] }));
}
// The file's address, read-only, with a button for each way to copy it (address, Markdown, HTML) and a
// live line that says what was copied.
export function AddressCopy({ base, url, snippets, }) {
    const [copied, setCopied] = useState(null);
    const copy = async (value, what) => {
        setCopied(null);
        const ok = await copyText(value);
        setCopied(ok ? (_jsxs(_Fragment, { children: [_jsx(Glyph, { name: "ok" }), "Copied the ", what, "."] })) : (_jsxs(_Fragment, { children: [_jsx(Glyph, { name: "crit" }), "Could not copy. The address is selected: press Ctrl+C or Cmd+C."] })));
        window.setTimeout(() => setCopied(null), ok ? COPIED_MS : COPY_FAILED_MS);
    };
    return (_jsxs("div", { className: "cap-media-section", role: "group", "aria-labelledby": `${base}-addr-l`, children: [_jsx("label", { className: "cap-field-label", id: `${base}-addr-l`, htmlFor: `${base}-addr`, children: "Address" }), _jsx("input", { className: "cap-input", id: `${base}-addr`, "data-cap-part": "address", readOnly: true, value: url }), _jsx("div", { className: "cap-media-copy", children: snippets.map((s) => (_jsx("button", { type: "button", className: "cap-btn", "data-size": "sm", "data-cap-copy-kind": s.id, "aria-label": s.name, onClick: () => void copy(s.value, s.name.replace(/^Copy (the )?/, "")), children: s.label }, s.id))) }), _jsx("p", { className: "cap-media-copied", role: "status", "data-cap-part": "copied", children: copied })] }));
}
// The facts the system assigns, then where the file is used.
export function FactsUsed({ item, base, onShowUnattached, }) {
    return (_jsxs(_Fragment, { children: [_jsxs("dl", { className: "cap-media-facts", "data-cap-part": "facts", children: [_jsx("dt", { children: "Key" }), _jsx("dd", { children: item.key }), _jsx("dt", { children: "Type" }), _jsx("dd", { children: item.type || "unknown" }), _jsx("dt", { children: "Size" }), _jsx("dd", { children: formatBytes(item.bytes) }), _jsx("dt", { children: "Dimensions" }), _jsx("dd", { children: item.width && item.height ? `${item.width} by ${item.height}` : "not measured" }), _jsx("dt", { children: "Uploaded" }), _jsx("dd", { children: item.uploaded ?? "ships with the site" })] }), _jsxs("section", { className: "cap-media-section", "aria-labelledby": `${base}-used-l`, children: [_jsx("h3", { id: `${base}-used-l`, children: "Used in" }), _jsx("div", { "data-cap-part": "used", children: item.usedUnknown ? (_jsx("p", { className: "cap-media-note", children: "Where it is used was not checked for this list. Open the file to see." })) : item.used.length > 0 ? (_jsx("ul", { className: "cap-media-used", children: item.used.map((u) => (_jsxs("li", { children: [linkable(u.href) ? _jsx("a", { href: u.href, children: u.title }) : u.title, u.how ? _jsx("span", { className: "cap-media-used-how", children: u.how }) : null] }, u.href))) })) : (_jsxs(_Fragment, { children: [_jsx("p", { className: "cap-media-used-empty", children: "Not used anywhere." }), _jsxs("p", { className: "cap-media-note", children: ["A page built in code can still use it: check before you delete it.", " ", onShowUnattached ? (_jsx("button", { type: "button", className: "cap-btn", "data-variant": "link", onClick: onShowUnattached, children: "Show unattached files" })) : null] })] })) })] })] }));
}
// The footer: the save status with Retry (autosave), then Move to Trash or Restore and Delete, then Close.
export function InspectorFooter({ item, state, error, onRetry, formMode, F, action, can, onBin, onRestore, onClose, closeHref, }) {
    const binned = item.state === "binned";
    return (_jsxs(_Fragment, { children: [_jsxs("div", { className: "cap-dialog-footer", children: [formMode ? null : (_jsxs("div", { className: "cap-media-save", "data-cap-part": "save", "data-state": state, children: [_jsx("p", { role: "status", "data-cap-part": "save-status", children: state !== "failed" ? (_jsxs(_Fragment, { children: [state === "saving" ? (_jsx(Glyph, { name: "running" })) : state === "saved" ? (_jsx(Glyph, { name: "ok" })) : state === "dirty" ? (_jsx(Glyph, { name: "info" })) : null, SAVE_TEXT[state]] })) : null }), _jsx("p", { role: "alert", "data-cap-part": "save-error", children: state === "failed" ? (_jsxs(_Fragment, { children: [_jsx(Glyph, { name: "crit" }), "Could not save", error ? `: ${error.replace(/\.$/, "")}` : "", ". What you typed is still here."] })) : null }), _jsx("button", { type: "button", className: "cap-btn", "data-size": "sm", "data-cap-part": "retry-save", hidden: state !== "failed", onClick: () => onRetry(), children: "Retry" })] })), action ? (_jsxs(_Fragment, { children: [binned ? (_jsxs(F, { method: "post", action: action, className: "cap-media-act", children: [_jsx(Ident, { item: item, intent: "restore" }), _jsx("button", { type: "submit", className: "cap-btn", "data-cap-part": "restore", children: "Restore" })] })) : can.trash !== false ? (_jsxs(F, { method: "post", action: action, className: "cap-media-act", children: [_jsx(Ident, { item: item, intent: "trash" }), _jsx("button", { type: "submit", className: "cap-btn", "data-cap-part": "bin", children: "Move to Trash" })] })) : null, can.delete ? (_jsxs(F, { method: "post", action: action, className: "cap-media-act", children: [_jsx(Ident, { item: item, intent: "delete" }), _jsx("button", { type: "submit", className: "cap-btn", "data-variant": "danger", "data-cap-part": "delete", children: "Delete for good" })] })) : null] })) : binned ? (_jsx("button", { type: "button", className: "cap-btn", "data-cap-part": "restore", onClick: () => onRestore?.(item.key), children: "Restore" })) : (_jsx("button", { type: "button", className: "cap-btn", "data-cap-part": "bin", onClick: () => onBin?.(item.key), children: "Move to Trash" }))] }), closeHref ? (_jsx("a", { className: "cap-btn cap-dialog-close", "data-variant": "quiet", "data-icon-only": true, "data-cap-part": "close", "aria-label": "Close", href: closeHref, onClick: (e) => {
                    e.preventDefault();
                    onClose();
                }, children: _jsx(CloseGlyph, {}) })) : (_jsx("button", { type: "button", className: "cap-btn cap-dialog-close", "data-variant": "quiet", "data-icon-only": true, "data-cap-part": "close", "aria-label": "Close", onClick: onClose, children: _jsx(CloseGlyph, {}) }))] }));
}
