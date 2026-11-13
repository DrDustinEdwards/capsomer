import { jsx as _jsx } from "react/jsx-runtime";
// The HTML contract in eyebrow.md.
export function Eyebrow({ children, variant, tone, as: Tag = "p", id }) {
    return (_jsx(Tag, { className: "cap-eyebrow", "data-variant": variant, "data-tone": tone === "muted" ? undefined : tone, id: id, children: children }));
}
