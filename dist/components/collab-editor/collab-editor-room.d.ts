import YProvider from "y-partyserver/provider";
import * as Y from "yjs";
import { type Patched } from "./collab-editor-doc.ts";
import type { ClientMessage, RoomComment, RoomPerson } from "./collab-editor-protocol.ts";
export type RoomStatus = "connecting" | "connected" | "offline";
export type Room = {
    doc: Y.Doc;
    provider: YProvider;
    /** The copy has arrived from the room: the editor may be made. */
    synced: boolean;
    status: RoomStatus;
    /** The Markdown the shared copy stands for, suggestions left out: what a save writes. */
    source: string;
    /** The shared copy differs from what was last saved or loaded. */
    unsaved: boolean;
    people: RoomPerson[];
    comments: RoomComment[];
    /** The last thing the room said that the page should say: a refusal, a replacement, an error. */
    notice: string | null;
    /** Counts each fresh start, so the editor is made again over the new copy. */
    generation: number;
    send: (message: Exclude<ClientMessage, {
        t: "flush";
    }>) => void;
    /** Resolves once the room has every change made here so far, before a save reads it. */
    flush: () => Promise<void>;
    /** Markdown typed in the Markdown view, or a front matter field, into the shared copy. */
    setSource: (markdown: string) => Patched;
};
export declare function useRoom(path: string, initial: string, initiallyUnsaved: boolean): Room;
/** A person's color in the room, the same on every screen: one of eight, set in collab-editor.css by `data-who`. */
export declare const personSlot: (id: number) => number;
