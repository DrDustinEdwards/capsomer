import type { Editor } from "@tiptap/core";
import type { Awareness } from "y-protocols/awareness";
import type * as Y from "yjs";
import type { RichRoom } from "../rich-editor/rich-editor.react.tsx";
import { type WriteMode } from "./collab-editor-bar.react.tsx";
import type { RoomComment, RoomPerson, RoomViewer } from "./collab-editor-protocol.ts";
import { type Room } from "./collab-editor-room.ts";
export { RoomBar, type WriteMode } from "./collab-editor-bar.react.tsx";
export { CommentsPanel } from "./collab-editor-comments.react.tsx";
export { SuggestionsPanel } from "./collab-editor-suggestions.react.tsx";
export { personSlot, useRoom, type Room, type RoomStatus } from "./collab-editor-room.ts";
export type RoomEditing = {
    room: Room;
    /** The rich editor's `room` once the room's copy has arrived; null before. Remount the editor on `key`. */
    rich: (RichRoom & {
        key: string;
    }) | null;
    editor: Editor | null;
    setEditor: (editor: Editor | null) => void;
    /** Suggestions waiting in the text. */
    pending: number;
    /** Why a Markdown view only shows the text, or null when it may edit it. */
    markdownLocked: string | null;
    bar: React.ReactNode;
    panels: React.ReactNode;
};
export type RoomEditingOptions = {
    /** The room's address on this host (y-partyserver's prefix and room). */
    path: string;
    /** The text as the server read it, shown before the room's copy arrives. */
    initial: string;
    /** The room had unsaved changes when the page was read. */
    unsaved: boolean;
    viewer: RoomViewer;
    /** People by id, for whose a suggestion is. */
    names: Record<string, string>;
    /** Front matter is edited in its own fields, so the text does not show it a second time. */
    hideFrontMatter: boolean;
    /** Editing or Suggesting, as this person last chose; someone who may only suggest always suggests. */
    mode: WriteMode;
    onMode: (mode: WriteMode) => void;
    /** The revision round new suggestions go in, or "" for none. */
    round: string;
    onRound: (round: string) => void;
};
export type RichRoomOptions = {
    /** The room's copy, once it has arrived; null before. */
    doc: Y.Doc | null;
    awareness: Awareness | null;
    people: RoomPerson[];
    comments: RoomComment[];
    /** This person's id, as the suggestions they make carry it. */
    by: string;
    /** Typing makes suggestions. */
    suggest: boolean;
    round: string;
    /** The thread open in the comments panel, and choosing one by clicking its mark in the text. */
    active: string | null;
    onActive: (id: string) => void;
    hideFrontMatter: boolean;
};
/**
 * The rich editor's `room` for a Yjs copy: the binding, the others' carets under the names the room
 * gives, suggesting as this person, and the open threads marked. useRoomEditing uses it over a
 * y-partyserver room; any other provider (or two copies in one page) can use it directly.
 */
export declare function useRichRoom(options: RichRoomOptions): RichRoom | null;
export declare function useRoomEditing(options: RoomEditingOptions): RoomEditing;
/** The suggestions waiting in an editor's text, counted again on each change. */
export declare function usePending(editor: Editor | null): number;
