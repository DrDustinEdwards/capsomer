import { type MarkdownEditorHandle, type MarkdownEditorOptions } from "./markdown-editor-edits.ts";
export { rovingIndex } from "../toolbar/toolbar.ts";
export { countWords, minutesForWords, looksLikeUrl, filterLinkTargets, lineBounds, wrapEdit, headingEdit, footnoteEdit, blockEdit, slashBlockEdit, scaffoldCursor, linkEdit, defaultImageMarkdown } from "./markdown-editor-edits.ts";
export type { Edit, LinkTarget, Scaffold, UploadResult, MarkdownEditorOptions, MarkdownEditorHandle } from "./markdown-editor-edits.ts";
export declare function mountMarkdownEditor(host: HTMLElement, options?: MarkdownEditorOptions): Promise<MarkdownEditorHandle>;
export declare function getMarkdownEditor(host: Element): MarkdownEditorHandle | undefined;
export declare function enhance(root?: ParentNode, options?: MarkdownEditorOptions): () => void;
