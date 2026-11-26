import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
// The confirmation as a page: ConfirmPage is the form a server answers a destructive request with, ConfirmModal the
// same page in a dialog (confirm-dialog.react.tsx has the modal ConfirmDialog).
import { useCleanId } from "../hooks/hooks.react.js";
import { useEffect, useRef, useState } from "react";
import { wordPattern } from "./confirm-dialog.js";
import { CONFIRM_FIELD, REASON_FIELD } from "./confirm-server.js";
export const MEDIA_GLYPH = (_jsx("path", { fill: "currentColor", fillRule: "evenodd", d: "M8 1.5l7 12.5H1zM7.2 6v4h1.6V6zM7.2 10.8v1.4h1.6v-1.4z" }));
// The confirmation as a form in the page, for a server that answers a destructive request with its own page; works with no script.
export function ConfirmPage({ action, method = "post", hidden, title, lead, body = [], action_label = "Confirm", cancelHref, cancelLabel = "Cancel", typeToConfirm, reason, error, media = true, headingLevel = "h1", children, onCancel, renderForm, }) {
    const id = useCleanId();
    const Heading = headingLevel;
    const described = [lead ? `${id}-desc` : null, body.length ? `${id}-list` : null].filter(Boolean).join(" ") ||
        undefined;
    const hasBody = body.length > 0 || !!reason || !!typeToConfirm;
    const parts = (_jsxs(_Fragment, { children: [Object.entries(hidden ?? {}).flatMap(([k, v]) => (typeof v === "string" ? [v] : v).map((one, i) => (_jsx("input", { type: "hidden", name: k, value: one }, `${k}-${i}`)))), _jsxs("div", { className: "cap-dialog-header", children: [media ? (_jsx("div", { className: "cap-dialog-media", "data-tone": "crit", "aria-hidden": "true", children: _jsx("svg", { viewBox: "0 0 16 16", width: "16", height: "16", "aria-hidden": "true", focusable: "false", children: MEDIA_GLYPH }) })) : null, _jsx(Heading, { className: "cap-dialog-title", id: `${id}-title`, children: title }), lead == null ? null : typeof lead === "string" ? (_jsx("p", { className: "cap-dialog-description", id: `${id}-desc`, children: lead })) : (_jsx("div", { className: "cap-dialog-description", id: `${id}-desc`, children: lead }))] }), children, hasBody ? (_jsxs("div", { className: "cap-dialog-body", children: [body.length ? (_jsx("ul", { id: `${id}-list`, children: body.map((line) => (_jsx("li", { children: line }, line))) })) : null, reason ? (_jsxs("div", { className: "cap-confirm-reason", children: [_jsx("label", { htmlFor: `${id}-reason`, children: reason.label ?? "Reason (required)" }), _jsx("textarea", { className: "cap-input", id: `${id}-reason`, name: REASON_FIELD, rows: 3, required: true, "aria-describedby": `${id}-reason-note` }), _jsx("p", { className: "cap-confirm-note", id: `${id}-reason-note`, children: reason.note ?? "Recorded with the change." })] })) : null, typeToConfirm ? (_jsxs("div", { className: "cap-confirm-typed", children: [_jsxs("label", { htmlFor: `${id}-typed`, children: ["Type ", _jsx("b", { children: typeToConfirm }), " to confirm"] }), _jsx("input", { className: "cap-input", id: `${id}-typed`, name: CONFIRM_FIELD, required: true, pattern: wordPattern(typeToConfirm), title: `Type ${typeToConfirm}`, autoComplete: "off", spellCheck: false })] })) : null] })) : null, _jsx("div", { className: "cap-confirm-error", role: "alert", children: error ? (_jsxs(_Fragment, { children: [_jsx("b", { className: "cap-confirm-error-lead", children: "Not done. Nothing was changed." }), " ", error] })) : null }), _jsxs("div", { className: "cap-dialog-footer", "data-align": "between", children: [_jsx("a", { className: "cap-btn", href: cancelHref, onClick: onCancel
                            ? (e) => {
                                e.preventDefault();
                                onCancel();
                            }
                            : undefined, children: cancelLabel }), _jsx("button", { type: "submit", className: "cap-btn", "data-variant": "danger", children: action_label })] })] }));
    const formProps = {
        className: "cap-confirm-page",
        "data-cap": "confirm-page",
        action,
        method,
        "aria-labelledby": `${id}-title`,
        "aria-describedby": described,
        children: parts,
    };
    return renderForm ? renderForm(formProps) : _jsx("form", { ...formProps });
}
// The confirm page as a modal over the page it came from. It is in the page until script runs (data-inline),
// so a reader with no script still gets the second step. Focus returns to the opener, else its closed menu button, else main.
export function ConfirmModal(props) {
    const ref = useRef(null);
    const [ready, setReady] = useState(false);
    const cancel = () => (props.onCancel ? props.onCancel() : location.assign(props.cancelHref));
    useEffect(() => {
        // oxlint-disable-next-line react/set-state-in-effect -- ready marks the dialog as opened by script, after showModal() below
        setReady(true);
        // Read before showModal() moves focus: the control that opened it, or nothing on a page load.
        const active = document.activeElement;
        const origin = active instanceof HTMLElement && active !== document.body ? active : null;
        const d = ref.current;
        if (d && !d.open)
            d.showModal();
        d?.querySelector(".cap-confirm-typed input, .cap-confirm-reason textarea, .cap-dialog-footer .cap-btn")?.focus();
        return () => {
            // Deferred, so the page Cancel returns to has rendered.
            window.setTimeout(() => {
                if (document.activeElement && document.activeElement !== document.body)
                    return;
                const panel = origin?.closest("[popover]");
                const candidates = [
                    origin,
                    panel?.id
                        ? document.querySelector(`[popovertarget="${CSS.escape(panel.id)}"]`)
                        : null,
                    document.querySelector("main"),
                ];
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
