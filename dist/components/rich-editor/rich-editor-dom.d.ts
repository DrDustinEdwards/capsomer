import type { Editor } from "@tiptap/core";
import type { EditorView } from "@tiptap/pm/view";
import type { Scaffold } from "../markdown-editor/markdown-editor.ts";
import type { VirtualAnchor } from "../popover/popover.ts";
export declare function caretAnchor(editor: Editor, pos: number): VirtualAnchor;
/** Focus lands inside the new block's Markdown, where the block says (for example inside alt=""). */
export declare function focusSourceBlock(editor: Editor, s: Scaffold): void;
/**
 * Pasted HTML, parsed in an inert document (no script runs, nothing loads) through Capsomer's policy and
 * read by the editor's schema, which keeps only what it knows. ProseMirror's own paste would give the
 * string to the page's default Trusted Types policy, which escapes markup, so a formatted paste would
 * arrive as tags in the text.
 */
export declare function pasteHtml(view: EditorView, html: string): void;
