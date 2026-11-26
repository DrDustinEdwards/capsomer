import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { Suspense, lazy, useState } from "react";
import { Disclosure } from "../disclosure/disclosure.react.js";
import { MediaFocus, focusWords } from "./media-focus.react.js";
import { Ident } from "./media-inspector-parts.react.js";
// The crop editor, loaded the first time Crop is pressed, so a library page does not carry it.
const MediaCrop = lazy(() => import("./media-crop.react.js"));
// The tools that change the picture: the focal point, crop, and replace, each folded away (they are
// used now and then, and open each is as tall as the rest of the inspector). In form mode each is its
// own form; inside the autosaving form (`nested`) each is a group whose button hands its fields to
// `onTool`, since a form cannot sit inside a form.
export function PictureTools({ item, base, tools, action, Tool, }) {
    const [cropOpen, setCropOpen] = useState(false);
    const [opener, setOpener] = useState(null);
    const ident = (intent) => _jsx(Ident, { item: item, intent: intent });
    const size = item.width && item.height ? `${item.width} by ${item.height} pixels` : "the size of this one";
    const crop = tools.crop;
    return (_jsxs("div", { className: "cap-media-section", "data-cap-part": "tools", children: [tools.focus && item.thumb ? (_jsx(Disclosure, { summary: _jsxs(_Fragment, { children: ["Focal point ", _jsx("span", { className: "cap-media-summary-note", children: focusWords(item.focus) })] }), children: _jsx(MediaFocus, { name: item.name, src: item.thumb, focus: item.focus, action: action, Form: Tool, ident: ident("focus"), base: base }, `${item.key}:${item.version ?? ""}`) })) : null, crop || tools.replace ? (_jsxs(Disclosure, { summary: crop && tools.replace
                    ? "Crop or replace the file"
                    : tools.replace
                        ? "Replace the file"
                        : "Crop", children: [crop ? (_jsxs("div", { className: "cap-media-tool", "data-inline": "", children: [_jsxs("button", { type: "button", className: "cap-btn", "data-size": "sm", onClick: (e) => {
                                    setOpener(e.currentTarget);
                                    setCropOpen(true);
                                }, children: ["Crop", _jsxs("span", { className: "cap-sr-only", children: [" ", item.name] })] }), _jsx("p", { className: "cap-media-note", children: tools.keepsSize
                                    ? "Cut out part of the picture as a new file. This site takes a replacement only at the original's size, so a crop never replaces this one."
                                    : `Cut out part of the picture, as a new file${crop.inPlace ? " or in place of this one" : ""}.` }), opener ? (_jsx(Suspense, { fallback: null, children: _jsx(MediaCrop, { name: item.name, src: crop.src, asNew: crop.asNew, inPlace: crop.inPlace && !tools.keepsSize, keepsSize: tools.keepsSize, onSave: crop.onSave, open: cropOpen, opener: opener, onClose: () => setCropOpen(false) }) })) : null] })) : null, tools.replace ? (_jsxs(Tool, { method: "post", action: action, encType: "multipart/form-data", className: "cap-media-field-form cap-media-tool", "aria-label": "Replace the file", children: [ident("replace"), _jsxs("div", { className: "cap-field", children: [_jsx("label", { className: "cap-field-label", htmlFor: `${base}-replace`, children: "The new file" }), _jsxs("p", { className: "cap-field-help", id: `${base}-replace-help`, children: [tools.replace.hint, " ", tools.keepsSize
                                                ? `It must be ${size}: this site sizes its pages by them and refuses any other size. `
                                                : "", "It goes under the same address, so every page that shows this file shows the new one, and the old one is gone from the site. Alt text, caption and tags stay; the focal point is cleared. Readers who already loaded the old picture may see it until their browser's cache expires."] }), _jsx("input", { className: "cap-input", id: `${base}-replace`, type: "file", name: "file", accept: tools.replace.accept, required: true, "aria-describedby": `${base}-replace-help` })] }), _jsx("div", { className: "cap-media-tool-actions", children: _jsxs("button", { type: "submit", className: "cap-btn", "data-size": "sm", "data-variant": "danger", children: ["Replace", _jsxs("span", { className: "cap-sr-only", children: [" ", item.name] })] }) })] }, `replace:${item.key}:${item.version ?? ""}`)) : null] })) : null] }));
}
// A tool inside the autosaving form: a group, not a form, whose submit buttons hand its named fields
// (and the pressed button's) to the handler the ref holds.
export function nestedTool(handler) {
    return function NestedTool({ children, className, "aria-label": label }) {
        return (_jsx("div", { className: className, role: "group", "aria-label": label, onClickCapture: (e) => {
                const button = e.target.closest("button");
                if (!button || button.type !== "submit")
                    return;
                e.preventDefault();
                e.stopPropagation();
                const data = new FormData();
                for (const el of e.currentTarget.querySelectorAll("input[name], textarea[name], select[name]")) {
                    if ((el.type === "checkbox" || el.type === "radio") && !el.checked)
                        continue;
                    if (el.type === "file") {
                        if (!el.reportValidity())
                            return;
                        for (const f of el.files ?? [])
                            data.append(el.name, f);
                    }
                    else
                        data.append(el.name, el.value);
                }
                if (button.name)
                    data.append(button.name, button.value);
                handler.current?.(data);
                button.closest("details")?.removeAttribute("open");
            }, children: children }));
    };
}
