import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { preload } from "react-dom";
import { markup } from "../trusted-html/trusted-html.js";
import { burstPoints } from "./error-ad.js";
function Part({ part, adId }) {
    const rotate = part.rotate
        ? `rotate(${part.rotate} ${part.x ?? part.cx} ${part.y ?? part.cy})`
        : undefined;
    if (part.kind === "text") {
        const lines = part.lines ?? [];
        const draw = (fill, dx, dy, stroke) => (_jsx("text", { x: (part.x ?? 0) + dx, y: (part.y ?? 0) + dy, textAnchor: part.anchor, fontSize: part.size, fill: fill === "ink" ? undefined : fill, stroke: stroke, strokeWidth: stroke ? part.strokeWidth : undefined, strokeLinejoin: "round", paintOrder: "stroke", className: `cap-ad-f-${part.font}${fill === "ink" ? " cap-ad-ink" : ""}`, children: lines.map((line, i) => (_jsx("tspan", { x: (part.x ?? 0) + dx, dy: i === 0 ? 0 : (part.leading ?? (part.size ?? 20) * 1.2), children: line }, line))) }));
        return (_jsxs("g", { transform: rotate, children: [part.shadow
                    ? draw(part.shadow.fill, part.shadow.dx, part.shadow.dy, part.shadow.fill)
                    : null, draw(part.fill ?? "#000", 0, 0, part.stroke)] }));
    }
    if (part.kind === "burst")
        return (_jsx("polygon", { points: burstPoints(part.cx ?? 0, part.cy ?? 0, part.outer ?? 1, part.inner ?? 1, part.points ?? 12), fill: part.fill, stroke: part.stroke, strokeWidth: part.strokeWidth, strokeLinejoin: "round", transform: rotate }));
    if (part.kind === "rect")
        return (_jsx("rect", { x: part.x, y: part.y, width: part.w, height: part.h, fill: part.fill, transform: rotate }));
    return (_jsx("use", { href: `#ad-${adId}-${part.ref}`, x: part.x, y: part.y, width: part.w, height: part.h, color: part.color, transform: rotate }));
}
// One ad, as decoration at the foot of a utility page: inline SVG, so the lettering is real text
// in real fonts. No ground and no frame; hidden from assistive technology; put it last in main.
// The HTML contract in error-ad.md.
export function ErrorAd({ ad, size = "corner", stylesheet, fonts = [] }) {
    for (const href of fonts)
        preload(href, { as: "font", type: "font/woff2", crossOrigin: "anonymous" });
    return (_jsxs(_Fragment, { children: [stylesheet ? _jsx("link", { rel: "stylesheet", href: stylesheet }) : null, _jsxs("div", { className: "cap-ad", "data-size": size, "aria-hidden": "true", "data-ad": ad.id, children: [_jsx("svg", { className: "cap-ad-defs", focusable: "false", dangerouslySetInnerHTML: markup(ad.art) }), _jsx("svg", { className: "cap-ad-art", viewBox: `0 0 ${ad.viewBox[0]} ${ad.viewBox[1]}`, focusable: "false", children: ad.parts.map((part, i) => (_jsx(Part, { part: part, adId: ad.id }, i))) })] })] }));
}
