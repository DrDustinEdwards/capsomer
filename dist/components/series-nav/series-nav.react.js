import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useId } from "react";
import { Link } from "../link/link.react.js";
import { Signs } from "../manual/manual.react.js";
import { seriesPlace } from "./series-nav.js";
// The HTML contract in series-nav.md: the series as a box, "Part 2 of 3: <series>", every part
// with this one marked and not a link, then the parts either side as the manual's signs.
// Renders nothing when this page is not one of the parts.
export function SeriesNav({ name, href, parts, current }) {
    const headingId = useId();
    const { index, previous, next } = seriesPlace(parts, current);
    if (index < 0)
        return null;
    return (_jsxs("nav", { className: "cap-series", "aria-labelledby": headingId, children: [_jsxs("h2", { className: "cap-series-title", id: headingId, children: ["Part ", index + 1, " of ", parts.length, ": ", _jsx(Link, { to: href, children: name })] }), _jsx("ol", { className: "cap-series-parts", children: parts.map((part, i) => (_jsx("li", { "aria-current": i === index ? "page" : undefined, children: i === index ? _jsx("span", { children: part.title }) : _jsx(Link, { to: part.href, children: part.title }) }, part.href))) }), _jsx(Signs, { className: "cap-series-steps", label: `Parts of ${name}`, prev: previous ? { ...previous, label: "Previous part" } : null, next: next ? { ...next, label: "Next part" } : null })] }));
}
