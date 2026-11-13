// What every editor in a shared room needs: the room itself (collab-editor-room.ts), this person's way
// of working in it (Editing or Suggesting, the revision round), the rich editor's binding to the room's
// copy, and the bar and panels around the text. The page adds its own saving and publishing, and keeps
// the person's choices (mode and round) where it keeps its other remembered choices.

import {
  disableSuggestChanges,
  enableSuggestChanges,
  isSuggestChangesEnabled,
} from "@handlewithcare/prosemirror-suggest-changes";
import type { Editor } from "@tiptap/core";
import Collaboration from "@tiptap/extension-collaboration";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { Awareness } from "y-protocols/awareness";
import type * as Y from "yjs";

import type { RichRoom } from "../rich-editor/rich-editor.react.tsx";

import { RoomBar, type WriteMode } from "./collab-editor-bar.react.tsx";
import { CommentsPanel } from "./collab-editor-comments.react.tsx";
import { FRAGMENT, markdownOf } from "./collab-editor-doc.ts";
import {
  commentMarks,
  commentsKey,
  refreshCarets,
  roomCarets,
  suggesting,
  type Anchored,
} from "./collab-editor-extensions.ts";
import type { RoomComment, RoomPerson, RoomViewer } from "./collab-editor-protocol.ts";
import { personSlot, useRoom, type Room } from "./collab-editor-room.ts";
import { listSuggestions, type JsonDoc } from "./collab-editor-suggest.ts";
import { SuggestionsPanel } from "./collab-editor-suggestions.react.tsx";

export { RoomBar, type WriteMode } from "./collab-editor-bar.react.tsx";
export { CommentsPanel } from "./collab-editor-comments.react.tsx";
export { SuggestionsPanel } from "./collab-editor-suggestions.react.tsx";
export { personSlot, useRoom, type Room, type RoomStatus } from "./collab-editor-room.ts";

export type RoomEditing = {
  room: Room;
  /** The rich editor's `room` once the room's copy has arrived; null before. Remount the editor on `key`. */
  rich: (RichRoom & { key: string }) | null;
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

/** What the room's extensions read as the room changes; they are made once per editor. */
type Live = {
  who: Map<number, { name: string; slot: number }>;
  threads: Anchored[];
  active: string | null;
  round: string;
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
export function useRichRoom(options: RichRoomOptions): RichRoom | null {
  const { doc, awareness, people, comments, by, suggest, round, active, onActive } = options;
  // The room's own word on whose each caret is: its Yjs client ids, by connection.
  const who = useMemo(() => {
    const map = new Map<number, { name: string; slot: number }>();
    for (const p of people)
      for (const c of p.clients) map.set(c, { name: p.name, slot: personSlot(p.id) });
    return map;
  }, [people]);
  const peopleKey = people.map((p) => `${p.conn}:${p.clients.join(".")}`).join(",");
  const threads = useMemo(
    () =>
      comments
        .filter((c) => !c.parentId && !c.resolvedAt)
        .map((c) => ({ id: c.id, anchor: c.anchor })),
    [comments],
  );
  const live = useRef<Live>({ who, threads, active, round });
  const choose = useRef(onActive);
  useLayoutEffect(() => {
    live.current = { who, threads, active, round };
    choose.current = onActive;
  });

  const binding = useMemo<Omit<RichRoom, "syncKey" | "sync" | "hideFrontMatter"> | null>(
    () =>
      doc && awareness
        ? {
            extensions: () => [
              Collaboration.configure({ document: doc, field: FRAGMENT }),
              roomCarets(awareness, () => (id) => live.current.who.get(id) ?? null),
              suggesting({ by, clientId: doc.clientID, round: () => live.current.round || null }),
              commentMarks(
                () => ({ threads: live.current.threads, active: live.current.active }),
                (id) => choose.current(id),
              ),
            ],
            markdown: (json) => markdownOf(doc, json as JsonDoc),
            sourceLocked: (state) => isSuggestChangesEnabled(state),
          }
        : null,
    [doc, awareness, by],
  );
  // The binding's functions read the refs when the editor calls them, after render, never during it.
  // oxlint-disable-next-line react/refs -- reading `binding` is not reading a ref: its functions hold them for later
  if (!binding) return null;
  const threadsKey = `${active}|${threads.map((t) => `${t.id}:${t.anchor}`).join(",")}`;
  return {
    ...binding,
    hideFrontMatter: options.hideFrontMatter,
    syncKey: `${suggest}|${peopleKey}|${threadsKey}`,
    sync: (e) => {
      if (suggest !== isSuggestChangesEnabled(e.state))
        (suggest ? enableSuggestChanges : disableSuggestChanges)(e.state, e.view.dispatch);
      e.view.dispatch(refreshCarets(e.state));
      e.view.dispatch(e.state.tr.setMeta(commentsKey, true).setMeta("addToHistory", false));
    },
  };
}

export function useRoomEditing(options: RoomEditingOptions): RoomEditing {
  const { path, initial, unsaved, viewer, names, hideFrontMatter, round } = options;
  const room = useRoom(path, initial, unsaved);
  const mayEdit = viewer.access === "edit";
  const mode: WriteMode = mayEdit && options.mode !== "suggest" ? "edit" : "suggest";
  const [editor, setEditor] = useState<Editor | null>(null);
  const [active, setActive] = useState<string | null>(null);
  const pending = usePending(editor);
  const suggest = !mayEdit || mode === "suggest";
  const binding = useRichRoom({
    doc: room.synced ? room.doc : null,
    awareness: room.synced ? (room.provider?.awareness ?? null) : null,
    people: room.people,
    comments: room.comments,
    by: String(viewer.id),
    suggest,
    round,
    active,
    onActive: setActive,
    hideFrontMatter,
  });
  const rich: RoomEditing["rich"] = binding
    ? { ...binding, key: `${path}#${room.generation}` }
    : null;

  const markdownLocked = suggest
    ? "Suggestions are made in the formatted view. The Markdown here shows the text as it stands."
    : pending > 0
      ? "Accept or reject the suggestions first: Markdown cannot show them. The Markdown here shows the text without them."
      : null;

  const bar = (
    <RoomBar
      people={room.people}
      me={viewer.id}
      status={room.status}
      mayEdit={mayEdit}
      mode={mode}
      onMode={options.onMode}
      pending={pending}
    />
  );
  const panels = (
    <>
      <SuggestionsPanel
        editor={editor}
        names={names}
        me={viewer.id}
        mayDecide={mayEdit}
        round={round}
        onRound={options.onRound}
      />
      <CommentsPanel
        comments={room.comments}
        me={viewer}
        send={room.send}
        editor={editor}
        active={active}
        onActive={setActive}
      />
    </>
  );
  return { room, rich, editor, setEditor, pending, markdownLocked, bar, panels };
}

/** The suggestions waiting in an editor's text, counted again on each change. */
export function usePending(editor: Editor | null): number {
  const [pending, setPending] = useState(0);
  useEffect(() => {
    if (!editor) return;
    const read = () => setPending(listSuggestions(editor.state.doc).length);
    read();
    editor.on("update", read);
    return () => {
      editor.off("update", read);
    };
  }, [editor]);
  return editor ? pending : 0;
}
