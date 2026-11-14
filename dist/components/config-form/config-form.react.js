import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useRef, useState } from "react";
import { Alert } from "../banner/banner.react.js";
import { Button } from "../button/button.react.js";
import { Panel } from "../panel/panel.react.js";
// The editor state and form ids live in config-editor.react.tsx, so a list view that imports
// only useEditor does not load this module's Button, Alert and Panel.
export { useConfigForm, useEditor } from "./config-editor.react.js";
// The one shell of an operator's add and edit forms: a panel that scrolls into view and puts focus
// in its first field when it opens and hands focus back to its opener when it closes, the fields
// in a grid, a hint while the draft is not sendable, the submit and Cancel, and an optional Danger
// area. Esc in a field cancels.
export function ConfigForm({ f, first, title, src, hint, onSubmit, onClose, submitLabel = "Preview", danger, children, }) {
    const box = useRef(null);
    const form = useRef(null);
    // The control that opened the form (Add, Edit) gets focus back when the form closes by Cancel,
    // Esc or a save, if focus was lost with the form; a control that has gone keeps nothing.
    // Read while rendering, before the form's own focus and before an app disables its Add button.
    const [opener] = useState(() => typeof document === "undefined" ? null : document.activeElement);
    useEffect(() => {
        return () => {
            requestAnimationFrame(() => {
                const now = document.activeElement;
                const lost = !now || now === document.body || !now.isConnected;
                if (lost && opener instanceof HTMLElement && opener.isConnected)
                    opener.focus();
            });
        };
    }, [opener]);
    useEffect(() => {
        box.current?.scrollIntoView({ block: "nearest" });
        first.current?.focus();
    }, [first]);
    // Esc in any field cancels, as Cancel does.
    const close = useRef(onClose);
    useEffect(() => {
        close.current = onClose;
    });
    useEffect(() => {
        const el = form.current;
        const onKey = (e) => {
            if (e.key !== "Escape" || e.defaultPrevented)
                return;
            e.preventDefault();
            close.current();
        };
        el?.addEventListener("keydown", onKey);
        return () => el?.removeEventListener("keydown", onKey);
    }, []);
    return (_jsx(Panel, { title: title, src: src, headingId: f("h"), ref: box, className: "cap-config", children: _jsxs("form", { ref: form, className: "cap-fields cap-config-form", noValidate: true, onSubmit: (e) => {
                e.preventDefault();
                onSubmit();
            }, children: [children, hint && (_jsx("div", { className: "cap-config-full", children: _jsx(Alert, { tone: "warn", children: hint }) })), _jsxs("div", { className: "cap-config-actions cap-config-full", children: [_jsx(Button, { type: "submit", variant: "primary", children: submitLabel }), _jsx(Button, { onClick: onClose, children: "Cancel" })] }), danger != null && _jsx("div", { className: "cap-config-danger cap-config-full", children: danger })] }) }));
}
