import { Editor, type AnyExtension, type JSONContent } from "@tiptap/core";
import type { EditorState } from "@tiptap/pm/state";
import { type ImageDescription, type LinkTarget, type Scaffold } from "../markdown-editor/markdown-editor.ts";
import { type Dialect } from "./rich-editor-markdown.mjs";
export type RichEditorHandle = {
    /** Puts Markdown (a figure, an image) in as blocks at the cursor, as the editor's own blocks are put. */
    insertMarkdown: (markdown: string) => void;
    focus: () => void;
    /** The editor itself, for the room's panels (comments, suggestions). */
    editor: Editor;
};
/**
 * The room an editor is in, as the collab editor's useRoomEditing makes it. The editor knows nothing of
 * Yjs: the room gives it its extensions, the Markdown of a document, and a step to run after each change
 * of `syncKey` (suggesting on or off, the carets and the comment marks drawn again).
 */
export type RichRoom = {
    /** Made once per editor: the binding to the room's copy and what draws the others' work in it. */
    extensions: () => AnyExtension[];
    /** The Markdown a document stands for, with the room's bookkeeping. */
    markdown: (json: JSONContent) => string;
    /** Source blocks are read only (while suggesting, which cannot mark Markdown). */
    sourceLocked: (state: EditorState) => boolean;
    /** Brings the editor in step with the room; run once it is made and whenever `syncKey` changes. */
    sync: (editor: Editor) => void;
    syncKey: string;
    /** Front matter edited in its own fields, so the text does not show it a second time. */
    hideFrontMatter: boolean;
};
export type RichEditorProps = {
    /** What the editing surface is called to a screen reader, for example "Post, formatted". */
    ariaLabel: string;
    value: string;
    onChange: (next: string) => void;
    readOnly: boolean;
    dialect: Dialect;
    placeholder?: string;
    scaffolds?: Scaffold[];
    linkTargets?: LinkTarget[];
    /** Called once the image is described, as Capsomer's markdown editor calls it. */
    onUpload?: (file: File, image: ImageDescription, signal: AbortSignal) => Promise<{
        url: string;
    }>;
    imageMarkdown?: (image: {
        url: string;
        alt: string;
        decorative: boolean;
        name: string;
    }) => string;
    accept?: string;
    onReady?: (handle: RichEditorHandle) => void;
    room?: RichRoom;
};
export declare function RichEditor(props: RichEditorProps): import("react").JSX.Element;
