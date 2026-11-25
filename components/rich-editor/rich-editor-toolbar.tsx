// The formatted editor's toolbar (rich-editor.react.tsx): the tools it offers and the bar that shows them.
import type { Editor } from "@tiptap/core";
import { GLYPH } from "../markdown-editor/markdown-editor.ts";
import { rovingIndex } from "../toolbar/toolbar.ts";
import { focusSourceBlock } from "./rich-editor-dom.ts";

export type Tool = {
  id: string;
  label: string;
  hint?: string;
  keys?: string;
  paths: string[];
  glyph?: string;
  run: () => void;
};

/** A toolbar icon: the markdown editor's 24-unit stroke paths, hidden because each button has a name. */
function Icon({ paths }: { paths: string[] }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {paths.map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
}

/** The formatting tools, each running against the editor as it is when pressed. */
export function formattingTools(c: {
  editor: () => Editor | null;
  markdown: (e: Editor) => string;
  openPalette: () => void;
  chooseImage: (() => void) | null;
}): Tool[] {
  const run = (fn: (e: Editor) => void) => () => {
    const editor = c.editor();
    if (editor) fn(editor);
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
        if (level === 0) e.chain().focus().setParagraph().run();
        else
          e.chain()
            .focus()
            .setHeading({ level: level as 2 | 3 | 4 })
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

export function Toolbar(props: {
  tools: Tool[];
  blocks: Tool[];
  active: number;
  setActive: (i: number) => void;
  off: boolean;
  barRef: React.RefObject<HTMLDivElement | null>;
}) {
  const { tools, blocks, active, setActive, off, barRef } = props;
  const onKey = (event: React.KeyboardEvent) => {
    const buttons = [
      ...(barRef.current?.querySelectorAll<HTMLButtonElement>(".cap-md-tool:not(:disabled)") ?? []),
    ];
    const at = buttons.findIndex((b) => b === document.activeElement);
    const rtl = barRef.current ? getComputedStyle(barRef.current).direction === "rtl" : false;
    const next = rovingIndex(event.key, at, buttons.length, "horizontal", rtl);
    if (next === null || at < 0) return;
    event.preventDefault();
    buttons[next]?.focus();
  };
  return (
    // oxlint-disable-next-line jsx-a11y/interactive-supports-focus -- a roving-tabindex toolbar: its buttons take focus, the arrow keys move between them
    <div
      className="cap-md-toolbar"
      role="toolbar"
      aria-label="Formatting"
      ref={barRef}
      onKeyDown={onKey}
    >
      {[...tools, ...blocks].map((t, i) => (
        <span key={t.id} className="cap-rich-editor-slot">
          {i === tools.length && blocks.length > 0 ? (
            <span className="cap-md-sep" aria-hidden="true" />
          ) : null}
          <button
            type="button"
            className="cap-md-tool"
            aria-label={t.label}
            title={t.hint ? `${t.label}. ${t.hint}` : t.label}
            aria-keyshortcuts={t.keys}
            tabIndex={i === active ? 0 : -1}
            disabled={off}
            onFocus={() => setActive(i)}
            onMouseDown={(e) => e.preventDefault()}
            onClick={t.run}
          >
            {t.paths.length > 0 ? (
              <Icon paths={t.paths} />
            ) : (
              <span className="cap-md-tool-glyph" aria-hidden="true">
                {t.glyph ?? ""}
              </span>
            )}
          </button>
        </span>
      ))}
    </div>
  );
}
