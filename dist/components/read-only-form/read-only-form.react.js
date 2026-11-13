import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { Banner } from "../banner/banner.react.js";
// A form that a read-only visitor (a demo, a viewer without the right) can press but not send:
// the submit stays in the browser and the reason shows under the form, in place, where an
// error page would have thrown them out. Not the security boundary: the server refuses the
// write too, for a post without script or by hand.
export function ReadOnlyForm({ readOnly, message, form = "form", onSubmit, className, children, ref, ...rest }) {
    const [refused, setRefused] = useState(false);
    const Form = form;
    return (_jsxs(Form, { ...rest, ...{ ref }, className: className ? `cap-read-only-form ${className}` : "cap-read-only-form", onSubmit: (event) => {
            if (readOnly) {
                event.preventDefault();
                setRefused(true);
                return;
            }
            onSubmit?.(event);
        }, children: [children, refused ? _jsx(Banner, { tone: "neutral", children: message }) : null] }));
}
