/**
 * The extensions every editor and the round-trip check share. In a file's room, undo is the shared
 * copy's (Collaboration's), which takes back only this person's own changes.
 * @param {{ room?: boolean }} [options]
 */
export function baseExtensions(options?: {
    room?: boolean;
}): (Extension<any, any> | Mark<any, any> | Node<any, any> | Node<import("@tiptap/extension-list").ListItemOptions, any> | Extension<import("@tiptap/starter-kit").StarterKitOptions, any>)[];
/** The schema alone, for checking and normalizing JSON without an editor. */
export function editorSchema(): import("prosemirror-model").Schema<any, any>;
/** The block types a whole-block suggestion can sit on: every block the editor has. */
export const SUGGESTION_BLOCKS: string[];
export const SourceBlock: Node<any, any>;
export const SourceInline: Node<any, any>;
import { Extension } from "@tiptap/core";
import { Mark } from "@tiptap/core";
import { Node } from "@tiptap/core";
