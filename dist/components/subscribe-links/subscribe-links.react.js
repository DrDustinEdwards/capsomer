import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// The HTML contract in subscribe-links.md. Nothing renders without a link.
export function SubscribeLinks({ title = "Listen and subscribe", headingId = "subscribe", level: H = "h2", links, more, renderLink, }) {
    if (!links.length)
        return null;
    return (_jsxs("section", { className: "cap-subscribe", "aria-labelledby": headingId, children: [_jsx(H, { className: "cap-subscribe-title", id: headingId, children: title }), _jsxs("ul", { className: "cap-subscribe-list", children: [links.map((l) => (_jsx("li", { children: _jsxs("a", { className: "cap-chip cap-subscribe-link", "data-size": "sm", href: l.href, ...(l.away ? { rel: "external", "data-link": "away" } : {}), children: [l.icon, l.label] }) }, l.href))), more ? (_jsx("li", { children: renderLink ? (renderLink({ href: more.href, className: "cap-subscribe-more", children: more.label })) : (_jsx("a", { className: "cap-subscribe-more", href: more.href, children: more.label })) })) : null] })] }));
}
