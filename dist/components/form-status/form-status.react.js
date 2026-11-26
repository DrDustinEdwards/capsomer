import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useRef } from "react";
import { Glyph } from "../status/status.react.js";
// Reads a route action's usual answers (`{ ok }`, `{ error }`, `{ ok, message }`, `{ ok: false, error | message }`); anything else is no status.
export function actionStatus(data) {
    if (!data || typeof data !== "object")
        return null;
    const d = data;
    const words = (v) => (typeof v === "string" && v.trim() !== "" ? v : null);
    if (words(d.error))
        return { ok: false, message: d.error };
    if (d.ok === false)
        return { ok: false, message: words(d.message) ?? "Something went wrong." };
    if (words(d.ok))
        return { ok: true, message: d.ok };
    if (d.ok === true && words(d.message))
        return { ok: true, message: d.message };
    return null;
}
// Two regions always in the page, an alert and a status: a live node never changes its role, which some screen readers miss.
export function FormStatus({ status, focus = true, className }) {
    const failRef = useRef(null);
    const okRef = useRef(null);
    useEffect(() => {
        if (!status || focus === false || (focus === "errors" && status.ok))
            return;
        (status.ok ? okRef : failRef).current?.focus();
    }, [status, focus]);
    const region = (ok) => {
        const shown = status !== null && status.ok === ok;
        const cls = shown ? "cap-alert cap-form-status" : "cap-sr-only cap-form-status";
        return (_jsx("p", { ref: ok ? okRef : failRef, tabIndex: -1, role: ok ? "status" : "alert", className: className ? `${cls} ${className}` : cls, "data-tone": shown ? (ok ? "ok" : "crit") : undefined, children: shown ? (_jsxs(_Fragment, { children: [_jsx(Glyph, { name: ok ? "ok" : "crit" }), _jsx("span", { className: "cap-alert-body", children: status.message })] })) : null }));
    };
    return (_jsxs(_Fragment, { children: [region(false), region(true)] }));
}
// The status of the action's answer, kept stable while the answer is the same object so focus moves once per post.
export function useActionStatus(data) {
    return useMemo(() => actionStatus(data), [data]);
}
