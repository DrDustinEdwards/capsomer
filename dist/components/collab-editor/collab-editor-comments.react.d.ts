import type { Editor } from "@tiptap/core";
import type { ClientMessage, RoomComment, RoomViewer } from "./collab-editor-protocol.ts";
type Send = (message: Exclude<ClientMessage, {
    t: "flush";
}>) => void;
export declare function CommentsPanel({ comments, me, send, editor, active, onActive, id, }: {
    /** The panel's id, unique on the page. */
    id?: string;
    comments: RoomComment[];
    me: RoomViewer;
    send: Send;
    editor: Editor | null;
    active: string | null;
    onActive: (id: string | null) => void;
}): import("react").JSX.Element;
export {};
