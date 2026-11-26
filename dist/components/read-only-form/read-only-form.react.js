import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, } from "react";
import { Banner } from "../banner/banner.react.js";
import { PlainForm } from "../plain-form/plain-form.react.js";
// A form a read-only visitor (a demo, a viewer) can press but not send: the reason shows in place under
// the form. Not the security boundary: the server refuses the write too.
export function ReadOnlyForm({ readOnly, message, form: Form = PlainForm, onSubmit, className, children, ref, ...rest }) {
    const [refused, setRefused] = useState(false);
    return (_jsxs(Form, { ...rest, ref: ref, className: className ? `cap-read-only-form ${className}` : "cap-read-only-form", onSubmit: (event) => {
            if (readOnly) {
                event.preventDefault();
                setRefused(true);
                return;
            }
            onSubmit?.(event);
        }, children: [children, refused ? _jsx(Banner, { tone: "neutral", children: message }) : null] }));
}
