import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Button } from "../button/button.react.js";
import { Status } from "../status/status.react.js";
// The foot of a settings form: the result, any other action, then the Save button, at the end of
// the form. The status region is on the page from the start, so the result is announced when it
// arrives. "Saved" clearing itself is the host's, with useShownFor (capsomer/react/hooks).
export function SaveBar({ pending = false, saved = false, error, submit = "Save changes", button = true, children, disabledReason, sticky = false, form, name, value, className, }) {
    const failed = error != null && error !== false;
    const ok = !failed && saved != null && saved !== false;
    // With no button, a save in flight is said in words, in place of the last result.
    const saying = !button && pending;
    return (_jsxs("div", { className: className ? `cap-save-bar ${className}` : "cap-save-bar", "data-sticky": sticky ? "" : undefined, children: [_jsxs("p", { role: "status", className: "cap-save-bar-status", children: [saying ? "Saving…" : null, ok && !saying ? _jsx(Status, { tone: "ok", children: saved === true ? "Saved" : saved }) : null, failed && !saying ? _jsx(Status, { tone: "crit", children: error }) : null] }), children, button ? (_jsx(Button, { type: "submit", variant: "primary", pending: pending, disabledReason: disabledReason, form: form, name: name, value: value, children: submit })) : null] }));
}
