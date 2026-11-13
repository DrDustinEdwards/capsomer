import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useRef } from "react";
import { Glyph } from "../status/status.react.js";
// Reads the usual shapes of a route action's answer: `{ ok: "Saved." }`, `{ error: "..." }`,
// `{ ok: true, message }` or `{ ok: false, error | message }`. Anything else is no status.
export function actionStatus(data) {
    if (!data || typeof data !== "object")
        return null;
    const d = data;
    const words = (v) => (typeof v === "string" && v ? v : null);
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
export function FormStatus({ status, focus = true, className }) {
    const ref = useRef(null);
    useEffect(() => {
        if (status && focus)
            ref.current?.focus();
    }, [status, focus]);
    const cls = status ? "cap-alert cap-form-status" : "cap-sr-only cap-form-status";
    return (_jsx("p", { ref: ref, tabIndex: -1, role: status && !status.ok ? "alert" : "status", className: className ? `${cls} ${className}` : cls, "data-tone": status ? (status.ok ? "ok" : "crit") : undefined, children: status ? (_jsxs(_Fragment, { children: [_jsx(Glyph, { name: status.ok ? "ok" : "crit" }), _jsx("span", { className: "cap-alert-body", children: status.message })] })) : null }));
}
// The status of the action's answer, read with `actionStatus`, kept stable while the answer is
// the same object so focus moves once per post: `<FormStatus status={useActionStatus(actionData)} />`.
export function useActionStatus(data) {
    return useMemo(() => actionStatus(data), [data]);
}
