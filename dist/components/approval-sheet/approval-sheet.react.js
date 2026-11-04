import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useId, useRef, useState } from "react";
import { Dialog, DialogBody, DialogClose, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../dialog/dialog.react.js";
import { approveLabel, titleText } from "./approval-sheet.js";
export function ApprovalSheet({ open, gates, onApprove, onClose, lead = "Each command runs once, when approved. Uncheck a gate you are not ready for; it stays waiting." }) {
    const id = useId();
    const ref = useRef(null);
    const [checked, setChecked] = useState({});
    const [comments, setComments] = useState({});
    const [pending, setPending] = useState(false);
    const [error, setError] = useState(null);
    // A fresh sheet each time it opens: every gate's starting choice, no comments, no error.
    useEffect(() => {
        if (!open)
            return;
        setChecked(Object.fromEntries(gates.map((g) => [g.id, g.include ?? true])));
        setComments({});
        setError(null);
        setPending(false);
    }, [open]);
    const chosen = gates.filter((g) => checked[g.id] ?? g.include ?? true).map((g) => ({ id: g.id, comment: (comments[g.id] ?? "").trim() }));
    const n = chosen.length;
    const noneId = `${id}-none`;
    const submit = async (e) => {
        e.preventDefault();
        if (n === 0 || pending)
            return;
        setError(null);
        const result = onApprove(chosen);
        if (!result || typeof result.then !== "function")
            return;
        setPending(true);
        try {
            await result;
            setPending(false);
            // Closing fires the dialog's close event, which calls onClose.
            ref.current?.close();
        }
        catch (err) {
            setPending(false);
            setError(err instanceof Error && err.message ? err.message : "Could not approve. Nothing was approved. Try again.");
        }
    };
    // The shared Dialog does the opening, focus (on Cancel, as the sheet is destructive), the
    // return of focus, Esc and Cancel being held while busy, and the locked backdrop.
    return (_jsx(Dialog, { ref: ref, className: "cap-approval", size: "lg", open: open, onOpenChange: (o) => !o && onClose(), modalLock: true, destructive: true, busy: pending, closeButton: false, described: true, children: _jsxs("form", { className: "cap-approval-form", onSubmit: submit, children: [_jsxs(DialogHeader, { children: [_jsx(DialogTitle, { children: titleText(gates.length) }), _jsx(DialogDescription, { children: lead })] }), _jsx(DialogBody, { className: "cap-approval-gates", flush: true, role: "group", "aria-label": "Gates waiting for approval", children: gates.map((g, i) => (_jsxs("fieldset", { className: "cap-approval-gate", disabled: pending, children: [_jsx("legend", { className: "cap-approval-job", children: g.title }), g.meta && _jsx("p", { className: "cap-approval-meta", children: g.meta }), _jsx("pre", { className: "cap-approval-cmd", children: _jsx("code", { children: g.command }) }), _jsxs("label", { className: "cap-check", children: [_jsx("input", { type: "checkbox", "data-cap-part": "include", name: "gate", value: g.id, checked: checked[g.id] ?? g.include ?? true, onChange: (e) => setChecked((c) => ({ ...c, [g.id]: e.target.checked })) }), " ", "Include this gate"] }), _jsxs("div", { className: "cap-field", children: [_jsx("label", { className: "cap-field-label", htmlFor: `${id}-c${i}`, children: "Comment (optional)" }), _jsx("textarea", { className: "cap-input", id: `${id}-c${i}`, "data-cap-part": "comment", rows: 2, value: comments[g.id] ?? "", onChange: (e) => setComments((c) => ({ ...c, [g.id]: e.target.value })) })] })] }, g.id))) }), error && (_jsx("div", { className: "cap-approval-error", "data-cap-part": "error", children: _jsx("div", { className: "cap-alert", "data-tone": "crit", role: "alert", children: _jsx("span", { "data-cap-part": "error-text", children: error }) }) })), _jsxs(DialogFooter, { align: "between", children: [_jsx(DialogClose, { part: "cancel", children: "Cancel" }), _jsx("p", { className: "cap-approval-none", id: noneId, "data-cap-part": "none", hidden: n !== 0, children: "Choose at least one gate." }), _jsxs("button", { type: "submit", className: "cap-btn", "data-variant": "primary", "data-cap-part": "approve", "aria-busy": pending ? "true" : undefined, "aria-disabled": n === 0 ? "true" : undefined, "aria-describedby": n === 0 ? noneId : undefined, children: [pending && _jsx("span", { className: "cap-btn-spinner", "aria-hidden": "true" }), _jsx("span", { "data-cap-part": "approve-label", children: approveLabel(n, pending) })] })] })] }) }));
}
