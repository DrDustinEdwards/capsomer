import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import {} from "../media/media.js";
import { Glyph } from "../status/status.react.js";
import { dayWords, inspectorOffers, licenseEnded, momentWords, oversized, turnMakesCopy, } from "./media-library.js";
import { isHttpUrl } from "@dustinedwards/site-runtime/url";
import { formatBytes } from "../format/format.js";
import { MediaSuggest } from "./media-library-suggest.react.js";
// The inspector's sections for site-api v0.13.0's media ideas, each shown only where the kit offers it and the
// person may run it. Each is a form (`Tool`) posting the kit's intent, so it works with no script.
const REASON_WORDS = {
    upload: "Uploaded",
    import: "Imported",
    replace: "Replaced",
    transform: "Turned",
    resize: "Shrunk",
    revert: "Reverted",
};
const TURNS = [
    ["rotate-270", "Rotate left"],
    ["rotate-90", "Rotate right"],
    ["flip-h", "Flip horizontally"],
    ["flip-v", "Flip vertically"],
];
export function MediaMore({ item, data, Tool, ident, base, action, inspectHref, suggestHref, unsuggestHref, }) {
    const o = inspectorOffers(data);
    const img = item.kind === "image";
    const live = item.state !== "binned";
    const versioned = !!item.version;
    const history = o.revert || data.offers.history ? (data.history ?? []) : [];
    const ended = licenseEnded(item.licenseExpires);
    const suggestions = data.suggestions;
    const credits = data.offers.credit;
    const taken = o.embedded && item.takenAt ? dayWords(item.takenAt) : null;
    const altFromFile = o.embedded &&
        data.offers.alt &&
        data.can.edit &&
        img &&
        live &&
        versioned &&
        !item.alt.trim() &&
        item.altState !== "decorative" &&
        item.caption.trim()
        ? item.caption.trim()
        : "";
    return (_jsxs(_Fragment, { children: [o.twins && item.twins && item.twins.length > 0 ? (_jsxs("section", { className: "cap-media-section", "aria-labelledby": `${base}-twins-l`, "data-cap-part": "twins", children: [_jsx("h3", { id: `${base}-twins-l`, children: "Same file as" }), _jsx("p", { className: "cap-media-note", children: "These hold exactly the same bytes. Pages may use either one, so check where each is used before you move one to Trash." }), _jsx("ul", { className: "cap-media-used", children: item.twins.map((t) => (_jsx("li", { children: _jsx("a", { href: inspectHref(t.key), children: t.name }) }, t.key))) })] })) : null, taken || altFromFile ? (_jsxs("section", { className: "cap-media-section", "aria-labelledby": `${base}-embedded-l`, "data-cap-part": "embedded", children: [_jsx("h3", { id: `${base}-embedded-l`, children: "From the file" }), _jsx("p", { className: "cap-media-note", children: "What the file itself said when it was uploaded. Where it named a credit, license or caption, the site filled the empty field with it." }), taken ? (_jsxs("dl", { className: "cap-media-facts", children: [_jsx("dt", { children: "Taken" }), _jsx("dd", { children: taken })] })) : null, altFromFile ? (_jsxs(Tool, { method: "post", action: action, className: "cap-media-field-form cap-media-tool", "aria-label": "Alt text from the file's caption", children: [ident("alt"), _jsxs("div", { className: "cap-field", children: [_jsx("label", { className: "cap-field-label", htmlFor: `${base}-alt-embedded`, children: "Start the alt text from the caption" }), _jsx("textarea", { className: "cap-input", id: `${base}-alt-embedded`, name: "alt", rows: 2, defaultValue: altFromFile, "aria-describedby": `${base}-alt-embedded-help` }), _jsx("p", { className: "cap-field-help", id: `${base}-alt-embedded-help`, children: "A caption says what is around the picture; alt text says what it shows. Change it to fit, then save." })] }), _jsx("div", { className: "cap-media-tool-actions", children: _jsx("button", { type: "submit", className: "cap-btn", "data-size": "sm", children: "Save as alt text" }) })] })) : null] })) : null, o.suggest && img && live && versioned ? (_jsx(MediaSuggest, { base: base, Tool: Tool, ident: ident, action: action, offers: data.offers, suggestions: suggestions, suggestHref: suggestHref, unsuggestHref: unsuggestHref })) : null, credits &&
                (o.credit || item.credit || item.license || item.sourceUrl || item.licenseExpires) ? (_jsxs("section", { className: "cap-media-section", "aria-labelledby": `${base}-credit-l`, "data-cap-part": "credit", children: [_jsx("h3", { id: `${base}-credit-l`, children: "Credit and license" }), ended ? (_jsxs("div", { className: "cap-alert", "data-tone": "warn", "data-cap-part": "license-ended", children: [_jsx(Glyph, { name: "warn" }), _jsxs("span", { className: "cap-alert-text", children: ["License ended on ", dayWords(item.licenseExpires ?? ""), ". Renew it, or replace the file where pages use it."] })] })) : null, o.credit && versioned ? (_jsxs(Tool, { method: "post", action: action, className: "cap-media-field-form cap-media-tool", "aria-label": "Credit and license", children: [ident("credit"), _jsxs("div", { className: "cap-field", children: [_jsx("label", { className: "cap-field-label", htmlFor: `${base}-credit`, children: "Credit" }), _jsx("input", { className: "cap-input", id: `${base}-credit`, name: "credit", type: "text", autoComplete: "off", maxLength: 300, defaultValue: item.credit ?? "" })] }), _jsxs("div", { className: "cap-field", children: [_jsx("label", { className: "cap-field-label", htmlFor: `${base}-license`, children: "License" }), _jsx("input", { className: "cap-input", id: `${base}-license`, name: "license", type: "text", autoComplete: "off", maxLength: 300, defaultValue: item.license ?? "" })] }), _jsxs("div", { className: "cap-field", children: [_jsx("label", { className: "cap-field-label", htmlFor: `${base}-source`, children: "Source address" }), _jsx("input", { className: "cap-input", id: `${base}-source`, name: "sourceUrl", type: "url", autoComplete: "off", defaultValue: item.sourceUrl ?? "" })] }), _jsxs("div", { className: "cap-field", children: [_jsx("label", { className: "cap-field-label", htmlFor: `${base}-expires`, children: "License ends" }), _jsx("input", { className: "cap-input", id: `${base}-expires`, name: "licenseExpires", type: "date", defaultValue: item.licenseExpires ?? "", "aria-describedby": `${base}-expires-help` }), _jsx("p", { className: "cap-field-help", id: `${base}-expires-help`, children: "Leave it empty for a license with no end. The License ended filter lists files past theirs." })] }), _jsx("div", { className: "cap-media-tool-actions", children: _jsx("button", { type: "submit", className: "cap-btn", "data-size": "sm", children: "Save credit" }) })] }, `credit:${item.key}:${item.version ?? ""}`)) : (_jsxs("dl", { className: "cap-media-facts", children: [item.credit ? (_jsxs(_Fragment, { children: [_jsx("dt", { children: "Credit" }), _jsx("dd", { children: item.credit })] })) : null, item.license ? (_jsxs(_Fragment, { children: [_jsx("dt", { children: "License" }), _jsx("dd", { children: item.license })] })) : null, item.sourceUrl ? (_jsxs(_Fragment, { children: [_jsx("dt", { children: "Source" }), _jsx("dd", { children: _jsx("a", { href: isHttpUrl(item.sourceUrl) ? item.sourceUrl : undefined, children: item.sourceUrl }) })] })) : null, item.licenseExpires ? (_jsxs(_Fragment, { children: [_jsx("dt", { children: "License ends" }), _jsx("dd", { children: dayWords(item.licenseExpires) })] })) : null] }))] })) : null, img && live && versioned && (o.transform || oversized(item, o.resize)) ? (_jsxs("section", { className: "cap-media-section", "aria-labelledby": `${base}-turn-l`, "data-cap-part": "turns", children: [_jsx("h3", { id: `${base}-turn-l`, children: "Turn and size" }), o.transform ? (_jsxs(Tool, { method: "post", action: action, className: "cap-media-tool", "aria-label": "Turn or mirror the picture", children: [ident("transform"), _jsx("div", { className: "cap-media-tool-actions", children: TURNS.map(([op, label]) => (_jsx("button", { type: "submit", className: "cap-btn", "data-size": "sm", name: "op", value: op, children: label }, op))) }), _jsxs("p", { className: "cap-media-note", children: [turnMakesCopy(item, data.offers)
                                        ? "A quarter turn saves the turned picture as a new file, since this site's addresses carry the size; pages that use this one keep it. A flip changes this one in place."
                                        : null, data.offers.history ? " Its history keeps the bytes it had." : ""] })] })) : null, o.resize != null && oversized(item, o.resize) ? (_jsxs(Tool, { method: "post", action: action, className: "cap-media-tool", "aria-label": "Shrink to the site's size", children: [ident("resize"), _jsx("div", { className: "cap-media-tool-actions", children: _jsxs("button", { type: "submit", className: "cap-btn", "data-size": "sm", children: ["Shrink to ", o.resize, " pixels"] }) }), _jsxs("p", { className: "cap-media-note", children: ["Its longer edge is ", Math.max(item.width ?? 0, item.height ?? 0), " pixels; this site keeps ", o.resize, ". The site asks before it stores the smaller picture, which every page that uses it then shows."] })] })) : null] })) : null, history.length > 0 ? (_jsxs("section", { className: "cap-media-section", "aria-labelledby": `${base}-history-l`, "data-cap-part": "history", children: [_jsx("h3", { id: `${base}-history-l`, children: "History" }), _jsx("ol", { className: "cap-media-lib-history", children: history.map((r) => {
                            const when = momentWords(r.at);
                            return (_jsxs("li", { "aria-current": r.current ? "true" : undefined, children: [_jsxs("span", { className: "cap-media-lib-history-what", children: [REASON_WORDS[r.reason], " ", when] }), _jsx("span", { className: "cap-media-lib-history-facts", children: [
                                            r.width && r.height ? `${r.width} by ${r.height}` : null,
                                            formatBytes(r.bytes),
                                            r.current ? "now" : null,
                                        ]
                                            .filter(Boolean)
                                            .join(" · ") }), !r.current && o.revert && live && versioned ? (_jsxs(Tool, { method: "post", action: action, className: "cap-media-lib-revert", "aria-label": `Go back to the version of ${when}`, children: [ident("revert"), _jsx("input", { type: "hidden", name: "to", value: r.rev }), _jsxs("button", { type: "submit", className: "cap-btn", "data-size": "sm", children: ["Go back to this", _jsxs("span", { className: "cap-sr-only", children: [" version, ", when] })] })] })) : null] }, r.rev));
                        }) }), o.revert ? (_jsx("p", { className: "cap-media-note", children: "Going back stores those bytes again as the newest version, so it can be undone. Set the focal point again if it had one." })) : null] })) : null] }));
}
