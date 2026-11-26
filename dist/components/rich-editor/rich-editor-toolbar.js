import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { GLYPH } from "../markdown-editor/markdown-editor.js";
import { rovingIndex } from "../toolbar/toolbar.js";
import { focusSourceBlock } from "./rich-editor-dom.js";
/** A toolbar icon: the markdown editor's 24-unit stroke paths, hidden because each button has a name. */
function Icon({ paths }) {
    return (_jsx("svg", { width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", focusable: "false", children: paths.map((d) => (_jsx("path", { d: d }, d))) }));
}
/** The formatting tools, each running against the editor as it is when pressed. */
export function formattingTools(c) {
    const run = (fn) => () => {
        const editor = c.editor();
        if (editor)
            fn(editor);
    };
    return [
        {
            id: "bold",
            label: "Bold",
            hint: "Ctrl or Cmd + B",
            keys: "Control+B Meta+B",
            paths: GLYPH.bold,
            run: run((e) => e.chain().focus().toggleBold().run()),
        },
        {
            id: "italic",
            label: "Italic",
            hint: "Ctrl or Cmd + I",
            keys: "Control+I Meta+I",
            paths: GLYPH.italic,
            run: run((e) => e.chain().focus().toggleItalic().run()),
        },
        {
            id: "link",
            label: "Link",
            hint: "Ctrl or Cmd + K, searches pages",
            keys: "Control+K Meta+K",
            paths: GLYPH.link,
            run: c.openPalette,
        },
        {
            id: "heading",
            label: "Heading level",
            hint: "Cycles h2, h3, h4, none",
            paths: GLYPH.heading,
            run: run((e) => {
                const level = e.isActive("heading", { level: 2 })
                    ? 3
                    : e.isActive("heading", { level: 3 })
                        ? 4
                        : e.isActive("heading", { level: 4 })
                            ? 0
                            : 2;
                if (level === 0)
                    e.chain().focus().setParagraph().run();
                else
                    e.chain()
                        .focus()
                        .setHeading({ level: level })
                        .run();
            }),
        },
        {
            id: "code",
            label: "Code",
            hint: "Ctrl or Cmd + E",
            keys: "Control+E Meta+E",
            paths: GLYPH.code,
            run: run((e) => e.chain().focus().toggleCode().run()),
        },
        {
            id: "footnote",
            label: "Footnote",
            paths: GLYPH.footnote,
            run: run((e) => {
                const md = c.markdown(e);
                const n = Math.max(0, ...[...md.matchAll(/\[\^(\d+)\]/g)].map((m) => Number(m[1]))) + 1;
                e.chain()
                    .focus()
                    .insertContent({ type: "sourceInline", attrs: { text: `[^${n}]` } })
                    .run();
                const end = e.state.doc.content.size;
                e.chain()
                    .insertContentAt(end, {
                    type: "sourceBlock",
                    attrs: { text: `[^${n}]: `, kind: "Footnote" },
                })
                    .run();
                focusSourceBlock(e, { id: "footnote", label: "Footnote", hint: "", text: `[^${n}]: ` });
            }),
        },
        ...(c.chooseImage
            ? [{ id: "image", label: "Insert image", paths: GLYPH.image, run: c.chooseImage }]
            : []),
    ];
}
export function Toolbar(props) {
    const { tools, blocks, active, setActive, off, barRef } = props;
    const onKey = (event) => {
        const buttons = [
            ...(barRef.current?.querySelectorAll(".cap-md-tool:not(:disabled)") ?? []),
        ];
        const at = buttons.findIndex((b) => b === document.activeElement);
        const rtl = barRef.current ? getComputedStyle(barRef.current).direction === "rtl" : false;
        const next = rovingIndex(event.key, at, buttons.length, "horizontal", rtl);
        if (next === null || at < 0)
            return;
        event.preventDefault();
        buttons[next]?.focus();
    };
    return (_jsx("div", { className: "cap-md-toolbar", role: "toolbar", "aria-label": "Formatting", ref: barRef, onKeyDown: onKey, children: [...tools, ...blocks].map((t, i) => (_jsxs("span", { className: "cap-rich-editor-slot", children: [i === tools.length && blocks.length > 0 ? (_jsx("span", { className: "cap-md-sep", "aria-hidden": "true" })) : null, _jsx("button", { type: "button", className: "cap-md-tool", "aria-label": t.label, title: t.hint ? `${t.label}. ${t.hint}` : t.label, "aria-keyshortcuts": t.keys, tabIndex: i === active ? 0 : -1, disabled: off, onFocus: () => setActive(i), onMouseDown: (e) => e.preventDefault(), onClick: t.run, children: t.paths.length > 0 ? (_jsx(Icon, { paths: t.paths })) : (_jsx("span", { className: "cap-md-tool-glyph", "aria-hidden": "true", children: t.glyph ?? "" })) })] }, t.id))) }));
}
