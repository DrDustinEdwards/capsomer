import { jsxs as _jsxs } from "react/jsx-runtime";
import { Link } from "../link/link.react.js";
const list = (ways) => Array.isArray(ways) ? ways : ways ? [ways] : [];
// The manual's signs (`nav.cap-signs` of `a.cap-sign`, manual.md): a sign shows only the title,
// and its kind is read, not shown, since the arrow says it. Renders nothing with no way on.
export function Signs({ label, prev, next, className }) {
    const back = list(prev);
    const on = list(next);
    if (back.length === 0 && on.length === 0)
        return null;
    const sign = (target, rel) => (_jsxs(Link, { className: "cap-sign", rel: rel, to: target.href, children: [_jsxs("span", { className: "cap-sr-only", children: [target.label, ": "] }), target.title] }, `${rel}:${target.href}`));
    return (_jsxs("nav", { className: className ? `cap-signs ${className}` : "cap-signs", "aria-label": label, children: [back.map((t) => sign(t, "prev")), on.map((t) => sign(t, "next"))] }));
}
