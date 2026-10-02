// The CodeMirror half of the markdown editor. Only this file imports CodeMirror, and only
// markdown-editor.ts's dynamic import() reaches it, so the editor stays its own chunk and a
// bundle that never mounts one never carries it. It exposes a small `Surface` and nothing of
// CodeMirror's own types, so the chrome (toolbar, link palette, slash menu, image prompt)
// stays plain DOM in markdown-editor.ts.
//
// CodeMirror writes its styles into the page unlayered, and an unlayered rule beats a
// `@layer cap.components` one. So the theme for CodeMirror's own parts is written through its
// theme API below, from Capsomer's tokens only; everything else is in markdown-editor.css.
import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
import { markdown, markdownLanguage } from "@codemirror/lang-markdown";
import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { Compartment, EditorState } from "@codemirror/state";
import { EditorView, keymap, lineNumbers, placeholder as cmPlaceholder } from "@codemirror/view";
import { tags } from "@lezer/highlight";

import type { Edit } from "./markdown-editor.ts";

export type KeyName = "bold" | "italic" | "link" | "code" | "save" | "escape" | "down";

export interface SurfaceConfig {
  parent: HTMLElement;
  doc: string;
  placeholder: string;
  nonce: string;
  lineNumbers: boolean;
  readOnly: boolean;
  disabled: boolean;
  // Attributes on the editable element: its name, aria-invalid, aria-describedby, and so on.
  attrs: Record<string, string>;
  onDocChange(value: string): void;
  onCaret(): void;
  // Return true when the key was used, so CodeMirror does nothing more with it.
  onKey(name: KeyName): boolean;
  // Return true to take a dropped or pasted image file.
  onFile(file: File): boolean;
}

export interface Caret {
  head: number;
  lineFrom: number;
  lineTo: number;
  lineText: string;
}

export interface Surface {
  getValue(): string;
  setValue(value: string): void;
  focus(): void;
  hasFocus(): boolean;
  selection(): { from: number; to: number };
  caret(): Caret;
  coords(pos: number): { top: number; bottom: number; left: number } | null;
  select(from: number, to: number): void;
  apply(edit: Edit): void;
  configure(c: { placeholder: string; readOnly: boolean; disabled: boolean; attrs: Record<string, string> }): void;
  destroy(): void;
}

// Every colour, font and size is a Capsomer token, so both themes and every density follow
// without a second copy. The focus ring sits inside the surface, which clips overflow: an
// outside ring would be cut off (WCAG 2.4.7).
const capTheme = EditorView.theme({
  "&": {
    // Colour and ground come from the frame around it (markdown-editor.css), so read-only and
    // disabled change them there, in one place.
    color: "inherit",
    backgroundColor: "transparent",
    fontSize: "var(--text-size)",
    maxHeight: "var(--cap-md-max, min(70vh, 48rem))",
  },
  "&.cm-focused": {
    outline: "var(--ring-width) solid var(--ring)",
    outlineOffset: "calc(-1 * var(--ring-width))",
  },
  ".cm-scroller": {
    overflow: "auto",
    fontFamily: "var(--mono)",
    lineHeight: "1.65",
  },
  ".cm-content": {
    caretColor: "var(--accent)",
    padding: "var(--pad-y) 0",
    minHeight: "var(--cap-md-min, 16rem)",
  },
  ".cm-line": { padding: "0 var(--pad-x)" },
  ".cm-gutters": {
    backgroundColor: "var(--sunken)",
    color: "var(--muted)",
    border: "none",
    borderRight: "1px solid var(--line)",
  },
  // The selection is the accent mixed into the surface: the pale --sel token is nearly the
  // surface colour and would not show where the selection is.
  "& .cm-content ::selection, & .cm-content::selection": {
    backgroundColor: "color-mix(in srgb, var(--accent) 36%, var(--surface))",
    color: "var(--text)",
  },
  ".cm-placeholder": { color: "var(--dim)" },
});

// Meaning is never colour alone: headings and strong are bold, emphasis is italic, links are
// underlined, quotes are italic. Each colour is a token chosen to reach 4.5:1 on --surface.
const capHighlight = HighlightStyle.define([
  { tag: tags.heading, color: "var(--text)", fontWeight: "700" },
  { tag: tags.strong, color: "var(--text)", fontWeight: "700" },
  { tag: tags.emphasis, color: "var(--text)", fontStyle: "italic" },
  { tag: tags.link, color: "var(--accent-text)", textDecoration: "underline" },
  { tag: tags.url, color: "var(--accent-text)" },
  { tag: tags.monospace, color: "var(--info)" },
  { tag: tags.quote, color: "var(--muted)", fontStyle: "italic" },
  { tag: tags.list, color: "var(--muted)" },
  { tag: tags.meta, color: "var(--muted)" },
  { tag: tags.processingInstruction, color: "var(--muted)" },
  { tag: tags.contentSeparator, color: "var(--muted)" },
  { tag: tags.strikethrough, color: "var(--muted)", textDecoration: "line-through" },
]);

export function createSurface(cfg: SurfaceConfig): Surface {
  const attrsSlot = new Compartment();
  const editableSlot = new Compartment();
  const placeholderSlot = new Compartment();

  const attrExt = (attrs: Record<string, string>) =>
    EditorView.contentAttributes.of({ role: "textbox", "aria-multiline": "true", spellcheck: "true", ...attrs });
  const editableExt = (readOnly: boolean, disabled: boolean) => [
    EditorView.editable.of(!disabled),
    EditorState.readOnly.of(readOnly || disabled),
  ];

  const view: EditorView = new EditorView({
    parent: cfg.parent,
    state: EditorState.create({
      doc: cfg.doc,
      extensions: [
        // Without the nonce a strict style-src drops every style CodeMirror injects.
        EditorView.cspNonce.of(cfg.nonce),
        history(),
        markdown({ base: markdownLanguage }),
        syntaxHighlighting(capHighlight),
        capTheme,
        EditorView.lineWrapping,
        cfg.lineNumbers ? lineNumbers() : [],
        attrsSlot.of(attrExt(cfg.attrs)),
        editableSlot.of(editableExt(cfg.readOnly, cfg.disabled)),
        placeholderSlot.of(cmPlaceholder(cfg.placeholder)),
        EditorView.updateListener.of((u) => {
          if (u.docChanged) cfg.onDocChange(u.state.doc.toString());
          if (u.docChanged || u.selectionSet) cfg.onCaret();
        }),
        EditorView.domEventHandlers({
          paste(event) {
            const item = [...(event.clipboardData?.items ?? [])].find((i) => i.type.startsWith("image/"));
            const file = item?.getAsFile();
            if (!file || !cfg.onFile(file)) return false;
            event.preventDefault();
            return true;
          },
          drop(event) {
            const file = [...(event.dataTransfer?.files ?? [])].find((f) => f.type.startsWith("image/"));
            if (!file || !cfg.onFile(file)) return false;
            event.preventDefault();
            return true;
          },
        }),
        // Tab is not bound: it leaves the editor, so the surface is no keyboard trap (WCAG 2.1.2).
        keymap.of([
          { key: "Mod-b", run: () => cfg.onKey("bold"), preventDefault: true },
          { key: "Mod-i", run: () => cfg.onKey("italic"), preventDefault: true },
          { key: "Mod-k", run: () => cfg.onKey("link"), preventDefault: true },
          { key: "Mod-e", run: () => cfg.onKey("code"), preventDefault: true },
          { key: "Mod-s", run: () => cfg.onKey("save"), preventDefault: true },
          { key: "Escape", run: () => cfg.onKey("escape") },
          { key: "ArrowDown", run: () => cfg.onKey("down") },
          ...historyKeymap,
          ...defaultKeymap,
        ]),
      ],
    }),
  });

  return {
    getValue: () => view.state.doc.toString(),
    setValue(value) {
      const current = view.state.doc.toString();
      if (current === value) return;
      view.dispatch({ changes: { from: 0, to: current.length, insert: value } });
    },
    focus: () => view.focus(),
    hasFocus: () => view.hasFocus,
    selection() {
      const { from, to } = view.state.selection.main;
      return { from, to };
    },
    caret() {
      const head = view.state.selection.main.head;
      const line = view.state.doc.lineAt(head);
      return { head, lineFrom: line.from, lineTo: line.to, lineText: line.text };
    },
    coords(pos) {
      const c = view.coordsAtPos(pos);
      return c ? { top: c.top, bottom: c.bottom, left: c.left } : null;
    },
    select(from, to) {
      view.dispatch({ selection: { anchor: from, head: to } });
    },
    apply(edit) {
      view.dispatch({
        changes: edit.changes,
        selection: { anchor: edit.anchor, head: edit.head ?? edit.anchor },
        scrollIntoView: true,
        userEvent: "input",
      });
      view.focus();
    },
    configure(c) {
      view.dispatch({
        effects: [
          attrsSlot.reconfigure(attrExt(c.attrs)),
          editableSlot.reconfigure(editableExt(c.readOnly, c.disabled)),
          placeholderSlot.reconfigure(cmPlaceholder(c.placeholder)),
        ],
      });
    },
    destroy: () => view.destroy(),
  };
}
