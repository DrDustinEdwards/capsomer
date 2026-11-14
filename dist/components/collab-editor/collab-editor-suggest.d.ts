import type { Node as PmNode, Schema } from "@tiptap/pm/model";
import { EditorState, Plugin, type Transaction } from "@tiptap/pm/state";
export declare const SUGGESTION_TYPES: ReadonlySet<string>;
type MarkJson = {
    type: string;
    attrs?: Record<string, unknown>;
};
export type JsonDoc = {
    type: string;
    attrs?: Record<string, unknown>;
    content?: JsonDoc[];
    marks?: MarkJson[];
    text?: string;
};
/**
 * The document as it stands with every pending suggestion rejected and no trace of them left: what a
 * save writes. Takes JSON (the editor's, or the room's out of Yjs) and gives JSON.
 */
export declare function settle(schema: Schema, json: JsonDoc): JsonDoc;
/** How many characters (and whole blocks) each person has suggested, by person id. */
export declare function suggestionCounts(schema: Schema, json: JsonDoc): Map<string, number>;
export type Suggester = {
    /** The person's id, as a string, the same on every mark they make. */
    by: string;
    /** This editor's Yjs client id, so the ids it makes cannot collide with anyone else's. */
    clientId: number;
    /** The revision round new changes go in, or null for none. */
    round: () => string | null;
};
/**
 * The dispatch step for suggesting: a transaction from this editor becomes the suggestion of it,
 * owned and dated. One from the room, or from undo, passes as it is, as does any while suggesting is off.
 */
export declare function suggestingDispatch(s: Suggester): (state: EditorState, tr: Transaction) => Transaction;
/** The library's plugin (on or off, the decorations, the arrow keys over its markers) and the mirror. */
export declare function suggestionPlugins(): Plugin[];
export type Suggestion = {
    /** id and person together: one person's one change. */
    key: string;
    id: string;
    by: string;
    round: string | null;
    at: string | null;
    inserted: string;
    deleted: string;
    /** Some formatting or a block's kind changed, with no text added or taken out. */
    formatting: boolean;
    from: number;
    to: number;
};
/** Every pending change in the document, in reading order. */
export declare function listSuggestions(doc: PmNode): Suggestion[];
export {};
