import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// A phone number as a `tel:` address: the digits and a leading +, with a country code when the number has none
// (`country`, "1" for the US). RFC 3966: visual separators may stay, so dashes are kept.
export function telHref(number, country = "1") {
    const trimmed = number.trim();
    if (trimmed.startsWith("+"))
        return `tel:${trimmed.replace(/[^\d+-]/g, "")}`;
    return `tel:+${country}-${trimmed.replace(/[^\d-]/g, "")}`;
}
// The HTML contract in contact-card.md.
export function ContactCard({ title, headingLevel: H = "h3", text, ways, lines, address, mapHref, country, children, }) {
    const addressLines = address?.map((line, i) => _jsx("span", { children: line }, i));
    return (_jsxs("div", { className: "cap-contact-card", children: [_jsx(H, { className: "cap-contact-card-title", children: title }), text ? _jsx("p", { className: "cap-contact-text", children: text }) : null, ways?.length ? (_jsx("ul", { className: "cap-contact-ways", children: ways.map((w) => (_jsx("li", { children: _jsxs("a", { className: "cap-contact-way", href: w.href, children: [w.icon ? _jsx("span", { "aria-hidden": "true", children: w.icon }) : null, w.label] }) }, w.href))) })) : null, lines?.length ? (_jsx("dl", { className: "cap-contact-lines", children: lines.map((line, i) => (_jsxs("div", { children: [_jsx("dt", { children: line.label }), _jsx("dd", { children: line.numbers.map((n) => (_jsx("a", { href: telHref(n, country), children: n }, n))) })] }, i))) })) : null, addressLines ? (mapHref ? (_jsx("a", { className: "cap-contact-address", href: mapHref, children: addressLines })) : (_jsx("address", { className: "cap-contact-address", children: addressLines }))) : null, children] }));
}
export function ContactGrid({ children, plain }) {
    return (_jsx("div", { className: "cap-contact-grid", "data-variant": plain ? "plain" : undefined, children: children }));
}
