import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useId } from "react";
// The HTML contract in newsletter-signup.md.
export function NewsletterSignup({ action, title = "Newsletter", text, consent, state, done = "Almost done: check your inbox for a link to confirm your subscription.", button = "Subscribe", placeholder = "you@example.com", plain, headingLevel: H = "h2", renderForm, }) {
    const id = useId();
    const titleId = `${id}-title`;
    const errorId = `${id}-error`;
    const failed = state && !state.ok ? state.error : undefined;
    const fields = (_jsxs(_Fragment, { children: [_jsxs("div", { className: "cap-newsletter-row", children: [_jsx("label", { className: "cap-sr-only", htmlFor: `${id}-email`, children: "Email address" }), _jsx("input", { id: `${id}-email`, className: "cap-input", type: "email", name: "email", required: true, autoComplete: "email", inputMode: "email", spellCheck: false, placeholder: placeholder, "aria-invalid": failed ? "true" : undefined, "aria-describedby": failed ? errorId : undefined }), _jsx("button", { type: "submit", className: "cap-btn", "data-variant": "primary", children: button })] }), consent ? (_jsxs("label", { className: "cap-check cap-newsletter-consent", children: [_jsx("input", { type: "checkbox", name: "consent", required: true }), _jsx("span", { children: consent })] })) : null] }));
    const formProps = {
        className: "cap-newsletter-form",
        method: "post",
        action,
        "aria-labelledby": titleId,
    };
    return (_jsxs("section", { className: "cap-newsletter", "data-variant": plain ? "plain" : undefined, "aria-labelledby": titleId, children: [_jsx(H, { className: "cap-newsletter-title", id: titleId, children: title }), text ? _jsx("p", { className: "cap-newsletter-text", children: text }) : null, state?.ok ? (_jsx("p", { className: "cap-newsletter-done", role: "status", children: done })) : renderForm ? (renderForm({ ...formProps, children: fields })) : (_jsx("form", { ...formProps, children: fields })), failed ? (_jsx("p", { className: "cap-newsletter-error", id: errorId, role: "alert", children: failed })) : null] }));
}
