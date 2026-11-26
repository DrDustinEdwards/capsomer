/**
 * A changed block, spelled and then checked: what was written must parse back to the same block.
 * When the light escaping does not survive, every punctuation mark in the text is escaped.
 * @param {JsonNode} block
 * @param {Dialect} dialect
 */
export function writeChecked(block: JsonNode, dialect: Dialect): any;
/**
 * The file the editor's document stands for. A block the editor did not change is written as the
 * bytes it was read from, with the bytes that came before it; a changed one keeps the bytes before
 * it and is spelled again; a new one follows a blank line.
 * @param {JsonNode} doc the editor's document as JSON
 * @param {string} tail what followed the last block when the file was read
 * @param {Map<number, string>} prints the blocks as they were loaded (fingerprints)
 * @param {Dialect} dialect
 */
export function fromDoc(doc: JsonNode, tail: string, prints: Map<number, string>, dialect: Dialect): string;
/**
 * Markdown pasted as plain text, as blocks with no origin: they are new, and are spelled on save.
 * @param {string} text
 * @param {Dialect} dialect
 * @returns {JsonNode[]}
 */
export function pastedBlocks(text: string, dialect: Dialect): JsonNode[];
export * from "./rich-editor-markdown-read.mjs";
export type Dialect = import("./rich-editor-markdown-read.mjs").Dialect;
export type MdOrigin = import("./rich-editor-markdown-read.mjs").MdOrigin;
export type JsonNode = import("./rich-editor-markdown-read.mjs").JsonNode;
export type JsonMark = import("./rich-editor-markdown-read.mjs").JsonMark;
