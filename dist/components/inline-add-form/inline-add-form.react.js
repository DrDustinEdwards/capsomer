import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Button } from "../button/button.react.js";
import { PlainForm } from "../plain-form/plain-form.react.js";
// One line that starts a new thing by name: its fields and one button, posting a form, so it
// works with no script.
export function InlineAddForm({ children, submit, hidden, action, Form = PlainForm, pending = false, label, }) {
    return (_jsxs(Form, { method: "post", action: action, className: "cap-inline-add", "aria-label": label, children: [Object.entries(hidden ?? {}).map(([name, value]) => (_jsx("input", { type: "hidden", name: name, value: value }, name))), children, _jsx(Button, { type: "submit", pending: pending, children: submit })] }));
}
