import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useId, useRef, useState, } from "react";
import { isImeEnter } from "../shortcuts/shortcuts.js";
import { attachRowList } from "./row-list.js";
export function RowList({ labelledBy, label, primary = false, gap, children }) {
    const ref = useRef(null);
    useEffect(() => (ref.current ? attachRowList(ref.current) : undefined), []);
    return (_jsx("ul", { ref: ref, className: "cap-rows", "data-cap": "row-list", role: "list", "aria-labelledby": labelledBy, "aria-label": labelledBy ? undefined : label, "data-cap-primary": primary ? "" : undefined, "data-gap": gap === undefined ? undefined : gap === "default" ? "" : gap, children: children }));
}
const plainLink = ({ children, ...props }) => _jsx("a", { ...props, children: children });
export function Row({ title, href, onOpen, status, detail, meta, actions, tone, variant, size, media, mediaVariant, expanded, controls, className, renderLink = plainLink, reply, }) {
    const id = useId();
    // The link's name is the title; the status and the detail are its description, so a
    // screen reader moving by link still hears "Critical" and why.
    const described = [status != null ? `${id}-status` : "", detail != null ? `${id}-detail` : ""]
        .filter(Boolean)
        .join(" ") || undefined;
    return (_jsxs("li", { className: className ? `cap-row ${className}` : "cap-row", "data-tone": tone, "data-variant": variant, "data-size": size, "data-static": href == null && onOpen == null && expanded === undefined ? "" : undefined, children: [media != null && (_jsx("span", { className: "cap-row-media", "data-variant": mediaVariant, children: media })), status != null && (_jsx("span", { className: "cap-row-status", id: `${id}-status`, children: status })), _jsx("div", { className: "cap-row-title", children: href != null ? (renderLink({ href, "aria-describedby": described, children: title })) : onOpen == null && expanded === undefined ? (_jsx("span", { className: "cap-row-text", children: title })) : (_jsx("button", { type: "button", "aria-describedby": described, "aria-expanded": expanded, "aria-controls": expanded === undefined ? undefined : controls, onClick: onOpen, children: title })) }), detail != null && (_jsx("p", { className: "cap-row-detail", id: `${id}-detail`, children: detail })), (meta != null || expanded !== undefined) && (_jsxs("span", { className: "cap-row-meta", children: [meta, expanded !== undefined ? _jsx("span", { className: "cap-row-chevron", "aria-hidden": "true" }) : null] })), actions != null && _jsx("div", { className: "cap-row-actions", children: actions }), reply != null && _jsx("div", { className: "cap-row-reply", children: reply })] }));
}
// A reply inside a row: a labeled box that takes focus when it opens, Send and Cancel, a hint
// that is announced when the words cannot be sent, Ctrl or Cmd+Enter to send and Esc to cancel.
export function RowReply({ label, onSend, onCancel, sendLabel = "Send", emptyHint = "Write something first.", defaultValue = "", rows = 3, }) {
    const id = useId();
    const [text, setText] = useState(defaultValue);
    const [hint, setHint] = useState(null);
    const [busy, setBusy] = useState(false);
    const box = useRef(null);
    useEffect(() => box.current?.focus(), []);
    const send = async () => {
        if (busy)
            return;
        if (!text.trim()) {
            setHint(emptyHint);
            return;
        }
        setBusy(true);
        try {
            const refused = await onSend(text.trim());
            if (typeof refused === "string")
                setHint(refused);
        }
        finally {
            setBusy(false);
        }
    };
    return (_jsxs("form", { className: "cap-row-reply-form", "aria-busy": busy || undefined, onSubmit: (e) => {
            e.preventDefault();
            void send();
        }, children: [_jsx("label", { className: "cap-field-label", htmlFor: `${id}-text`, children: label }), _jsx("textarea", { ref: box, className: "cap-input", id: `${id}-text`, rows: rows, value: text, "aria-invalid": hint ? true : undefined, "aria-describedby": hint ? `${id}-hint` : undefined, onChange: (e) => {
                    setText(e.target.value);
                    setHint(null);
                }, onKeyDown: (e) => {
                    if (e.key === "Escape") {
                        e.preventDefault();
                        onCancel();
                    }
                    else if (e.key === "Enter" && (e.ctrlKey || e.metaKey) && !isImeEnter(e.nativeEvent)) {
                        e.preventDefault();
                        void send();
                    }
                } }), hint && (_jsx("p", { className: "cap-field-error", id: `${id}-hint`, role: "alert", children: hint })), _jsxs("div", { className: "cap-row-reply-actions", children: [_jsx("button", { type: "submit", className: "cap-btn", "data-variant": "primary", disabled: busy, children: sendLabel }), _jsx("button", { type: "button", className: "cap-btn", onClick: onCancel, children: "Cancel" })] })] }));
}
function PlainForm({ method = "post", ...props }) {
    return _jsx("form", { method: method, ...props });
}
// The default: a plain form that posts and loads the page the server answers with.
export function usePlainRowForm() {
    return { Form: PlainForm, pending: false };
}
