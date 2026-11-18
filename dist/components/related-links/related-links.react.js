import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useId } from "react";
import { isHttpUrl, isSameOriginPath } from "@dustinedwards/site-runtime/url";
import { Link } from "../link/link.react.js";
import { Time } from "../time/time.react.js";
const REL = { external: "noopener noreferrer", mentions: "nofollow ugc noopener noreferrer" };
// The HTML contract in related-links.md. Every string is a React child, never markup, since a
// mention's words are a stranger's. Renders nothing for an empty list.
export function RelatedLinks({ title, kind, items }) {
    const headingId = useId();
    if (items.length === 0)
        return null;
    const Box = kind === "internal" ? "nav" : "section";
    return (_jsxs(Box, { className: "cap-related", "data-kind": kind, "aria-labelledby": headingId, children: [_jsx("h2", { className: "cap-related-title", id: headingId, children: title }), _jsx("ul", { className: "cap-related-list", children: items.map((item, i) => {
                    // A stranger's address passes only as an absolute http(s) URL; a site path passes the
                    // same check a redirect's Location does, so "/\t/host" (a browser reads "//host") is refused.
                    const href = item.href ?? "";
                    const local = kind !== "mentions" && isSameOriginPath(href);
                    const linked = local || isHttpUrl(href);
                    return (_jsxs("li", { children: [!linked ? (_jsx("span", { className: "cap-related-name", children: item.title })) : local ? (_jsx(Link, { className: "cap-related-name", to: href, children: item.title })) : (_jsx("a", { className: "cap-related-name", href: href, rel: kind === "mentions" ? REL.mentions : REL.external, children: item.title })), kind === "mentions" && item.excerpt ? (_jsx("p", { className: "cap-related-excerpt", children: item.excerpt })) : null, kind === "mentions" && item.date ? (_jsx("span", { className: "cap-related-date", children: _jsx(Time, { at: item.date, format: "date" }) })) : null] }, `${i}:${item.href ?? item.title}`));
                }) })] }));
}
