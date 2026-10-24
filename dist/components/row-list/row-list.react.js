import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useId, useRef } from "react";
import { attachRowList } from "./row-list.js";
export function RowList({ labelledBy, label, primary = false, gap, children }) {
    const ref = useRef(null);
    useEffect(() => (ref.current ? attachRowList(ref.current) : undefined), []);
    return (_jsx("ul", { ref: ref, className: "cap-rows", "data-cap": "row-list", role: "list", "aria-labelledby": labelledBy, "aria-label": labelledBy ? undefined : label, "data-cap-primary": primary ? "" : undefined, "data-gap": gap === undefined ? undefined : gap === "default" ? "" : gap, children: children }));
}
const plainLink = ({ children, ...props }) => _jsx("a", { ...props, children: children });
export function Row({ title, href, onOpen, status, detail, meta, actions, tone, variant, size, media, mediaVariant, expanded, controls, className, renderLink = plainLink }) {
    const id = useId();
    // The link's name is the title; the status and the detail are its description, so a
    // screen reader moving by link still hears "Critical" and why.
    const described = [status != null ? `${id}-status` : "", detail != null ? `${id}-detail` : ""].filter(Boolean).join(" ") || undefined;
    return (_jsxs("li", { className: className ? `cap-row ${className}` : "cap-row", "data-tone": tone, "data-variant": variant, "data-size": size, children: [media != null && (_jsx("span", { className: "cap-row-media", "data-variant": mediaVariant, children: media })), status != null && (_jsx("span", { className: "cap-row-status", id: `${id}-status`, children: status })), _jsx("div", { className: "cap-row-title", children: href != null ? (renderLink({ href, "aria-describedby": described, children: title })) : (_jsx("button", { type: "button", "aria-describedby": described, "aria-expanded": expanded, "aria-controls": expanded === undefined ? undefined : controls, onClick: onOpen, children: title })) }), detail != null && (_jsx("p", { className: "cap-row-detail", id: `${id}-detail`, children: detail })), (meta != null || expanded !== undefined) && (_jsxs("span", { className: "cap-row-meta", children: [meta, expanded !== undefined ? _jsx("span", { className: "cap-row-chevron", "aria-hidden": "true" }) : null] })), actions != null && _jsx("div", { className: "cap-row-actions", children: actions })] }));
}
