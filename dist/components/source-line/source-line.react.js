import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// A figure's source, under it: "Source: stripe.com, read October 2026 ↗". Every statistic names
// where it came from and when it was read, as a link to that page.
// The name a source line shows for an address: its host, without "www.".
export function citation(href) {
    try {
        return new URL(href).hostname.replace(/^www\./, "");
    }
    catch {
        return href;
    }
}
export function SourceLine({ href, read, name }) {
    return (_jsx("p", { className: "cap-source-line", children: _jsxs("a", { href: href, rel: "noopener noreferrer", children: ["Source: ", name ?? citation(href), ", read ", read, _jsx("svg", { viewBox: "0 0 12 12", "aria-hidden": "true", focusable: "false", children: _jsx("path", { d: "M3.5 8.5l5-5M4.5 3.5h4v4" }) }), _jsx("span", { className: "cap-sr-only", children: " (opens the source)" })] }) }));
}
