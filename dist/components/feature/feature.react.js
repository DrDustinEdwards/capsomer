import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Eyebrow } from "../eyebrow/eyebrow.react.js";
// The HTML contract in feature.md.
export function FeatureBlock({ eyebrow, title, body, media, scrollLabel, layout = "stacked", alignStart, lifted, headingLevel: H = "h3", id, }) {
    return (_jsxs("div", { className: "cap-feature", id: id, "data-layout": layout === "beside" ? "beside" : undefined, "data-align": alignStart ? "start" : undefined, "data-variant": lifted ? "lifted" : undefined, children: [_jsxs("div", { className: "cap-feature-text", children: [eyebrow ? _jsx(Eyebrow, { tone: "accent", children: eyebrow }) : null, _jsx(H, { className: "cap-feature-title", children: title }), body ? _jsx("p", { className: "cap-feature-body", children: body }) : null] }), media ? (_jsx("div", { className: "cap-feature-media", children: scrollLabel ? (_jsx("div", { className: "cap-feature-scroll", role: "region", "aria-label": scrollLabel, tabIndex: 0, children: media })) : (media) })) : null] }));
}
export function Features({ children, alternate }) {
    return (_jsx("div", { className: "cap-features", "data-alternate": alternate ? "" : undefined, children: children }));
}
export function FeatureCard({ icon, title, text, headingLevel: H = "h3", }) {
    return (_jsxs("li", { className: "cap-feature-card", children: [icon ? (_jsx("span", { className: "cap-feature-card-icon", "aria-hidden": "true", children: icon })) : null, _jsx(H, { className: "cap-feature-card-title", children: title }), text ? _jsx("p", { className: "cap-feature-card-text", children: text }) : null] }));
}
export function FeatureGrid({ items, headingLevel, ordered, label, }) {
    const List = ordered ? "ol" : "ul";
    return (_jsx(List, { className: "cap-feature-grid", "aria-label": label, children: items.map((item, i) => (_jsx(FeatureCard, { ...item, headingLevel: headingLevel }, item.id ?? i))) }));
}
