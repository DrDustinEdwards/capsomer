import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from "react";
import { isImeEnter } from "../shortcuts/shortcuts.js";
import { parseTags } from "./media.js";
import { Wrap } from "./media-inspector-parts.react.js";
// The removable tag chips, the field that adds one, then the suggestions: the autosaving form's tags.
function TagsEditor({ base, item, fields, edit, }) {
    const [tagText, setTagText] = useState("");
    const addTag = (text) => {
        const add = parseTags(text);
        if (add.length)
            edit({ tags: [...fields.tags, ...add.filter((t) => !fields.tags.includes(t))] }, true);
        setTagText("");
    };
    return (_jsxs("div", { className: "cap-media-section", role: "group", "aria-labelledby": `${base}-tags-l`, children: [_jsx("span", { className: "cap-field-label", id: `${base}-tags-l`, children: "Tags" }), _jsx("ul", { className: "cap-media-tags", "data-cap-part": "tags", children: fields.tags.map((t) => (_jsx("li", { children: _jsxs("button", { type: "button", className: "cap-chip", "aria-label": `Remove tag ${t}`, onClick: () => edit({ tags: fields.tags.filter((x) => x !== t) }, true), children: [t, " ", _jsx("span", { "aria-hidden": "true", children: "\u00D7" })] }) }, t))) }), _jsx("input", { type: "hidden", name: "tags", value: fields.tags.join(", "), "data-cap-part": "tags-value" }), _jsx("label", { className: "cap-sr-only", htmlFor: `${base}-tag-input`, children: "Add a tag" }), _jsx("input", { className: "cap-input", id: `${base}-tag-input`, type: "text", autoComplete: "off", placeholder: "Add a tag, then press Enter", "data-cap-part": "tag-input", value: tagText, onChange: (e) => setTagText(e.target.value), onKeyDown: (e) => {
                    // legacy-scan:keep ime-safe-enter-submit isImeEnter (shortcuts.ts) checks isComposing and keyCode 229; the scanner cannot follow it.
                    if ((e.key === "Enter" && !isImeEnter(e.nativeEvent)) || e.key === ",") {
                        e.preventDefault();
                        addTag(tagText);
                    }
                }, onBlur: () => tagText.trim() && addTag(tagText) }), _jsx("ul", { className: "cap-media-tags", "data-cap-part": "suggestions", children: (item.suggestedTags ?? [])
                    .filter((t) => !fields.tags.includes(t))
                    .map((t) => (_jsx("li", { children: _jsxs("button", { type: "button", className: "cap-chip", "aria-label": `Add suggested tag ${t}`, onClick: () => edit({ tags: [...fields.tags, t] }, true), children: ["+ ", t] }) }, t))) })] }));
}
// The editable fields: alt text and Decorative (images), title and caption, and tags. In form mode
// each group is its own form (Wrap); otherwise they sit in the autosaving form.
export function InspectorFields({ item, base, fields, edit, formMode, F, action, shows, firstRef, }) {
    const img = item.kind === "image";
    return (_jsxs(_Fragment, { children: [img && shows.alt ? (_jsxs(Wrap, { on: formMode, F: F, action: action, label: "Alt text", intent: "alt", item: item, save: "Save alt text", children: [_jsxs("div", { className: "cap-field", "data-cap-part": "alt-field", children: [_jsx("label", { className: "cap-field-label", htmlFor: `${base}-alt`, children: "Alt text" }), _jsx("textarea", { ref: (el) => {
                                    if (el && !el.disabled)
                                        firstRef.current = el;
                                }, className: "cap-input", id: `${base}-alt`, name: "alt", "data-cap-part": "alt", rows: 2, placeholder: "Describe what the picture shows", "aria-describedby": `${base}-alt-help`, disabled: fields.decorative && !formMode, value: fields.decorative ? "" : fields.alt, onChange: (e) => edit({ alt: e.target.value }) }), _jsx("p", { className: "cap-field-help", id: `${base}-alt-help`, children: "Leave out \u201Cimage of\u201D." })] }), _jsx("div", { className: "cap-field", "data-cap-part": "decorative-field", children: _jsxs("label", { className: "cap-check", children: [_jsx("input", { type: "checkbox", name: "decorative", "data-cap-part": "decorative", checked: fields.decorative, onChange: (e) => edit({ decorative: e.target.checked, alt: e.target.checked ? "" : fields.alt }, true) }), " ", "Decorative image"] }) })] })) : !img ? (_jsx("p", { className: "cap-field-help", "data-cap-part": "alt-document", children: "A document takes no alt text. What a reader hears is the link text, and that lives in the post." })) : null, shows.title || shows.caption ? (_jsxs(Wrap, { on: formMode, F: F, action: action, label: shows.title ? "Title and caption" : "Caption", intent: shows.title ? "save-details" : "caption", item: item, save: shows.title ? "Save title and caption" : "Save caption", children: [shows.title ? (_jsxs("div", { className: "cap-field", children: [_jsx("label", { className: "cap-field-label", htmlFor: `${base}-title-field`, children: "Title" }), _jsx("input", { className: "cap-input", id: `${base}-title-field`, "data-cap-part": "title-field", name: "title", type: "text", autoComplete: "off", value: fields.title, onChange: (e) => edit({ title: e.target.value }) })] })) : null, shows.caption ? (_jsxs("div", { className: "cap-field", children: [_jsx("label", { className: "cap-field-label", htmlFor: `${base}-caption`, children: "Caption" }), _jsx("textarea", { className: "cap-input", id: `${base}-caption`, "data-cap-part": "caption", name: "caption", rows: 2, value: fields.caption, onChange: (e) => edit({ caption: e.target.value }) })] })) : null] })) : null, shows.tags && formMode ? (_jsx(Wrap, { on: true, F: F, action: action, label: "Tags", intent: "tags", item: item, save: "Save tags", children: _jsxs("div", { className: "cap-field", children: [_jsx("label", { className: "cap-field-label", htmlFor: `${base}-tags-text`, children: "Tags" }), _jsx("input", { className: "cap-input", id: `${base}-tags-text`, name: "tags", type: "text", autoComplete: "off", "aria-describedby": `${base}-tags-help`, value: fields.tags.join(", "), onChange: (e) => edit({ tags: parseTags(e.target.value) }) }), _jsx("p", { className: "cap-field-help", id: `${base}-tags-help`, children: "Separate tags with commas." })] }) })) : null, shows.tags && !formMode ? (_jsx(TagsEditor, { base: base, item: item, fields: fields, edit: edit })) : null] }));
}
