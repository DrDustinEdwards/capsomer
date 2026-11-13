import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useId, useRef, useState } from "react";
import { useHydrated } from "../hooks/hooks.react.js";
import { acceptLabel, formatBytes, validateFiles } from "../drop-zone/drop-zone.js";
// Attach files to a record one choice at a time: a button that opens the file picker (the
// drop zone's input, drawn as a button, for a panel with no room for a zone), the same checks
// before anything is sent, each refusal said in words, and the list of what is attached.
export function FileAttach({ files, label = "Upload file", pending = false, pendingLabel = "Uploading…", accept, maxBytes, maxFiles, name = "file", form, onFiles, error, unavailable, renderRemove, emptyText = "No files uploaded.", newTabText = "(opens in a new tab)", }) {
    const ready = useHydrated();
    const inputId = useId();
    const hintId = useId();
    const input = useRef(null);
    const [refused, setRefused] = useState(null);
    // A finished upload clears the chosen file, so the same file can be chosen again.
    const was = useRef(pending);
    useEffect(() => {
        if (was.current && !pending && input.current)
            input.current.value = "";
        was.current = pending;
    }, [pending]);
    const room = maxFiles === undefined ? Infinity : maxFiles - files.length;
    const off = unavailable != null && unavailable !== false && unavailable !== "";
    const message = refused ?? error;
    const limits = [
        accept ? acceptLabel(accept) : null,
        maxBytes ? `up to ${formatBytes(maxBytes)}` : null,
    ]
        .filter(Boolean)
        .join(", ");
    return (_jsxs("div", { className: "cap-attach", children: [_jsx("div", { className: "cap-attach-control", children: off ? (_jsx("span", { className: "cap-attach-unavailable", children: unavailable })) : room > 0 ? (_jsxs(_Fragment, { children: [_jsxs("span", { className: "cap-attach-button", children: [_jsx("input", { ref: input, id: inputId, className: "cap-attach-input", type: "file", name: name, form: form, accept: accept, disabled: pending, "aria-describedby": limits ? hintId : undefined, onChange: (e) => {
                                        const el = e.currentTarget;
                                        const { accepted, rejected } = validateFiles(el.files ?? [], {
                                            accept,
                                            maxBytes,
                                            maxFiles: room === Infinity ? undefined : room,
                                        });
                                        setRefused(rejected.length ? rejected.map((r) => r.message).join(" ") : null);
                                        if (rejected.length || !accepted.length) {
                                            el.value = "";
                                            return;
                                        }
                                        onFiles?.(accepted, el);
                                    } }), _jsx("label", { htmlFor: inputId, className: "cap-btn", "data-size": "sm", "aria-disabled": pending || undefined, children: pending ? pendingLabel : label })] }), limits ? (_jsx("span", { className: "cap-attach-hint", id: hintId, children: limits })) : null, ready ? null : (_jsx("button", { type: "submit", form: form, className: "cap-btn", "data-size": "sm", children: "Upload" }))] })) : null }), _jsx("p", { className: "cap-field-error", role: "alert", hidden: !message, children: message ?? null }), files.length === 0 ? (_jsx("p", { className: "cap-attach-empty", children: emptyText })) : (_jsx("ul", { className: "cap-attach-list", children: files.map((f) => (_jsxs("li", { className: "cap-attach-item", children: [f.href ? (_jsxs("a", { href: f.href, target: "_blank", rel: "noopener noreferrer", children: [f.name, _jsxs("span", { className: "cap-sr-only", children: [" ", newTabText] })] })) : (_jsx("span", { children: f.name })), _jsxs("span", { className: "cap-attach-item-end", children: [f.meta ? _jsx("span", { className: "cap-attach-meta", children: f.meta }) : null, renderRemove && !off ? renderRemove(f) : null] })] }, f.id))) }))] }));
}
