import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Meter } from "../meter/meter.react.js";
import { SERP_LIMITS, serpReading, serpTextWidth } from "./share-preview.js";
// The HTML contract in share-preview.md. The app cuts the text to its limits before it passes it.
export function SerpPreview({ url, title, description, note, label = "Search result preview", }) {
    return (_jsxs("div", { className: "cap-serp", role: "group", "aria-label": label, children: [_jsx("p", { className: "cap-serp-url", children: url }), _jsx("p", { className: "cap-serp-title", children: title }), _jsx("p", { className: "cap-serp-description", children: description }), note ? _jsx("p", { className: "cap-serp-note", children: note }) : null] }));
}
export function OgCardPreview({ image, host, title, description, note, label = "Social card preview", }) {
    return (_jsxs("div", { className: "cap-og-card", role: "group", "aria-label": label, children: [_jsx("div", { className: "cap-og-card-image", children: image }), _jsxs("div", { className: "cap-og-card-body", children: [_jsx("p", { className: "cap-og-card-host", children: host }), _jsx("p", { className: "cap-og-card-title", children: title }), description ? _jsx("p", { className: "cap-og-card-description", children: description }) : null] }), note ? _jsx("p", { className: "cap-og-card-note", children: note }) : null] }));
}
// A text's width as a search result sets it, against the cut. Too wide only warns.
export function SerpWidthMeter({ label, text, part = "title", limit = SERP_LIMITS[part].px, measure, size = "sm", }) {
    const px = measure ? measure(text) : serpTextWidth(text, part);
    const reading = serpReading(text, px, limit);
    return (_jsx(Meter, { size: size, label: label, value: px, max: limit, measuring: px === null, tone: reading.over ? "warn" : "ok", words: { warn: "Google cuts it off", crit: "Google cuts it off" }, display: reading.display, valueText: reading.valueText }));
}
