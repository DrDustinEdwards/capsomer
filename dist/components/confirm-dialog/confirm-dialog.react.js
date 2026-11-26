import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useId, useRef, useState } from "react";
import { Dialog, DialogDescription, DialogFooter, DialogHeader, DialogMedia, DialogTitle, DialogBody, } from "../dialog/dialog.react.js";
import { errorText } from "../dialog/dialog.js";
import { wordMatches } from "./confirm-server.js";
import { MEDIA_GLYPH } from "./confirm-page.react.js";
export { ConfirmPage, ConfirmModal } from "./confirm-page.react.js";
const ERROR_GLYPH = (_jsx("path", { fill: "currentColor", fillRule: "evenodd", d: "M5 1h6l4 4v6l-4 4H5l-4-4V5zM7.2 4v5h1.6V4zM7.2 10.4V12h1.6v-1.6z" }));
export function ConfirmDialog(props) {
    const { open, title, lead, body, action, typeToConfirm, reason: reasonOpt, perform, onClose, cancelLabel = "Cancel", returnTo, media = true, } = props;
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
    useEffect(() => {
        if (open)
            performed.current = false;
    }, [open]);
    const [wasOpen, setWasOpen] = useState(open);
    if (open !== wasOpen) {
        setWasOpen(open);
        if (open) {
            setError(null);
            setTyped("");
            setReason("");
        }
    }
    const run = async () => {
        if (busy)
            return;
        if (!matched) {
            typedRef.current?.focus();
            return;
        }
        // Read from the field too, so a value filled in without an input event still counts.
        const why = (reasonRef.current?.value ?? reason).trim();
        if (reasonOpt && !why) {
            setError({
                text: "Type what you are doing and why, then try again. Nothing was changed.",
                field: true,
            });
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
    const described = [lead ? `${id}-desc` : null, body.length > 0 ? `${id}-list` : null].filter(Boolean).join(" ") ||
        undefined;
    return (_jsxs(Dialog, { ref: dlg, open: open, onOpenChange: () => {
            setTyped("");
            setReason("");
            setError(null);
            onClose(performed.current);
        }, alert: true, size: "md", busy: busy, returnTo: returnTo, initialFocus: cancelRef, "aria-describedby": described, children: [_jsxs(DialogHeader, { children: [media && (_jsx(DialogMedia, { tone: "crit", children: _jsx("svg", { viewBox: "0 0 16 16", width: "16", height: "16", "aria-hidden": "true", focusable: "false", children: MEDIA_GLYPH }) })), _jsx(DialogTitle, { children: title }), lead ? _jsx(DialogDescription, { id: `${id}-desc`, children: lead }) : null] }), hasBody && (_jsxs(DialogBody, { children: [body.length > 0 && (_jsx("ul", { id: `${id}-list`, children: body.map((line) => (_jsx("li", { children: line }, line))) })), reasonOpt && (_jsxs("div", { className: "cap-confirm-reason", children: [_jsx("label", { htmlFor: `${id}-reason`, children: reasonOpt.label ?? "Reason (required)" }), _jsx("textarea", { ref: reasonRef, className: "cap-input", id: `${id}-reason`, rows: 3, "aria-required": "true", "aria-invalid": error?.field || undefined, "aria-describedby": error?.field ? `${id}-error ${id}-reason-note` : `${id}-reason-note`, readOnly: busy, "data-cap-part": "reason", value: reason, onChange: (e) => setReason(e.target.value), onKeyDown: (e) => {
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
/**
 * The state a page keeps for its confirm dialogs, so focus goes back to the control that asked.
 * `ask(subject, event.currentTarget)` opens; spread `props` into the ConfirmDialog.
 */
export function useConfirmAction() {
    const [asking, setAsking] = useState(null);
    const close = () => setAsking(null);
    return {
        subject: asking?.subject ?? null,
        ask: (subject, opener) => setAsking({ subject, opener: opener instanceof HTMLElement ? opener : null }),
        close,
        props: { returnTo: asking?.opener, onClose: close },
    };
}
/**
 * Preview, then perform: the preview writes nothing; perform carries it out. A perform refused because its
 * preview expired drops the preview, so the next press previews again. Answers after the dialog has gone are ignored.
 */
export function useTwoStep({ preview, perform, onDone, onSignedOut, reachText = (message) => `Could not reach the server: ${message}`, }) {
    const [shown, setShown] = useState(null);
    const [pending, setPending] = useState(null);
    const [error, setError] = useState(null);
    const alive = useRef(true);
    useEffect(() => {
        alive.current = true;
        return () => {
            alive.current = false;
        };
    }, []);
    const failed = (r) => {
        if (r.kind === "signed-out")
            return onSignedOut();
        if (r.kind === "expired")
            return setError({ text: r.message, expired: true });
        if (r.kind === "refused")
            return setError({ text: r.message, expired: false });
        setError({ text: reachText(r.message), expired: false });
    };
    const thrown = (lead, e) => setError({ text: `${lead}: ${e instanceof Error ? e.message : String(e)}`, expired: false });
    const runPreview = async (input) => {
        setPending("preview");
        setError(null);
        setShown(null);
        try {
            const r = await preview(input);
            if (!alive.current)
                return;
            if (r.kind === "ok")
                setShown(r.value);
            else
                failed(r);
        }
        catch (e) {
            if (alive.current)
                thrown("The preview could not be shown", e);
        }
        finally {
            if (alive.current)
                setPending(null);
        }
    };
    const runPerform = async () => {
        if (!shown)
            return;
        setPending("perform");
        setError(null);
        try {
            const r = await perform(shown);
            if (!alive.current)
                return;
            if (r.kind === "ok")
                return onDone(r.value);
            if (r.kind === "expired")
                setShown(null);
            failed(r);
        }
        catch (e) {
            if (alive.current)
                thrown("The result could not be shown", e);
        }
        finally {
            if (alive.current)
                setPending(null);
        }
    };
    return {
        preview: shown,
        pending,
        busy: pending !== null,
        error,
        setError,
        runPreview,
        runPerform,
    };
}
