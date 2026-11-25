// The formatted editor's helpers that read or move the ProseMirror view (rich-editor.react.tsx).
import type { Editor } from "@tiptap/core";
import { DOMParser as SchemaParser } from "@tiptap/pm/model";
import type { EditorView } from "@tiptap/pm/view";
import type { Scaffold } from "../markdown-editor/markdown-editor.ts";
import type { VirtualAnchor } from "../popover/popover.ts";
import { inertDocument } from "../trusted-html/trusted-html.ts";

// A popup's anchor at a document position: the caret's box there, read each time it is placed.
export function caretAnchor(editor: Editor, pos: number): VirtualAnchor {
  return {
    getBoundingClientRect: () => {
      const at = editor.view.coordsAtPos(pos);
      return new DOMRect(at.left, at.top, 0, at.bottom - at.top);
    },
  };
}

/** Focus lands inside the new block's Markdown, where the block says (for example inside alt=""). */
export function focusSourceBlock(editor: Editor, s: Scaffold) {
  requestAnimationFrame(() => {
    const areas = [
      ...editor.view.dom.querySelectorAll<HTMLTextAreaElement>(".cap-rich-editor-src-text"),
    ];
    const area =
      areas.find((a) => a.value === s.text && document.activeElement !== a) ?? areas.at(-1);
    if (!area) return;
    area.focus();
    const at = s.cursorAfter
      ? s.text.indexOf(s.cursorAfter) + s.cursorAfter.length
      : (s.cursor ?? s.text.length);
    area.setSelectionRange(at, at);
  });
}

/**
 * Pasted HTML, parsed in an inert document (no script runs, nothing loads) through Capsomer's policy and
 * read by the editor's schema, which keeps only what it knows. ProseMirror's own paste would give the
 * string to the page's default Trusted Types policy, which escapes markup, so a formatted paste would
 * arrive as tags in the text.
 */
export function pasteHtml(view: EditorView, html: string) {
  const body = inertDocument(html).body;
  let slice = SchemaParser.fromSchema(view.state.schema).parseSlice(body, {
    preserveWhitespace: true,
  });
  view.someProp("transformPasted", (f) => {
    slice = f(slice, view, false);
  });
  view.dispatch(
    view.state.tr
      .replaceSelection(slice)
      .scrollIntoView()
      .setMeta("paste", true)
      .setMeta("uiEvent", "paste"),
  );
}
