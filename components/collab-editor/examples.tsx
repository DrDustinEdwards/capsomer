// Mounts the collab editor's specimens: two rich editors over two Yjs copies kept in step inside the
// page, standing in for two browsers and a room, with the room's people and comments held here.
// startPage() runs first, as in a site's client entry.
import { startPage } from "@dustinedwards/site-runtime/page-client";
import type { Editor } from "@tiptap/core";
import { StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { Awareness, applyAwarenessUpdate, encodeAwarenessUpdate } from "y-protocols/awareness";
import * as Y from "yjs";

import { RichEditor } from "../rich-editor/rich-editor.react.tsx";
import { RoomBar } from "./collab-editor-bar.react.tsx";
import { CommentsPanel } from "./collab-editor-comments.react.tsx";
import { loadMarkdown } from "./collab-editor-doc.ts";
import type {
  ClientMessage,
  RoomComment,
  RoomPerson,
  RoomViewer,
} from "./collab-editor-protocol.ts";
import { SuggestionsPanel } from "./collab-editor-suggestions.react.tsx";
import { usePending, useRichRoom } from "./collab-editor.react.tsx";

startPage();

const text = `## Field notes

The spring update moves the checks to the edge.

A quiet hour is the default.
`;

// Two copies, as two browsers hold them, kept the same as a room would keep them.
const docs = [new Y.Doc(), new Y.Doc()] as const;
loadMarkdown(docs[0], { markdown: text, version: "v1", dialect: "site" });
Y.applyUpdate(docs[1], Y.encodeStateAsUpdate(docs[0]));
docs[0].on("update", (u: Uint8Array, origin: unknown) => {
  if (origin !== "peer") Y.applyUpdate(docs[1], u, "peer");
});
docs[1].on("update", (u: Uint8Array, origin: unknown) => {
  if (origin !== "peer") Y.applyUpdate(docs[0], u, "peer");
});
const awareness = [new Awareness(docs[0]), new Awareness(docs[1])] as const;
awareness.forEach((a, i) =>
  a.on("update", ({ added, updated, removed }: Record<string, number[]>, origin: unknown) => {
    if (origin === "peer") return;
    const changed = [...added!, ...updated!, ...removed!];
    applyAwarenessUpdate(awareness[1 - i]!, encodeAwarenessUpdate(a, changed), "peer");
  }),
);

const viewers: RoomViewer[] = [
  { id: 1, name: "Alex Rivera", access: "edit", deletesAny: true },
  { id: 2, name: "Sam Lee", access: "suggest" },
];
const people: RoomPerson[] = viewers.map((v, i) => ({
  conn: `c${i}`,
  id: v.id,
  name: v.name,
  access: v.access,
  clients: [docs[i]!.clientID],
}));
const names = { "1": "Alex Rivera", "2": "Sam Lee" };

/** The room's comments, held in the page: what the room would keep and send to everyone. */
function useComments() {
  const [comments, setComments] = useState<RoomComment[]>([]);
  const send = (by: RoomViewer) => (m: Exclude<ClientMessage, { t: "flush" }>) =>
    setComments((list) => {
      if (m.t === "comment")
        return [
          ...list,
          {
            id: `k${list.length + 1}`,
            parentId: m.parentId ?? null,
            personId: by.id,
            name: by.name,
            body: m.body,
            anchor: m.anchor,
            quote: m.quote,
            createdAt: "2026-11-11T09:00:00Z",
            editedAt: null,
            resolvedAt: null,
          },
        ];
      if (m.t === "comment-resolve")
        return list.map((c) =>
          c.id === m.id ? { ...c, resolvedAt: m.resolved ? "2026-11-11T09:05:00Z" : null } : c,
        );
      if (m.t === "comment-delete") return list.filter((c) => c.id !== m.id);
      if (m.t === "comment-edit")
        return list.map((c) => (c.id === m.id ? { ...c, body: m.body } : c));
      return list;
    });
  return { comments, send };
}

function Person({
  at,
  comments,
  send,
}: {
  at: 0 | 1;
  comments: RoomComment[];
  send: (m: Exclude<ClientMessage, { t: "flush" }>) => void;
}) {
  const viewer = viewers[at]!;
  const [editor, setEditor] = useState<Editor | null>(null);
  const [active, setActive] = useState<string | null>(null);
  const [round, setRound] = useState("");
  const pending = usePending(editor);
  const mayEdit = viewer.access === "edit";
  const [mode, setMode] = useState<"edit" | "suggest">("edit");
  const suggest = !mayEdit || mode === "suggest";
  const room = useRichRoom({
    doc: docs[at],
    awareness: awareness[at],
    people,
    comments,
    by: String(viewer.id),
    suggest,
    round,
    active,
    onActive: setActive,
    hideFrontMatter: false,
  });
  // Announce this copy's caret, as a provider does.
  useEffect(() => {
    awareness[at].setLocalStateField("user", { name: viewer.name });
  }, [at, viewer.name]);
  return (
    <div className="cap-collab-specimen" data-person={at}>
      <h3>{viewer.name}</h3>
      <RoomBar
        people={people}
        me={viewer.id}
        status="connected"
        mayEdit={mayEdit}
        mode={suggest ? "suggest" : "edit"}
        onMode={setMode}
        pending={pending}
      />
      {room ? (
        <RichEditor
          ariaLabel={`${viewer.name}'s copy, formatted`}
          value={text}
          onChange={() => {}}
          readOnly={false}
          dialect="site"
          room={room}
          onReady={(h) => setEditor(h.editor)}
        />
      ) : null}
      <SuggestionsPanel
        id={`suggestions-${at}`}
        editor={editor}
        names={names}
        me={viewer.id}
        mayDecide={mayEdit}
        round={round}
        onRound={setRound}
      />
      <CommentsPanel
        id={`comments-${at}`}
        comments={comments}
        me={viewer}
        send={send}
        editor={editor}
        active={active}
        onActive={setActive}
      />
    </div>
  );
}

function Two() {
  const { comments, send } = useComments();
  return (
    <div className="cap-collab-specimen-pair">
      <Person at={0} comments={comments} send={send(viewers[0]!)} />
      <Person at={1} comments={comments} send={send(viewers[1]!)} />
    </div>
  );
}

function Bars() {
  const me = viewers[0]!;
  const alone = [people[0]!];
  return (
    <>
      <RoomBar
        people={people}
        me={me.id}
        status="offline"
        mayEdit
        mode="edit"
        onMode={() => {}}
        pending={0}
      />
      <RoomBar
        people={alone}
        me={me.id}
        status="connecting"
        mayEdit
        mode="edit"
        onMode={() => {}}
        pending={0}
      />
      <RoomBar
        people={alone}
        me={me.id}
        status="connected"
        mayEdit={false}
        mode="suggest"
        onMode={() => {}}
        pending={2}
      />
    </>
  );
}

const mounts: Record<string, () => React.ReactNode> = { two: () => <Two />, bars: () => <Bars /> };
for (const el of document.querySelectorAll<HTMLElement>("[data-mount]"))
  createRoot(el).render(<StrictMode>{mounts[el.dataset.mount!]!()}</StrictMode>);
