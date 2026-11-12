import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { plural } from "../hooks/hooks.js";
import { useEffect, useId, useRef, useState, } from "react";
import { attachToolbar } from "../toolbar/toolbar.js";
import { insertNodes, parseRichText, richTextNodes, richTextWords, sanitizeRichText, serializeRichText, tagsAround, toggleTag, } from "./rich-text-field.js";
const BUTTONS = {
    em: { label: "Italic", key: "i", keyName: "I", glyph: _jsx("em", { children: "I" }) },
    strong: { label: "Bold", key: "b", keyName: "B", glyph: _jsx("strong", { children: "B" }) },
    sup: {
        label: "Superscript",
        key: ".",
        keyName: ".",
        glyph: (_jsxs(_Fragment, { children: ["x", _jsx("sup", { children: "2" })] })),
    },
    sub: {
        label: "Subscript",
        key: ",",
        keyName: ",",
        glyph: (_jsxs(_Fragment, { children: ["x", _jsx("sub", { children: "2" })] })),
    },
    code: { label: "Code", key: "e", keyName: "E", glyph: _jsx("code", { children: "</>" }) },
};
// A short text with a few inline tags: the toolbar and the shortcuts put the real tag around the selection (or take
// it off), and a paste is kept to the allowed tags. The server sanitizes again on save.
export function RichTextField({ name, label, tags, initialHTML = "", help, error, required, lines = "single", wordCount = false, describedBy, onValueChange, }) {
    const base = useId();
    const labelId = `${base}-label`;
    const helpId = `${base}-help`;
    const errorId = `${base}-error`;
    const countId = `${base}-count`;
    const box = useRef(null);
    const bar = useRef(null);
    const [value, setValue] = useState(() => sanitizeRichText(initialHTML, tags));
    const [active, setActive] = useState([]);
    const hasError = error != null && error !== false && error !== "";
    const report = useRef(onValueChange);
    useEffect(() => {
        report.current = onValueChange;
    });
    // The editable box is filled once, from the tree, and then left to the browser so typing keeps the caret.
    useEffect(() => {
        const el = box.current;
        if (!el)
            return;
        el.replaceChildren(...richTextNodes(el.ownerDocument, parseRichText(value, tags)));
        report.current?.(value);
        // oxlint-disable-next-line react/exhaustive-deps -- once: later values come from the box itself
    }, []);
    useEffect(() => (bar.current ? attachToolbar(bar.current) : undefined), []);
    // The pressed state follows the caret.
    useEffect(() => {
        const doc = box.current?.ownerDocument;
        if (!doc)
            return undefined;
        const onSelection = () => {
            const el = box.current;
            const sel = doc.getSelection();
            if (!el || !sel || sel.rangeCount === 0 || !el.contains(sel.anchorNode))
                return;
            setActive(tagsAround(sel.anchorNode, el));
        };
        doc.addEventListener("selectionchange", onSelection);
        return () => doc.removeEventListener("selectionchange", onSelection);
    }, []);
    function sync() {
        const el = box.current;
        if (!el)
            return;
        const next = serializeRichText(parseRichText(el.innerHTML, tags)).trim();
        setValue(next);
        report.current?.(next);
    }
    function toggle(tag) {
        const el = box.current;
        if (!el)
            return;
        if (toggleTag(el, tag, el.ownerDocument.getSelection())) {
            sync();
            setActive(tagsAround(el.ownerDocument.getSelection()?.anchorNode ?? null, el));
        }
    }
    function onKeyDown(event) {
        if (event.key === "Enter") {
            event.preventDefault();
            return;
        }
        if (!(event.ctrlKey || event.metaKey) || event.altKey || event.shiftKey)
            return;
        const tag = tags.find((t) => BUTTONS[t].key === event.key.toLowerCase());
        if (!tag) {
            // The browser's own bold and underline would write tags the field does not allow.
            if (["b", "u"].includes(event.key.toLowerCase()))
                event.preventDefault();
            return;
        }
        event.preventDefault();
        toggle(tag);
    }
    function onPaste(event) {
        event.preventDefault();
        const el = box.current;
        if (!el)
            return;
        const html = event.clipboardData.getData("text/html");
        const text = event.clipboardData.getData("text/plain");
        // Plain text is text: its < and & are characters, not markup.
        const tree = html ? parseRichText(html, tags) : [text];
        const flat = tree.map((n) => (typeof n === "string" ? n.replace(/\s*[\r\n]+\s*/g, " ") : n));
        if (insertNodes(el, richTextNodes(el.ownerDocument, flat), el.ownerDocument.getSelection()))
            sync();
    }
    const described = [hasError ? errorId : null, help ? helpId : null, wordCount ? countId : null, describedBy]
        .filter(Boolean)
        .join(" ") || undefined;
    const words = richTextWords(value);
    return (_jsxs("div", { className: "cap-field cap-rich-text", "data-invalid": hasError ? "true" : undefined, children: [_jsxs("span", { className: "cap-field-label", id: labelId, children: [label, required ? (_jsx("span", { className: "cap-field-required", "aria-hidden": "true", children: "Required" })) : null] }), help ? (_jsx("p", { className: "cap-field-help", id: helpId, children: help })) : null, _jsx("div", { ref: bar, className: "cap-toolbar cap-rich-text-bar", role: "toolbar", "aria-label": "Formatting", "aria-controls": `${base}-box`, children: tags.map((tag) => {
                    const b = BUTTONS[tag];
                    return (_jsxs("button", { type: "button", className: "cap-btn", "data-size": "sm", "aria-pressed": active.includes(tag), "aria-keyshortcuts": `Control+${b.keyName} Meta+${b.keyName}`, title: `${b.label} (Ctrl or Cmd + ${b.keyName})`, 
                        // Keeps the selection in the box when the pointer presses the button.
                        onMouseDown: (e) => e.preventDefault(), onClick: () => toggle(tag), children: [_jsx("span", { "aria-hidden": "true", children: b.glyph }), _jsx("span", { className: "cap-sr-only", children: b.label })] }, tag));
                }) }), _jsx("div", { ref: box, id: `${base}-box`, className: "cap-input cap-rich-text-box", "data-lines": lines, role: "textbox", "aria-multiline": lines === "multi", "aria-labelledby": labelId, "aria-describedby": described, "aria-invalid": hasError ? true : undefined, "aria-required": required || undefined, tabIndex: 0, contentEditable: true, suppressContentEditableWarning: true, spellCheck: true, onInput: sync, onKeyDown: onKeyDown, onPaste: onPaste, onDrop: (e) => e.preventDefault() }), _jsx("input", { type: "hidden", name: name, value: value }), wordCount ? (_jsx("p", { className: "cap-field-help cap-rich-text-count", id: countId, "aria-live": "polite", children: plural(words, "word", "words") })) : null, _jsx("p", { className: "cap-field-error", id: errorId, hidden: !hasError, children: hasError ? error : null })] }));
}
