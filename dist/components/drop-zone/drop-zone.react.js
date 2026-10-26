import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useId, useRef, useState } from "react";
import { acceptedText, dragHasFiles, formatBytes, rejectedLead, setInputFiles, validateFiles } from "./drop-zone.js";
const CRIT = "M5 1h6l4 4v6l-4 4H5l-4-4V5zM7.2 4h1.6v5H7.2zM7.2 10.4h1.6V12H7.2z";
export function DropZone({ accept, maxBytes, maxFiles, multiple = false, name, disabled, scope = "zone", paste, title, hint, onAccepted, onRejected, id }) {
    const own = useId();
    const base = id ?? own;
    const input = useRef(null);
    const root = useRef(null);
    const [over, setOver] = useState(false);
    const [accepted, setAccepted] = useState([]);
    const [rejected, setRejected] = useState([]);
    // The handlers read the latest props through a ref, so the listeners attach once.
    const latest = useRef({ accept, maxBytes, maxFiles, multiple, disabled, onAccepted, onRejected });
    latest.current = { accept, maxBytes, maxFiles, multiple, disabled, onAccepted, onRejected };
    useEffect(() => {
        const el = root.current;
        if (!el)
            return;
        const take = (files, fromInput = false) => {
            const l = latest.current;
            const rules = { accept: l.accept, maxBytes: l.maxBytes, maxFiles: l.maxFiles ?? (l.multiple ? undefined : 1) };
            const result = validateFiles(Array.from(files), rules);
            if (input.current && (!fromInput || result.rejected.length > 0))
                setInputFiles(input.current, result.accepted);
            setAccepted(result.accepted);
            setRejected(result.rejected);
            if (result.accepted.length > 0)
                l.onAccepted?.(result.accepted, result.rejected);
            if (result.rejected.length > 0)
                l.onRejected?.(result.rejected, result.accepted);
        };
        const page = scope === "page";
        const target = page ? window : el;
        let depth = 0;
        const onEnter = (e) => {
            if (!dragHasFiles(e) || latest.current.disabled)
                return;
            depth += 1;
            setOver(true);
        };
        const onOver = (e) => {
            if (!dragHasFiles(e) || latest.current.disabled)
                return;
            e.preventDefault();
        };
        const onLeave = (e) => {
            if (depth === 0 || !dragHasFiles(e))
                return;
            depth = Math.max(0, depth - 1);
            if (depth === 0)
                setOver(false);
        };
        const onDrop = (e) => {
            const ev = e;
            depth = 0;
            setOver(false);
            if (ev.defaultPrevented)
                return;
            const files = ev.dataTransfer?.files;
            if (!files || files.length === 0) {
                const editable = ev.target instanceof Element && ev.target.closest("input, textarea, [contenteditable='true']");
                if (page && !editable)
                    ev.preventDefault();
                return;
            }
            if (latest.current.disabled)
                return;
            ev.preventDefault();
            take(files);
            input.current?.focus({ preventScroll: true });
        };
        const onPaste = (e) => {
            const files = e.clipboardData?.files;
            if (!files || files.length === 0 || latest.current.disabled)
                return;
            e.preventDefault();
            take(files);
        };
        const inputEl = input.current;
        const onChange = () => {
            if (inputEl?.files)
                take(Array.from(inputEl.files), true);
        };
        target.addEventListener("dragenter", onEnter);
        target.addEventListener("dragover", onOver);
        target.addEventListener("dragleave", onLeave);
        target.addEventListener("drop", onDrop);
        inputEl?.addEventListener("change", onChange);
        const pasteTarget = paste ? (page ? document : el) : null;
        pasteTarget?.addEventListener("paste", onPaste);
        return () => {
            target.removeEventListener("dragenter", onEnter);
            target.removeEventListener("dragover", onOver);
            target.removeEventListener("dragleave", onLeave);
            target.removeEventListener("drop", onDrop);
            inputEl?.removeEventListener("change", onChange);
            pasteTarget?.removeEventListener("paste", onPaste);
        };
    }, [scope, paste]);
    const state = over ? "over" : rejected.length > 0 ? "rejected" : "idle";
    return (_jsxs("div", { ref: root, className: "cap-drop", "data-state": state, "data-scope": scope === "page" ? "page" : undefined, children: [_jsxs("label", { className: "cap-drop-label", children: [_jsx("input", { ref: input, className: "cap-drop-input", type: "file", name: name, multiple: multiple || (maxFiles ?? 1) > 1, accept: accept, disabled: disabled, "aria-labelledby": `${base}-title`, "aria-describedby": `${base}-hint` }), _jsx("span", { className: "cap-drop-icon", "aria-hidden": "true", children: _jsx("svg", { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round", children: _jsx("path", { d: "M12 16V4m0 0L7 9m5-5 5 5M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3" }) }) }), _jsxs("span", { className: "cap-drop-title", id: `${base}-title`, children: [_jsx("span", { className: "cap-drop-idle", children: title ?? (_jsxs(_Fragment, { children: [multiple ? "Drop files here, or " : "Drop a file here, or ", _jsx("span", { className: "cap-drop-browse", children: "browse" })] })) }), _jsx("span", { className: "cap-drop-over", children: "Drop to upload" })] }), _jsx("span", { className: "cap-drop-hint", id: `${base}-hint`, children: hint })] }), _jsx("div", { className: "cap-drop-status", role: "status", children: accepted.length > 0 ? (_jsxs(_Fragment, { children: [_jsx("p", { className: "cap-drop-lead", children: acceptedText(accepted) }), _jsx("ul", { className: "cap-drop-files", children: accepted.map((f, i) => (_jsxs("li", { children: [_jsx("span", { className: "cap-drop-file-name", children: f.name }), _jsx("span", { className: "cap-drop-file-size", children: formatBytes(f.size) })] }, `${f.name}-${i}`))) })] })) : null }), _jsx("div", { className: "cap-drop-rejections", role: "alert", children: rejected.length > 0 ? (_jsxs(_Fragment, { children: [_jsxs("p", { className: "cap-drop-lead", "data-tone": "crit", children: [_jsx("svg", { className: "cap-status-glyph", viewBox: "0 0 16 16", "aria-hidden": "true", focusable: "false", children: _jsx("path", { fill: "currentColor", fillRule: "evenodd", d: CRIT }) }), rejectedLead(rejected.length)] }), _jsx("ul", { className: "cap-drop-files", children: rejected.map((r, i) => (_jsx("li", { children: r.message }, `${r.file.name}-${i}`))) })] })) : null }), scope === "page" ? (_jsx("div", { className: "cap-drop-overlay", "aria-hidden": "true", children: _jsxs("div", { children: [_jsx("p", { className: "cap-drop-overlay-title", children: "Drop to upload" }), _jsx("p", { className: "cap-drop-overlay-text", children: "Release anywhere on this page to add the files." })] }) })) : null] }));
}
