import { jsx as _jsx } from "react/jsx-runtime";
// The HTML contract in eyebrow.md.
export function Eyebrow({ children, variant, tone, as: Tag = "p", id, className }) {
    return (_jsx(Tag, { className: className ? `cap-eyebrow ${className}` : "cap-eyebrow", "data-variant": variant, "data-tone": tone === "muted" ? undefined : tone, id: id, children: children }));
}
