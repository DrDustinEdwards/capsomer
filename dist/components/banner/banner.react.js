import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Glyph } from "../status/status.react.js";
// The glyph is a shape per tone, so the tone is never color alone. Neutral takes the
// notice square in the muted ink.
const glyphFor = { neutral: "info", info: "info", ok: "ok", warn: "warn", crit: "crit" };
// A critical banner interrupts (role="alert"); every other one is polite (role="status").
export function Banner({ tone = "warn", title, children, actions, onDismiss }) {
    return (_jsxs("div", { className: "cap-banner", "data-tone": tone, role: tone === "crit" ? "alert" : "status", children: [_jsx(Glyph, { name: glyphFor[tone] }), title ? (_jsxs("div", { className: "cap-banner-body", children: [_jsx("p", { className: "cap-banner-title", children: title }), _jsx("p", { className: "cap-banner-text", children: children })] })) : (_jsx("p", { className: "cap-banner-text", children: children })), actions || onDismiss ? (_jsxs("div", { className: "cap-banner-actions", children: [actions, onDismiss ? (_jsx("button", { type: "button", className: "cap-btn", "data-variant": "quiet", onClick: onDismiss, children: "Dismiss" })) : null] })) : null] }));
}
// An alert interrupts (role="alert"): it is added when the failure happens.
export function Alert({ tone = "crit", title, children, action, id }) {
    return (_jsxs("div", { className: "cap-alert", "data-tone": tone, role: "alert", id: id, children: [_jsx(Glyph, { name: glyphFor[tone] }), title ? (_jsxs("div", { className: "cap-alert-body", children: [_jsx("p", { className: "cap-alert-title", children: title }), _jsx("p", { className: "cap-alert-text", children: children })] })) : (_jsx("span", { className: "cap-alert-text", children: children })), action ? _jsx("div", { className: "cap-alert-action", children: action }) : null] }));
}
