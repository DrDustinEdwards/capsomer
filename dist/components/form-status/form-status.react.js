import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useRef } from "react";
import { Glyph } from "../status/status.react.js";
// Reads the usual shapes of a route action's answer: `{ ok: "Saved." }`, `{ error: "..." }`,
// `{ ok: true, message }` or `{ ok: false, error | message }`. Anything else is no status.
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
// Two regions, always in the page: an alert for a failure and a status for a success. A live
// node never changes its role, which some screen readers miss; the one with nothing to say is
// empty and visually hidden.
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
// The status of the action's answer, read with `actionStatus`, kept stable while the answer is
// the same object so focus moves once per post: `<FormStatus status={useActionStatus(actionData)} />`.
export function useActionStatus(data) {
    return useMemo(() => actionStatus(data), [data]);
}
