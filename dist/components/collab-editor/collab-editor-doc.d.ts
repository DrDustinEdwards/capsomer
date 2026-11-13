import * as Y from "yjs";
import { type Dialect } from "../rich-editor/rich-editor-markdown.mjs";
import { type JsonDoc } from "./collab-editor-suggest.ts";
export declare const FRAGMENT = "default";
export declare const META = "carrel";
export type RoomMeta = {
    version: string | null;
    tail: string;
    dialect: Dialect;
    /** The Markdown as last saved, or as it was when the copy was loaded: no unsaved change when equal. */
    saved: string;
};
/** The editor's schema, built once: the room's server has no editor to ask. */
export declare function roomSchema(): import("prosemirror-model").Schema<any, any>;
export declare function isSeeded(ydoc: Y.Doc): boolean;
export declare function readMeta(ydoc: Y.Doc): RoomMeta;
/**
 * Puts `markdown` in as the whole document, keeping the blocks that are already the same, and starts
 * the save's bookkeeping from it. The first load of a room and every replacement both come here.
 * `saved` is the text as the site or Git holds it, when that differs (a room started from a draft).
 */
export declare function loadMarkdown(ydoc: Y.Doc, input: {
    markdown: string;
    version: string | null;
    dialect?: Dialect;
    saved?: string;
}): void;
export type Patched = {
    ok: true;
    changed: boolean;
} | {
    ok: false;
    reason: "suggestions";
};
/**
 * Takes Markdown typed in the Markdown view (or a front matter field) into the shared copy, changing
 * only the blocks whose bytes differ, so the others keep their place, their comments and their
 * suggestions. Refused when a block it would change holds a pending suggestion, which Markdown cannot
 * show: those are accepted or rejected first.
 */
export declare function patchMarkdown(ydoc: Y.Doc, markdown: string): Patched;
/** After a save: the version it made, and the text it wrote, so nothing reads as unsaved. */
export declare function markSaved(ydoc: Y.Doc, version: string | null, markdown: string): void;
/** The editor's document as JSON, straight out of the shared copy, suggestions and all. */
export declare function roomJson(ydoc: Y.Doc): JsonDoc;
/** The Markdown the shared copy stands for, with every pending suggestion left out: what a save writes. */
export declare function roomMarkdown(ydoc: Y.Doc): string;
/** The Markdown for a document an editor holds as JSON, with the room's bookkeeping. */
export declare function markdownOf(ydoc: Y.Doc, editorJson: JsonDoc): string;
