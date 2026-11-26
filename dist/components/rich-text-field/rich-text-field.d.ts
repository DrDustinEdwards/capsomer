export declare const RICH_TEXT_TAGS: readonly ["em", "strong", "sup", "sub", "code"];
export type RichTextTag = (typeof RICH_TEXT_TAGS)[number];
export type RichTextNode = string | {
    tag: RichTextTag;
    children: RichTextNode[];
};
export declare function decodeEntities(text: string): string;
export declare const RICH_TEXT_MAX_INPUT = 50000;
/**
 * `input` as a tree of plain text and the `allowed` tags only: other tags are dropped (text kept),
 * `<i>` reads as `em` and `<b>` as `strong`, tags are balanced, script and style text is dropped.
 * Input past RICH_TEXT_MAX_INPUT characters is not read.
 */
export declare function parseRichText(input: string, allowed: readonly RichTextTag[]): RichTextNode[];
export declare function serializeRichText(nodes: readonly RichTextNode[]): string;
export declare function sanitizeRichText(input: string, allowed: readonly RichTextTag[]): string;
export declare function richTextPlain(html: string): string;
export declare function richTextWords(html: string): number;
export declare function isEmptyRichText(html: string): boolean;
export declare function richTextNodes(doc: Document, nodes: readonly RichTextNode[]): Node[];
export declare function tagsAround(node: Node | null, root: Element): RichTextTag[];
/** Toggles `tag` over the selection inside `root`. Returns whether anything changed. */
export declare function toggleTag(root: Element, tag: RichTextTag, selection: Selection | null): boolean;
export declare function insertNodes(root: Element, nodes: Node[], selection: Selection | null): boolean;
