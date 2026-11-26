// The markdown editor's toolbar: the formatting tools, the block scaffolds after them, and the
// commands the keyboard shortcuts share with the buttons.
import { clamp } from "../hooks/hooks.js";
import { attachToolbar } from "../toolbar/toolbar.js";
import { GLYPH, el, icon } from "./markdown-editor-dom.js";
import { footnoteEdit, headingEdit, wrapEdit } from "./markdown-editor-edits.js";
export function createToolbar(c, parts) {
    const { toolbar, file } = parts;
    const { doc, sel } = c;
    const apply = c.apply;
    const commands = {
        bold: () => apply(wrapEdit(doc(), sel().from, sel().to, "**")),
        italic: () => apply(wrapEdit(doc(), sel().from, sel().to, "_")),
        code: () => apply(wrapEdit(doc(), sel().from, sel().to, "`")),
        heading: () => apply(headingEdit(doc(), c.surface()?.caret().head ?? 0)),
        footnote: () => apply(footnoteEdit(doc(), sel().from, sel().to)),
    };
    function tools() {
        const t = [
            {
                id: "bold",
                label: "Bold",
                hint: "Ctrl or Cmd + B",
                keys: "Control+B Meta+B",
                paths: GLYPH.bold,
                run: commands.bold,
            },
            {
                id: "italic",
                label: "Italic",
                hint: "Ctrl or Cmd + I",
                keys: "Control+I Meta+I",
                paths: GLYPH.italic,
                run: commands.italic,
            },
            {
                id: "link",
                label: "Link",
                hint: "Ctrl or Cmd + K, searches pages",
                keys: "Control+K Meta+K",
                paths: GLYPH.link,
                run: parts.openLink,
            },
            {
                id: "heading",
                label: "Heading level",
                hint: "Cycles h2, h3, h4, none",
                paths: GLYPH.heading,
                run: commands.heading,
            },
            {
                id: "code",
                label: "Code",
                hint: "Ctrl or Cmd + E",
                keys: "Control+E Meta+E",
                paths: GLYPH.code,
                run: commands.code,
            },
            {
                id: "footnote",
                label: "Footnote",
                paths: GLYPH.footnote,
                run: commands.footnote,
            },
        ];
        if (c.o.onUpload)
            t.push({
                id: "image",
                label: "Insert image",
                paths: GLYPH.image,
                run: () => file.click(),
            });
        return t;
    }
    function build() {
        const main = tools();
        const blocks = (c.o.scaffolds ?? []).map((s) => ({
            id: `scaffold-${s.id}`,
            label: s.label,
            hint: s.hint,
            paths: s.icon ? [s.icon] : [],
            glyph: s.label.slice(0, 1).toUpperCase(),
            run: () => parts.insertScaffold(s),
        }));
        const all = [...main, ...blocks];
        // A rebuilt bar keeps its tab stop where it was.
        const was = [...toolbar.querySelectorAll(".cap-md-tool")].findIndex((b) => b.getAttribute("tabindex") === "0");
        const activeTool = clamp(was, 0, all.length - 1);
        const nodes = [];
        all.forEach((t, i) => {
            if (i === main.length && blocks.length > 0)
                nodes.push(el("span", { class: "cap-md-sep", "aria-hidden": "true" }));
            const b = el("button", {
                type: "button",
                class: "cap-md-tool",
                "aria-label": t.label,
                title: t.hint ? `${t.label}. ${t.hint}` : t.label,
            });
            if (t.keys)
                b.setAttribute("aria-keyshortcuts", t.keys);
            b.tabIndex = i === activeTool ? 0 : -1;
            b.disabled = c.locked();
            b.append(t.paths.length > 0
                ? icon(t.paths)
                : el("span", { class: "cap-md-tool-glyph", "aria-hidden": "true" }, t.glyph ?? ""));
            b.addEventListener("click", () => t.run());
            nodes.push(b);
        });
        toolbar.replaceChildren(...nodes);
        // With every button disabled there is no tab stop, and the toolbar says so by being empty of focus.
    }
    return { build, commands, attach: () => attachToolbar(toolbar, ".cap-md-tool:not(:disabled)") };
}
