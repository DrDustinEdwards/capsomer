import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useId } from "react";
// The HTML contract in danger-zone.md.
export function DangerZone({ title = "Danger", note, children }) {
    const id = useId();
    return (_jsxs("div", { className: "cap-danger", role: "group", "aria-labelledby": id, children: [_jsx("p", { className: "cap-danger-title", id: id, children: title }), _jsxs("div", { className: "cap-danger-actions", children: [children, note ? _jsx("span", { className: "cap-danger-note", children: note }) : null] })] }));
}
