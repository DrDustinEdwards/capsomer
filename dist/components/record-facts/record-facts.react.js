import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { linkable } from "../hooks/hooks.js";
const present = (f) => f.value !== null && f.value !== undefined && f.value !== "";
export function RecordFacts({ facts }) {
    const shown = facts.filter(present);
    if (shown.length === 0)
        return null;
    return (_jsx("dl", { className: "cap-record-facts", children: shown.map((f) => (_jsxs("div", { className: "cap-record-facts-item", children: [_jsx("dt", { children: f.label }), _jsx("dd", { "data-mono": f.mono ? "" : undefined, children: linkable(f.href) ? _jsx("a", { href: f.href, children: f.value }) : f.value })] }, f.label))) }));
}
