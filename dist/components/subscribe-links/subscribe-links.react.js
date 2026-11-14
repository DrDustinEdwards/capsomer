import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useId } from "react";
import { AwayLink } from "../link/link.react.js";
// The HTML contract in subscribe-links.md. Nothing renders without a link.
export function SubscribeLinks({ title = "Listen and subscribe", headingId, level: H = "h2", links, more, renderLink, }) {
    const ownId = useId();
    const id = headingId ?? ownId;
    if (!links.length)
        return null;
    return (_jsxs("section", { className: "cap-subscribe", "aria-labelledby": id, children: [_jsx(H, { className: "cap-subscribe-title", id: id, children: title }), _jsxs("ul", { className: "cap-subscribe-list", children: [links.map((l) => (_jsx("li", { children: l.away ? (_jsxs(AwayLink, { className: "cap-chip cap-subscribe-link", "data-size": "sm", href: l.href, children: [l.icon, l.label] })) : (_jsxs("a", { className: "cap-chip cap-subscribe-link", "data-size": "sm", href: l.href, children: [l.icon, l.label] })) }, l.href))), more ? (_jsx("li", { children: renderLink ? (renderLink({ href: more.href, className: "cap-subscribe-more", children: more.label })) : (_jsx("a", { className: "cap-subscribe-more", href: more.href, children: more.label })) })) : null] })] }));
}
