import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useId, useRef, useState } from "react";
import { Button } from "../button/button.react.js";
import { stateWord } from "../switch/switch.js";
import { MISSING, failedMessage, reasonLabel, verbFor } from "./switch-reason.js";
export function SwitchWithReason({ label, name, verb, checked, onApply, placeholder, note }) {
    const base = useId();
    const reasonId = `${base}-why`;
    const errorId = `${base}-err`;
    const keysId = `${base}-keys`;
    const noun = name ?? label;
    const [on, setOn] = useState(checked);
    const [asking, setAsking] = useState(false);
    // The state the flip asks for, fixed when the reason opens, so a poll that lands meanwhile
    // and moves the switch cannot turn "off" into "on".
    const [target, setTarget] = useState(false);
    const [reason, setReason] = useState("");
    const [error, setError] = useState(null);
    const [pending, setPending] = useState(false);
    const switchRef = useRef(null);
    const reasonRef = useRef(null);
    const alive = useRef(true);
    const next = asking ? target : !on;
    useEffect(() => setOn(checked), [checked]);
    useEffect(() => {
        alive.current = true;
        return () => {
            alive.current = false;
        };
    }, []);
    useEffect(() => {
        if (asking)
            reasonRef.current?.focus();
    }, [asking]);
    const ask = () => {
        if (asking) {
            reasonRef.current?.focus();
            return;
        }
        setTarget(!on);
        setReason("");
        setError(null);
        setAsking(true);
    };
    const close = () => {
        setAsking(false);
        setReason("");
        setError(null);
        switchRef.current?.focus();
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
            await onApply(target, text);
            if (!alive.current)
                return;
            setPending(false);
            setOn(target);
            close();
        }
        catch (err) {
            if (!alive.current)
                return;
            setPending(false);
            setError(failedMessage(noun, target, err));
            reasonRef.current?.focus();
        }
    };
    // Held while the request runs, so its answer is not hidden. Stopped here either way, so an
    // Esc that cancels the reason does not also close a panel the switch sits in.
    const onKey = (e) => {
        if (e.key !== "Escape")
            return;
        e.preventDefault();
        e.stopPropagation();
        if (!pending)
            close();
    };
    return (_jsxs("div", { className: "cap-switch-reason", children: [_jsxs("label", { className: "cap-switch", children: [_jsx("input", { ref: switchRef, type: "checkbox", role: "switch", "aria-busy": pending || undefined, checked: on, onChange: ask }), " ", label, " ", _jsx("span", { className: "cap-switch-state", "aria-hidden": "true", children: stateWord(on) })] }), !asking && note ? _jsx("span", { className: "cap-switch-reason-note", children: note }) : null, _jsxs("form", { className: "cap-switch-reason-form", hidden: !asking, noValidate: true, "aria-busy": pending || undefined, onSubmit: submit, onKeyDown: onKey, children: [_jsxs("div", { className: "cap-field", children: [_jsx("label", { className: "cap-switch-reason-label", htmlFor: reasonId, children: reasonLabel(verb ? verb(next) : verbFor(noun, next)) }), _jsx("input", { ref: reasonRef, className: "cap-input", id: reasonId, autoComplete: "off", required: true, readOnly: pending, placeholder: placeholder, value: reason, onChange: (e) => setReason(e.target.value), "aria-invalid": error ? true : undefined, "aria-describedby": error ? `${errorId} ${keysId}` : keysId }), _jsx("p", { className: "cap-field-error", id: errorId, role: error ? "alert" : undefined, hidden: !error, children: error })] }), _jsxs("div", { className: "cap-switch-reason-actions", children: [_jsx(Button, { type: "submit", variant: "primary", pending: pending, children: "Apply" }), _jsx(Button, { onClick: () => (pending ? undefined : close()), children: "Cancel" })] }), _jsxs("span", { className: "cap-switch-reason-keys", id: keysId, children: [_jsx("kbd", { children: "Enter" }), " applies, ", _jsx("kbd", { children: "Esc" }), " cancels. The reason is recorded with the change."] })] })] }));
}
