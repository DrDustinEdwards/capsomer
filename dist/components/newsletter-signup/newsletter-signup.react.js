import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { useId, useMemo } from "react";
import { Button } from "../button/button.react.js";
import { Check, TextField } from "../field/field.react.js";
import { FormStatus } from "../form-status/form-status.react.js";
// The HTML contract in newsletter-signup.md: the field's TextField with its button as the row's
// action and the error as the field's, the consent a Check, and the answer said by FormStatus,
// whose region is in the page from the start and takes focus when the form is replaced by it.
export function NewsletterSignup({ action, title = "Newsletter", text, consent, state, done = "Almost done: check your inbox for a link to confirm your subscription.", button = "Subscribe", placeholder = "you@example.com", plain, headingLevel: H = "h2", renderForm, }) {
    const titleId = `${useId()}-title`;
    const failed = state && !state.ok ? state.error : undefined;
    const sent = useMemo(() => (state?.ok ? { ok: true, message: done } : null), [state, done]);
    const fields = (_jsxs(_Fragment, { children: [_jsx(TextField, { label: "Email address", labelHidden: true, showRequired: false, type: "email", name: "email", required: true, autoComplete: "email", inputMode: "email", spellCheck: false, placeholder: placeholder, error: failed, announce: true, action: _jsx(Button, { type: "submit", variant: "primary", children: button }) }), consent ? (_jsx(Check, { className: "cap-newsletter-consent", name: "consent", required: true, label: _jsx("span", { children: consent }) })) : null] }));
    const formProps = {
        className: "cap-newsletter-form",
        method: "post",
        action,
        "aria-labelledby": titleId,
    };
    return (_jsxs("section", { className: "cap-newsletter", "data-variant": plain ? "plain" : undefined, "aria-labelledby": titleId, children: [_jsx(H, { className: "cap-newsletter-title", id: titleId, children: title }), text ? _jsx("p", { className: "cap-newsletter-text", children: text }) : null, _jsx(FormStatus, { status: sent }), sent ? null : renderForm ? (renderForm({ ...formProps, children: fields })) : (_jsx("form", { ...formProps, children: fields }))] }));
}
