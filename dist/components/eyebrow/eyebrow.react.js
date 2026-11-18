import { jsx as _jsx } from "react/jsx-runtime";
// The HTML contract in eyebrow.md. A label that carries a fact ("Sample data", "Account"), never a
// kicker over a heading that only restates it (DEFAULTS.md, let the layout explain).
export function Eyebrow({ children, variant, tone, as: Tag = "p", id, className }) {
    return (_jsx(Tag, { className: className ? `cap-eyebrow ${className}` : "cap-eyebrow", "data-variant": variant, "data-tone": tone === "muted" ? undefined : tone, id: id, children: children }));
}
