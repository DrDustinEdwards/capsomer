import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// The formatted editor's three panels (rich-editor.react.tsx): the image description step, the link
// palette and the block menu.
import { plural } from "@drdustinedwards/site-helpers/text";
import { isImeEnter } from "../shortcuts/shortcuts.js";
import { rovingIndex } from "../toolbar/toolbar.js";
export function ImageStep(props) {
    const { uid, upload, alt, setAlt, error, altRef, insert, cancel } = props;
    return (_jsxs("div", { className: "cap-md-upload", role: "group", "aria-label": "Describe the image", "aria-busy": upload.sending ? "true" : undefined, onKeyDown: (e) => {
            if (e.key === "Escape") {
                e.preventDefault();
                e.stopPropagation();
                cancel();
            }
        }, children: [_jsx("img", { className: "cap-md-upload-thumb", src: upload.preview || undefined, alt: "" }), _jsxs("div", { className: "cap-md-upload-fields", children: [_jsxs("label", { className: "cap-field-label", htmlFor: `${uid}-alt`, children: ["Alt text", " ", _jsx("span", { className: "cap-field-required", "aria-hidden": "true", children: "Required" })] }), _jsx("input", { ref: altRef, id: `${uid}-alt`, className: "cap-input", autoComplete: "off", placeholder: "What the image shows", "aria-describedby": `${uid}-alt-help`, value: alt, readOnly: Boolean(upload.sending), onChange: (e) => setAlt(e.target.value), onKeyDown: (e) => {
                            // legacy-scan:keep ime-safe-enter-submit isImeEnter (shortcuts.ts) checks isComposing and keyCode 229; the scanner cannot follow it.
                            if (e.key === "Enter" && !isImeEnter(e.nativeEvent)) {
                                e.preventDefault();
                                insert(false);
                            }
                        } }), _jsxs("p", { className: "cap-field-help", id: `${uid}-alt-help`, children: ["Describe ", upload.file.name, ", or insert it as decorative."] }), upload.sending ? _jsxs("p", { className: "cap-md-upload-wait", children: ["Uploading ", upload.file.name] }) : null, error ? (_jsx("p", { className: "cap-field-error cap-md-upload-error", role: "alert", children: error })) : null, _jsxs("div", { className: "cap-md-upload-actions", children: [_jsx("button", { type: "button", className: "cap-btn", "data-variant": "primary", disabled: !alt.trim() || Boolean(upload.sending), onClick: () => insert(false), children: "Insert image" }), _jsx("button", { type: "button", className: "cap-btn", disabled: Boolean(upload.sending), onClick: () => insert(true), children: "Insert as decorative" }), _jsx("button", { type: "button", className: "cap-btn", "data-variant": "quiet", onClick: cancel, children: "Cancel" })] })] })] }));
}
export function LinkPalette(props) {
    const { uid, palette, setPalette, matches, typedUrl, panelRef, close, apply } = props;
    return (_jsxs("div", { ref: panelRef, className: "cap-popover cap-md-palette", popover: "manual", role: "group", "aria-label": "Insert a link", "data-size": "lg", "data-side": "bottom", "data-align": "start", onBlur: (e) => {
            if (!(e.relatedTarget instanceof Node && e.currentTarget.contains(e.relatedTarget)))
                close(false);
        }, children: [_jsx("label", { className: "cap-md-palette-label", htmlFor: `${uid}-link`, children: "Link to" }), _jsx("input", { id: `${uid}-link`, type: "text", className: "cap-input", role: "combobox", "aria-autocomplete": "list", "aria-expanded": matches.length > 0, "aria-controls": `${uid}-link-list`, "aria-activedescendant": matches.length > 0 ? `${uid}-link-${palette.active}` : undefined, autoComplete: "off", spellCheck: false, placeholder: "Search pages, or type a URL", value: palette.query, onChange: (e) => setPalette({ ...palette, query: e.target.value, active: 0 }), onKeyDown: (e) => {
                    if (e.key === "Escape") {
                        e.preventDefault();
                        e.stopPropagation();
                        close(true);
                    }
                    else if (e.key === "ArrowDown" || e.key === "ArrowUp") {
                        e.preventDefault();
                        if (matches.length)
                            setPalette({
                                ...palette,
                                active: (palette.active + (e.key === "ArrowDown" ? 1 : matches.length - 1)) %
                                    matches.length,
                            });
                    }
                    else if (e.key === "Enter" && !isImeEnter(e.nativeEvent)) {
                        e.preventDefault();
                        if (typedUrl)
                            apply(typedUrl, typedUrl);
                        else if (matches[palette.active])
                            apply(matches[palette.active].href, matches[palette.active].title);
                    }
                } }), _jsx("div", { className: "cap-listbox", role: "listbox", id: `${uid}-link-list`, "aria-label": "Pages", "data-wrap": "", children: matches.map((m, i) => (_jsxs("div", { id: `${uid}-link-${i}`, className: "cap-option", role: "option", "aria-selected": i === palette.active, "data-active": i === palette.active ? "" : undefined, onMouseDown: (e) => e.preventDefault(), onClick: () => apply(m.href, m.title), children: [_jsx("span", { className: "cap-option-label", children: m.title }), m.note ? _jsxs("span", { className: "cap-md-option-note", children: [" (", m.note, ")"] }) : null, m.hint ? _jsx("span", { className: "cap-md-option-hint", children: m.hint }) : null] }, m.href))) }), _jsx("p", { className: "cap-md-palette-note", role: "status", children: typedUrl
                    ? `Enter links to ${typedUrl}.`
                    : matches.length === 0
                        ? "No page matches."
                        : `${plural(matches.length, "page")}.` })] }));
}
export function SlashMenu(props) {
    const { scaffolds, menuRef, editor, close, choose } = props;
    return (_jsx("ul", { ref: menuRef, className: "cap-popover cap-md-slash", popover: "manual", "aria-label": "Insert a block", "data-flush": "", "data-size": "auto", "data-side": "bottom", "data-align": "start", onKeyDown: (e) => {
            const items = [
                ...e.currentTarget.querySelectorAll(".cap-md-slash-item"),
            ];
            const at = items.findIndex((b) => b === document.activeElement);
            if (e.key === "Escape") {
                e.preventDefault();
                e.stopPropagation();
                close();
                editor()?.commands.focus();
            }
            else {
                const next = rovingIndex(e.key, at, items.length, "vertical");
                if (next === null)
                    return;
                e.preventDefault();
                items[next]?.focus();
            }
        }, children: scaffolds.map((s) => (_jsx("li", { children: _jsxs("button", { type: "button", className: "cap-md-slash-item", tabIndex: -1, onClick: () => choose(s), children: [_jsx("strong", { children: s.label }), _jsx("span", { className: "cap-md-slash-hint", children: s.hint })] }) }, s.id))) }));
}
