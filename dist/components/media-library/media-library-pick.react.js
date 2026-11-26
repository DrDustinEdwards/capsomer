import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { withMedia } from "./media-library.js";
// The picker's alt step: the chosen picture, the alt text this use needs (the model's, if the host
// read it, only when the person takes it), and Insert.
export function PickForm({ m }) {
    const { Form, action, href, iOffers, mounted, offers, pick, pickAlt, pickSuggestion, query, setChosen, suggestions, uid, } = m;
    if (!pick)
        return null;
    return (_jsxs(Form, { method: "post", action: action, className: "cap-media-pick", "data-cap-part": "pick", "aria-labelledby": `${uid}-pick-h`, children: [_jsx("input", { type: "hidden", name: "intent", value: "pick" }), _jsx("input", { type: "hidden", name: "ids", value: pick.key }), _jsxs("h3", { className: "cap-media-pick-title", id: `${uid}-pick-h`, children: ["Alt text for ", pick.name] }), pick.thumb ? (_jsx("img", { className: "cap-media-pick-preview", src: pick.thumb, alt: "", width: 160, height: 160 })) : null, _jsxs("div", { className: "cap-field", children: [_jsx("label", { className: "cap-field-label", htmlFor: `${uid}-pick-alt`, children: "Alt text (required)" }), _jsx("textarea", { ref: pickAlt, className: "cap-input", id: `${uid}-pick-alt`, name: "alt", rows: 2, required: true, defaultValue: pick.alt, "aria-describedby": `${uid}-pick-help` }), _jsxs("p", { className: "cap-field-help", id: `${uid}-pick-help`, children: ["What the picture shows here, or insert it as decorative.", " ", pick.alt ? "It starts with the file's own alt text." : null] }), pickSuggestion ? (_jsxs("p", { className: "cap-field-help", "data-cap-part": "pick-suggestion", children: [suggestions?.model, " suggests: \u201C", pickSuggestion, "\u201D", " ", mounted ? (_jsx("button", { type: "button", className: "cap-btn", "data-variant": "quiet", onClick: () => {
                                    if (!pickAlt.current)
                                        return;
                                    pickAlt.current.value = pickSuggestion;
                                    pickAlt.current.focus();
                                }, children: "Use it" })) : null] })) : iOffers.suggest && offers.alt && suggestions === undefined ? (_jsx("p", { className: "cap-field-help", children: _jsx("a", { href: href(withMedia(query, { pick: pick.key, suggest: true })), children: "Suggest alt text" }) })) : null] }), _jsxs("div", { className: "cap-media-pick-actions", children: [_jsx("button", { type: "submit", className: "cap-btn", "data-variant": "primary", children: "Insert" }), _jsx("button", { type: "submit", className: "cap-btn", name: "decorative", value: "on", formNoValidate: true, children: "Insert as decorative" }), _jsx("a", { className: "cap-btn", "data-variant": "quiet", href: href(withMedia(query, { pick: undefined })), onClick: (e) => {
                            if (!mounted)
                                return;
                            e.preventDefault();
                            setChosen(undefined);
                        }, children: "Choose another" })] })] }));
}
