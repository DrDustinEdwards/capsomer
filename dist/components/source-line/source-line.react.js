import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { AwayLink } from "../link/link.react.js";
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
    return (_jsx("p", { className: "cap-source-line", children: _jsxs(AwayLink, { href: href, children: ["Source: ", name ?? citation(href), ", read ", read] }) }));
}
