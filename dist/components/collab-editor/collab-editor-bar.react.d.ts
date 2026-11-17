import type { RoomPerson } from "./collab-editor-protocol.ts";
import { type RoomStatus } from "./collab-editor-room.ts";
export type WriteMode = "edit" | "suggest";
export declare function RoomBar({ people, me, status, mayEdit, mode, onMode, pending, }: {
    people: RoomPerson[];
    me: number;
    status: RoomStatus;
    mayEdit: boolean;
    mode: WriteMode;
    onMode: (mode: WriteMode) => void;
    /** Suggestions waiting, for the line a suggester reads. */
    pending: number;
}): import("react").JSX.Element;
