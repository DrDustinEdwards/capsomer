import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useId, useRef } from "react";
// A secret shown once (an API key, a recovery code): the secret in a block that takes focus when it appears, so a
// keyboard or screen reader lands on what has to be kept, with a warning and the app's copy button. Nothing here stores it.
export function SecretReveal({ title, secret, note = "Shown once. Copy it now.", copy, headingLevel: H = "h2", focusOnShow = true, }) {
    const heading = useId();
    const noteId = useId();
    const block = useRef(null);
    useEffect(() => {
        if (focusOnShow)
            block.current?.focus();
    }, [focusOnShow]);
    return (_jsxs("section", { className: "cap-secret", "aria-labelledby": heading, children: [_jsx(H, { className: "cap-secret-title", id: heading, children: title }), _jsx("pre", { className: "cap-secret-value", ref: block, tabIndex: -1, "aria-labelledby": heading, "aria-describedby": noteId, children: secret }), _jsxs("div", { className: "cap-secret-foot", children: [_jsx("p", { className: "cap-secret-note", id: noteId, children: note }), copy] })] }));
}
