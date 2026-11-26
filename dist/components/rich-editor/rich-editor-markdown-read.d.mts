/**
 * A file as the editor's document: one top-level node per block, each with its origin.
 * @param {string} source
 * @param {Dialect} dialect
 * @returns {Loaded}
 */
export function toDoc(source: string, dialect: Dialect): Loaded;
/**
 * A node with its origins taken out, as a string: two blocks with the same print are the same text.
 * @param {JsonNode} node
 */
export function print(node: JsonNode): string;
/**
 * The prints of a freshly loaded document's blocks, by origin id. Taken from the editor's own nodes
 * after loading, so whatever the editor's schema fills in is in both sides of the comparison.
 * @param {JsonNode} doc
 */
export function fingerprints(doc: JsonNode): Map<number, string>;
/** The fields that carry meaning, so a check by parsing ignores the defaults the editor adds. */
/** @param {JsonNode} node @returns {any} */
export function canon(node: JsonNode): any;
/**
 * Whether two blocks hold the same text and formatting, ignoring origins, the defaults the editor
 * fills in, and whitespace moved out of bold or italic.
 * @param {JsonNode} a
 * @param {JsonNode} b
 */
export function sameBlock(a: JsonNode, b: JsonNode): boolean;
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
export const MARK_ORDER: string[];
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
