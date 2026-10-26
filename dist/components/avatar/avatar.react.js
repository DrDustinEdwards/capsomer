import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { initials } from "./avatar.js";
export function Avatar({ name, src, fallback, size = "default", shape = "circle", kind = "person", badge, badgeLabel, badgeTone }) {
    const [failed, setFailed] = useState(false);
    return (_jsxs("span", { className: "cap-avatar", role: "img", "aria-label": badge != null && badgeLabel ? `${name}, ${badgeLabel}` : name, "data-size": size === "default" ? undefined : size, "data-shape": shape === "square" ? "square" : undefined, "data-kind": kind === "ai" ? "ai" : undefined, "data-state": failed ? "error" : undefined, children: [_jsx("span", { className: "cap-avatar-fallback", "aria-hidden": "true", children: fallback ?? initials(name) }), src && !failed ? _jsx("img", { className: "cap-avatar-image", src: src, alt: "", onError: () => setFailed(true) }) : null, badge != null ? (_jsx("span", { className: "cap-avatar-badge", "data-tone": badgeTone, "aria-hidden": "true", children: badge })) : null] }));
}
export function AvatarGroup({ label, children, extra }) {
    return (_jsxs("span", { className: "cap-avatar-group", role: "group", "aria-label": label, children: [children, extra ? (_jsxs("span", { className: "cap-avatar-count", role: "img", "aria-label": `and ${extra} more`, children: ["+", extra] })) : null] }));
}
