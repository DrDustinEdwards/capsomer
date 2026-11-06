import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useId, useRef, useState } from "react";
import { Button } from "../button/button.react.js";
import { stateWord } from "../switch/switch.js";
import { MISSING, failedMessage, reasonLabel, verbFor } from "./switch-reason.js";
const ownMessage = (err) => (err instanceof Error && err.message ? err.message : String(err));
// The one-line reason a change asks for, beside the control that changes it: a switch (as
// SwitchWithReason), a radio group or any other control whose change is recorded with a reason.
// Enter applies (a reason is required), Esc cancels.
export function ReasonForm({ open, verb, onApply, onCancel, failed = ownMessage, id, placeholder, onPendingChange }) {
    const base = useId();
    const reasonId = id ?? `${base}-why`;
    const errorId = `${reasonId}-err`;
    const keysId = `${reasonId}-keys`;
    const [reason, setReason] = useState("");
    const [error, setError] = useState(null);
    const [pending, setPendingState] = useState(false);
    const reasonRef = useRef(null);
    const alive = useRef(true);
    useEffect(() => {
        alive.current = true;
        return () => {
            alive.current = false;
        };
    }, []);
    useEffect(() => {
        if (open)
            reasonRef.current?.focus();
        else {
            setReason("");
            setError(null);
        }
    }, [open]);
    const setPending = (p) => {
        setPendingState(p);
        onPendingChange?.(p);
    };
    const submit = async (e) => {
        e.preventDefault();
        if (pending)
            return;
        // Read from the field too, so a value filled in without an input event counts.
        const text = (reasonRef.current?.value ?? reason).trim();
        if (!text) {
            setError(MISSING);
            reasonRef.current?.focus();
            return;
        }
        setError(null);
        setPending(true);
        try {
            await onApply(text);
            if (!alive.current)
                return;
            setPending(false);
        }
        catch (err) {
            if (!alive.current)
                return;
            setPending(false);
            setError(failed(err));
            reasonRef.current?.focus();
        }
    };
    // Held while the request runs, so its answer is not hidden. Stopped here either way, so an
    // Esc that cancels the reason does not also close a panel the form sits in.
    const onKey = (e) => {
        if (e.key !== "Escape")
            return;
        e.preventDefault();
        e.stopPropagation();
        if (!pending)
            onCancel();
    };
    return (_jsxs("form", { className: "cap-switch-reason-form", hidden: !open, noValidate: true, "aria-busy": pending || undefined, onSubmit: submit, onKeyDown: onKey, children: [_jsxs("div", { className: "cap-field", children: [_jsx("label", { className: "cap-switch-reason-label", htmlFor: reasonId, children: reasonLabel(verb) }), _jsx("input", { ref: reasonRef, className: "cap-input", id: reasonId, autoComplete: "off", required: true, readOnly: pending, placeholder: placeholder, value: reason, onChange: (e) => setReason(e.target.value), "aria-invalid": error ? true : undefined, "aria-describedby": error ? `${errorId} ${keysId}` : keysId }), _jsx("p", { className: "cap-field-error", id: errorId, role: error ? "alert" : undefined, hidden: !error, children: error })] }), _jsxs("div", { className: "cap-switch-reason-actions", children: [_jsx(Button, { type: "submit", variant: "primary", pending: pending, children: "Apply" }), _jsx(Button, { onClick: () => (pending ? undefined : onCancel()), children: "Cancel" })] }), _jsxs("span", { className: "cap-switch-reason-keys", id: keysId, children: [_jsx("kbd", { children: "Enter" }), " applies, ", _jsx("kbd", { children: "Esc" }), " cancels. The reason is recorded with the change."] })] }));
}
export function SwitchWithReason({ label, name, verb, checked, onApply, placeholder, note, id }) {
    const noun = name ?? label;
    const [on, setOn] = useState(checked);
    const [asking, setAsking] = useState(false);
    // The state the flip asks for, fixed when the reason opens, so a poll that lands meanwhile
    // and moves the switch cannot turn "off" into "on".
    const [target, setTarget] = useState(false);
    const [pending, setPending] = useState(false);
    const switchRef = useRef(null);
    const formRef = useRef(null);
    const next = asking ? target : !on;
    useEffect(() => setOn(checked), [checked]);
    const ask = () => {
        if (asking) {
            formRef.current?.querySelector(".cap-input")?.focus();
            return;
        }
        setTarget(!on);
        setAsking(true);
    };
    const close = () => {
        setAsking(false);
        switchRef.current?.focus();
    };
    return (_jsxs("div", { className: "cap-switch-reason", ref: formRef, children: [_jsxs("label", { className: "cap-switch", children: [_jsx("input", { ref: switchRef, id: id, type: "checkbox", role: "switch", "aria-busy": pending || undefined, checked: on, onChange: ask }), " ", label, " ", _jsx("span", { className: "cap-switch-state", "aria-hidden": "true", children: stateWord(on) })] }), !asking && note ? _jsx("span", { className: "cap-switch-reason-note", children: note }) : null, _jsx(ReasonForm, { open: asking, id: id ? `${id}-why` : undefined, verb: verb ? verb(next) : verbFor(noun, next), placeholder: placeholder, onPendingChange: setPending, failed: (err) => failedMessage(noun, target, err), onApply: async (reason) => {
                    await onApply(target, reason);
                    setOn(target);
                    close();
                }, onCancel: close })] }));
}
