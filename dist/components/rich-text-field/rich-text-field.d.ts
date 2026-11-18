/** The tags a field may allow. Each is inline and takes no attribute. */
export declare const RICH_TEXT_TAGS: readonly ["em", "strong", "sup", "sub", "code"];
export type RichTextTag = (typeof RICH_TEXT_TAGS)[number];
/** One node of a sanitized text: a run of plain text, or an allowed tag around more nodes. */
export type RichTextNode = string | {
    tag: RichTextTag;
    children: RichTextNode[];
};
/** `text` with its character references read (numeric, and the names above); an unknown name stays as written. */
export declare function decodeEntities(text: string): string;
/**
 * `input` (HTML, or plain text with stray < and &) as a tree of plain text and the `allowed` tags only: any other tag
 * is dropped and its text kept, attributes and comments are dropped, `<i>` reads as `em` and `<b>` as `strong`, and
 * the tags are balanced (one closed out of order closes and reopens the ones inside it). Text in `<script>` and
 * `<style>` is dropped with them.
 */
export declare function parseRichText(input: string, allowed: readonly RichTextTag[]): RichTextNode[];
/** A tree as HTML: text escaped, tags bare. */
export declare function serializeRichText(nodes: readonly RichTextNode[]): string;
/** `input` kept to the `allowed` tags, well formed, with the ends trimmed: what a server stores. */
export declare function sanitizeRichText(input: string, allowed: readonly RichTextTag[]): string;
/** The plain text of a field's value, for counting, search and plain-text email. */
export declare function richTextPlain(html: string): string;
/** The words in a field's value. */
export declare function richTextWords(html: string): number;
/** Whether a field's value has no text. */
export declare function isEmptyRichText(html: string): boolean;
/** A tree as DOM nodes, for the browser: built with createElement and text nodes, never parsed from a string. */
export declare function richTextNodes(doc: Document, nodes: readonly RichTextNode[]): Node[];
/** The tags that hold `node` inside `root`, innermost first. */
export declare function tagsAround(node: Node | null, root: Element): RichTextTag[];
/**
 * Toggles `tag` over the selection inside `root`: where the selection sits inside that tag, the tag is taken off
 * (its text stays); otherwise the selected text is wrapped in it and stays selected. A collapsed selection, or one
 * outside `root`, does nothing. Returns whether anything changed.
 */
export declare function toggleTag(root: Element, tag: RichTextTag, selection: Selection | null): boolean;
/** Puts `nodes` where the selection is inside `root`, replacing what is selected, and the caret after them. */
export declare function insertNodes(root: Element, nodes: Node[], selection: Selection | null): boolean;
