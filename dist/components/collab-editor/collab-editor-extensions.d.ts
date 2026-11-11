import { Extension } from "@tiptap/core";
import { PluginKey, type EditorState } from "@tiptap/pm/state";
import { DecorationSet } from "@tiptap/pm/view";
import type { Awareness } from "y-protocols/awareness";
import { type Suggester } from "./collab-editor-suggest.ts";
/** A caret's person: their name and their color's slot (collab-editor-room.ts `personSlot`). */
export type Who = (clientId: number) => {
    name: string;
    slot: number;
} | null;
export declare function roomCarets(awareness: Awareness, who: () => Who): Extension<any, any>;
/** Draws the carets again, after the room's list of people changed. */
export declare function refreshCarets(state: EditorState): import("prosemirror-state").Transaction;
/** Suggesting: each change this editor makes becomes a suggestion of the person's, while it is on. */
export declare function suggesting(suggester: Suggester): Extension<any, any>;
export type Anchored = {
    id: string;
    anchor: string | null;
};
export declare const commentsKey: PluginKey<DecorationSet>;
/** Where a selection sits in the shared copy, so it stays put as people type around it. Null with no binding yet. */
export declare function anchorOf(state: EditorState, from: number, to: number): string | null;
/** Where a thread's text is now, or null when that text is gone. */
export declare function rangeOf(state: EditorState, anchor: string | null): {
    from: number;
    to: number;
} | null;
/** Marks each open thread's text; the one open in the panel is marked more strongly. A click on a mark opens its thread. */
export declare function commentMarks(get: () => {
    threads: Anchored[];
    active: string | null;
}, onClick: (id: string) => void): Extension<any, any>;
