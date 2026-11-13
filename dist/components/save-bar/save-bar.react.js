import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Button } from "../button/button.react.js";
import { Status } from "../status/status.react.js";
// The foot of a settings form: the result, then the Save button, at the end of the form. The
// status region is on the page from the start, so the result is announced when it arrives.
export function SaveBar({ pending = false, saved = false, error, submit = "Save changes", button = true, }) {
    return (_jsxs("div", { className: "cap-save-bar", children: [_jsxs("p", { role: "status", className: "cap-save-bar-status", children: [saved && !error ? _jsx(Status, { tone: "ok", children: "Saved" }) : null, error ? _jsx(Status, { tone: "crit", children: error }) : null] }), button ? (_jsx(Button, { type: "submit", variant: "primary", pending: pending, children: submit })) : null] }));
}
