/** Who a connection is: set by the app's server when it lets the connection in, never by the browser. */
export type RoomViewer = {
    id: number;
    name: string;
    /** Changes the text, or only suggests. */
    access: "edit" | "suggest";
    /** Deletes anyone's comment, not only their own (an app's owner). */
    deletesAny?: boolean;
};
/** One comment as everyone in the room sees it. */
export type RoomComment = {
    id: string;
    parentId: string | null;
    personId: number;
    name: string;
    body: string;
    /** Where a thread sits: Yjs relative positions of its start and end, as JSON. Null on a reply. */
    anchor: string | null;
    quote: string;
    createdAt: string;
    editedAt: string | null;
    resolvedAt: string | null;
};
export type RoomPerson = {
    conn: string;
    id: number;
    name: string;
    access: RoomViewer["access"];
    clients: number[];
};
export type ServerMessage = {
    t: "people";
    people: RoomPerson[];
} | {
    t: "comments";
    comments: RoomComment[];
} | {
    t: "flushed";
    n: number;
} | {
    t: "refused";
    reason: string;
} | {
    t: "replaced";
    by: string;
} | {
    t: "error";
    message: string;
};
export type ClientMessage = {
    t: "flush";
    n: number;
} | {
    t: "comment";
    body: string;
    anchor: string | null;
    quote: string;
    parentId?: string | null;
} | {
    t: "comment-edit";
    id: string;
    body: string;
} | {
    t: "comment-resolve";
    id: string;
    resolved: boolean;
} | {
    t: "comment-delete";
    id: string;
};
