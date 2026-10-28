import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useId, useRef, useState } from "react";
import { Dialog, DialogDescription, DialogFooter, DialogHeader, DialogMedia, DialogTitle, DialogBody } from "../dialog/dialog.react.js";
import { errorText, wordMatches, wordPattern } from "./confirm-dialog.js";
const ERROR_GLYPH = _jsx("path", { fill: "currentColor", fillRule: "evenodd", d: "M5 1h6l4 4v6l-4 4H5l-4-4V5zM7.2 4v5h1.6V4zM7.2 10.4V12h1.6v-1.6z" });
const MEDIA_GLYPH = _jsx("path", { fill: "currentColor", fillRule: "evenodd", d: "M8 1.5l7 12.5H1zM7.2 6v4h1.6V6zM7.2 10.8v1.4h1.6v-1.4z" });
export function ConfirmDialog(props) {
    const { open, title, lead, body, action, typeToConfirm, reason: reasonOpt, perform, onClose, cancelLabel = "Cancel", returnTo, media = true } = props;
    const id = useId();
    const dlg = useRef(null);
    const cancelRef = useRef(null);
    const performRef = useRef(null);
    const typedRef = useRef(null);
    const reasonRef = useRef(null);
    const performed = useRef(false);
    const [busy, setBusy] = useState(false);
    // field: the error is about the reason field itself, so the field is marked invalid.
    const [error, setError] = useState(null);
    const [typed, setTyped] = useState("");
    const [reason, setReason] = useState("");
    const matched = wordMatches(typed, typeToConfirm);
    // A fresh dialog each time it opens.
    useEffect(() => {
        if (!open)
            return;
        performed.current = false;
        setError(null);
        setTyped("");
        setReason("");
    }, [open]);
    const run = async () => {
        if (busy)
            return;
        if (!matched) {
            typedRef.current?.focus();
            return;
        }
        // Read from the field as well as from state, so a value the browser filled in without
        // an input event still counts.
        const why = (reasonRef.current?.value ?? reason).trim();
        if (reasonOpt && !why) {
            setError({ text: "Type what you are doing and why, then try again. Nothing was changed.", field: true });
            reasonRef.current?.focus();
            return;
        }
        setBusy(true);
        setError(null);
        try {
            await perform(why);
            performed.current = true;
            setBusy(false);
            dlg.current?.close("performed");
        }
        catch (e) {
            setBusy(false);
            setError({ text: errorText(e), field: false });
            performRef.current?.focus();
        }
    };
    const guardOff = !!typeToConfirm && !matched;
    const failed = error != null && !error.field;
    const hasBody = body.length > 0 || !!reasonOpt || !!typeToConfirm;
    const described = [lead ? `${id}-desc` : null, body.length > 0 ? `${id}-list` : null].filter(Boolean).join(" ") || undefined;
    return (_jsxs(Dialog, { ref: dlg, open: open, onOpenChange: () => {
            setTyped("");
            setReason("");
            setError(null);
            onClose(performed.current);
        }, alert: true, size: "md", busy: busy, returnTo: returnTo, initialFocus: cancelRef, "aria-describedby": described, children: [_jsxs(DialogHeader, { children: [media && (_jsx(DialogMedia, { tone: "crit", children: _jsx("svg", { viewBox: "0 0 16 16", width: "16", height: "16", "aria-hidden": "true", focusable: "false", children: MEDIA_GLYPH }) })), _jsx(DialogTitle, { children: title }), lead ? _jsx(DialogDescription, { id: `${id}-desc`, children: lead }) : null] }), hasBody && (_jsxs(DialogBody, { children: [body.length > 0 && (_jsx("ul", { id: `${id}-list`, children: body.map((line) => (_jsx("li", { children: line }, line))) })), reasonOpt && (_jsxs("div", { className: "cap-confirm-reason", children: [_jsx("label", { htmlFor: `${id}-reason`, children: reasonOpt.label ?? "Reason (required)" }), _jsx("textarea", { ref: reasonRef, className: "cap-input", id: `${id}-reason`, rows: 3, "aria-required": "true", "aria-invalid": error?.field || undefined, "aria-describedby": error?.field ? `${id}-error ${id}-reason-note` : `${id}-reason-note`, readOnly: busy, "data-cap-part": "reason", value: reason, onChange: (e) => setReason(e.target.value), onKeyDown: (e) => {
                                    // Ctrl or Cmd with Enter performs; a plain Enter is a new line.
                                    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                                        e.preventDefault();
                                        void run();
                                    }
                                } }), _jsx("p", { className: "cap-confirm-note", id: `${id}-reason-note`, "data-cap-part": "reason-note", children: reasonOpt.note ?? "Recorded with the change." })] })), typeToConfirm && (_jsxs("div", { className: "cap-confirm-typed", children: [_jsxs("label", { id: `${id}-typed-label`, htmlFor: `${id}-typed`, children: ["Type ", _jsx("b", { children: typeToConfirm }), " to confirm"] }), _jsx("input", { ref: typedRef, className: "cap-input", id: `${id}-typed`, type: "text", autoComplete: "off", autoCapitalize: "off", spellCheck: false, readOnly: busy, "data-cap-part": "typed", "data-cap-word": typeToConfirm, value: typed, onChange: (e) => setTyped(e.target.value), onKeyDown: (e) => {
                                    if (e.key !== "Enter")
                                        return;
                                    e.preventDefault();
                                    if (matched)
                                        void run();
                                } })] }))] })), _jsx("div", { className: "cap-confirm-error", role: "alert", id: `${id}-error`, "data-cap-part": "error", children: error && (_jsxs(_Fragment, { children: [_jsxs("p", { className: "cap-confirm-error-lead", children: [_jsx("svg", { viewBox: "0 0 16 16", width: "14", height: "14", "aria-hidden": "true", focusable: "false", children: ERROR_GLYPH }), error.field ? "A reason is required." : "Not done. Nothing was changed."] }), _jsx("p", { children: error.text })] })) }), _jsxs(DialogFooter, { align: "between", children: [_jsx("button", { ref: cancelRef, type: "button", className: "cap-btn", "data-cap-part": "cancel", "aria-disabled": busy || undefined, children: cancelLabel }), _jsx("button", { ref: performRef, type: "button", className: "cap-btn", "data-variant": "danger", "data-cap-part": "perform", "aria-busy": busy || undefined, "aria-disabled": busy || guardOff || undefined, "aria-describedby": guardOff ? `${id}-typed-label` : undefined, onClick: () => void run(), children: failed ? "Try again" : action })] })] }));
}
// The confirmation as a form in the page, for a server that answers a destructive request with
// its own page and works with no script. Pure markup, so a server render and the browser agree.
export function ConfirmPage({ action, method = "post", hidden, title, lead, body = [], action_label = "Confirm", cancelHref, cancelLabel = "Cancel", typeToConfirm, reason, error, media = true, headingLevel = "h1", children, onCancel, renderForm }) {
    const id = useId().replace(/[^a-zA-Z0-9]/g, "");
    const Heading = headingLevel;
    const described = [lead ? `${id}-desc` : null, body.length ? `${id}-list` : null].filter(Boolean).join(" ") || undefined;
    const hasBody = body.length > 0 || !!reason || !!typeToConfirm;
    const parts = (_jsxs(_Fragment, { children: [Object.entries(hidden ?? {}).flatMap(([k, v]) => (typeof v === "string" ? [v] : v).map((one, i) => _jsx("input", { type: "hidden", name: k, value: one }, `${k}-${i}`))), _jsxs("div", { className: "cap-dialog-header", children: [media ? (_jsx("div", { className: "cap-dialog-media", "data-tone": "crit", "aria-hidden": "true", children: _jsx("svg", { viewBox: "0 0 16 16", width: "16", height: "16", "aria-hidden": "true", focusable: "false", children: MEDIA_GLYPH }) })) : null, _jsx(Heading, { className: "cap-dialog-title", id: `${id}-title`, children: title }), lead == null ? null : typeof lead === "string" ? (_jsx("p", { className: "cap-dialog-description", id: `${id}-desc`, children: lead })) : (_jsx("div", { className: "cap-dialog-description", id: `${id}-desc`, children: lead }))] }), children, hasBody ? (_jsxs("div", { className: "cap-dialog-body", children: [body.length ? (_jsx("ul", { id: `${id}-list`, children: body.map((line) => (_jsx("li", { children: line }, line))) })) : null, reason ? (_jsxs("div", { className: "cap-confirm-reason", children: [_jsx("label", { htmlFor: `${id}-reason`, children: reason.label ?? "Reason (required)" }), _jsx("textarea", { className: "cap-input", id: `${id}-reason`, name: "reason", rows: 3, required: true, "aria-describedby": `${id}-reason-note` }), _jsx("p", { className: "cap-confirm-note", id: `${id}-reason-note`, children: reason.note ?? "Recorded with the change." })] })) : null, typeToConfirm ? (_jsxs("div", { className: "cap-confirm-typed", children: [_jsxs("label", { htmlFor: `${id}-typed`, children: ["Type ", _jsx("b", { children: typeToConfirm }), " to confirm"] }), _jsx("input", { className: "cap-input", id: `${id}-typed`, name: "confirm", required: true, pattern: wordPattern(typeToConfirm), title: `Type ${typeToConfirm}`, autoComplete: "off", spellCheck: false })] })) : null] })) : null, _jsx("div", { className: "cap-confirm-error", role: "alert", children: error ? (_jsxs(_Fragment, { children: [_jsx("b", { className: "cap-confirm-error-lead", children: "Not done. Nothing was changed." }), " ", error] })) : null }), _jsxs("div", { className: "cap-dialog-footer", "data-align": "between", children: [_jsx("a", { className: "cap-btn", href: cancelHref, onClick: onCancel
                            ? (e) => {
                                e.preventDefault();
                                onCancel();
                            }
                            : undefined, children: cancelLabel }), _jsx("button", { type: "submit", className: "cap-btn", "data-variant": "danger", children: action_label })] })] }));
    const formProps = { className: "cap-confirm-page", "data-cap": "confirm-page", action, method, role: "group", "aria-labelledby": `${id}-title`, "aria-describedby": described, children: parts };
    return renderForm ? renderForm(formProps) : _jsx("form", { ...formProps });
}
// The confirm page as a modal (0.22.0), for a server that answers a destructive request by drawing
// the confirmation over the page it came from. It is in the page until script runs (data-inline),
// so a reader with no script still gets the second step; then it opens as a modal. Esc leaves the
// way Cancel does, and focus goes back to the control that opened it, or to that control's menu
// button when the control was in a menu that has closed, or to the page's main region.
export function ConfirmModal(props) {
    const ref = useRef(null);
    const [ready, setReady] = useState(false);
    const cancel = () => (props.onCancel ? props.onCancel() : location.assign(props.cancelHref));
    useEffect(() => {
        setReady(true);
        // Read before showModal() moves focus: the control that opened it, or nothing on a page load.
        const active = document.activeElement;
        const origin = active instanceof HTMLElement && active !== document.body ? active : null;
        const d = ref.current;
        if (d && !d.open)
            d.showModal();
        // The typed word or the reason when there is one, else Cancel, as an alert dialog's.
        d?.querySelector(".cap-confirm-typed input, .cap-confirm-reason textarea, .cap-dialog-footer .cap-btn")?.focus();
        return () => {
            // Deferred, so the page Cancel returns to has rendered.
            window.setTimeout(() => {
                if (document.activeElement && document.activeElement !== document.body)
                    return;
                const panel = origin?.closest("[popover]");
                const candidates = [origin, panel?.id ? document.querySelector(`[popovertarget="${CSS.escape(panel.id)}"]`) : null, document.querySelector("main")];
                for (const back of candidates) {
                    if (!back?.isConnected)
                        continue;
                    back.focus({ preventScroll: true });
                    if (document.activeElement === back)
                        return;
                }
            }, 0);
        };
    }, []);
    return (_jsx("dialog", { ref: ref, className: "cap-dialog cap-confirm-modal", "data-placement": "center", "data-size": "md", role: "alertdialog", "aria-label": props.title, "data-inline": ready ? undefined : "", onCancel: (e) => {
            e.preventDefault();
            cancel();
        }, children: _jsx(ConfirmPage, { ...props, headingLevel: "h2" }) }));
}
