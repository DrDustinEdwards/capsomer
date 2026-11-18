/**
 * A file as the editor's document: one top-level node per block, each with its origin.
 * @param {string} source
 * @param {Dialect} dialect
 * @returns {Loaded}
 */
export function toDoc(source: string, dialect: Dialect): Loaded;
/**
 * The prints of a freshly loaded document's blocks, by origin id. Taken from the editor's own nodes
 * after loading, so whatever the editor's schema fills in is in both sides of the comparison.
 * @param {JsonNode} doc
 */
export function fingerprints(doc: JsonNode): Map<number, string>;
/**
 * Whether two blocks hold the same text and formatting, ignoring origins, the defaults the editor
 * fills in, and whitespace moved out of bold or italic.
 * @param {JsonNode} a
 * @param {JsonNode} b
 */
export function sameBlock(a: JsonNode, b: JsonNode): boolean;
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
/**
 * "site": a site's Markdown, with the directives and math dustinedwards.info renders.
 * "plain": a book file, which is CommonMark with GFM and a header.
 * @typedef {"site" | "plain"} Dialect
 * @typedef {{ id: number, source: string, before: string }} MdOrigin
 * @typedef {{ type: string, attrs?: Record<string, any>, content?: JsonNode[], text?: string, marks?: JsonMark[] }} JsonNode
 * @typedef {{ type: string, attrs?: Record<string, any> }} JsonMark
 * @typedef {{ doc: JsonNode, tail: string }} Loaded
 */
/** The node types that may hold a block's origin. */
export const BLOCK_TYPES: string[];
/**
 * "site": a site's Markdown, with the directives and math dustinedwards.info renders.
 * "plain": a book file, which is CommonMark with GFM and a header.
 */
export type Dialect = "site" | "plain";
/**
 * "site": a site's Markdown, with the directives and math dustinedwards.info renders.
 * "plain": a book file, which is CommonMark with GFM and a header.
 */
export type MdOrigin = {
    id: number;
    source: string;
    before: string;
};
/**
 * "site": a site's Markdown, with the directives and math dustinedwards.info renders.
 * "plain": a book file, which is CommonMark with GFM and a header.
 */
export type JsonNode = {
    type: string;
    attrs?: Record<string, any>;
    content?: JsonNode[];
    text?: string;
    marks?: JsonMark[];
};
/**
 * "site": a site's Markdown, with the directives and math dustinedwards.info renders.
 * "plain": a book file, which is CommonMark with GFM and a header.
 */
export type JsonMark = {
    type: string;
    attrs?: Record<string, any>;
};
/**
 * "site": a site's Markdown, with the directives and math dustinedwards.info renders.
 * "plain": a book file, which is CommonMark with GFM and a header.
 */
export type Loaded = {
    doc: JsonNode;
    tail: string;
};
