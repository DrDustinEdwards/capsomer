import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
// What every editor in a shared room needs: the room itself (collab-editor-room.ts), this person's way
// of working in it (Editing or Suggesting, the revision round), the rich editor's binding to the room's
// copy, and the bar and panels around the text. The page adds its own saving and publishing, and keeps
// the person's choices (mode and round) where it keeps its other remembered choices.
import { disableSuggestChanges, enableSuggestChanges, isSuggestChangesEnabled, } from "@handlewithcare/prosemirror-suggest-changes";
import Collaboration from "@tiptap/extension-collaboration";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { RoomBar } from "./collab-editor-bar.react.js";
import { CommentsPanel } from "./collab-editor-comments.react.js";
import { FRAGMENT, markdownOf } from "./collab-editor-doc.js";
import { commentMarks, commentsKey, refreshCarets, roomCarets, suggesting, } from "./collab-editor-extensions.js";
import { personSlot, useRoom } from "./collab-editor-room.js";
import { listSuggestions } from "./collab-editor-suggest.js";
import { SuggestionsPanel } from "./collab-editor-suggestions.react.js";
export { RoomBar } from "./collab-editor-bar.react.js";
export { CommentsPanel } from "./collab-editor-comments.react.js";
export { SuggestionsPanel } from "./collab-editor-suggestions.react.js";
export { personSlot, useRoom } from "./collab-editor-room.js";
/**
 * The rich editor's `room` for a Yjs copy: the binding, the others' carets under the names the room
 * gives, suggesting as this person, and the open threads marked. useRoomEditing uses it over a
 * y-partyserver room; any other provider (or two copies in one page) can use it directly.
 */
export function useRichRoom(options) {
    const { doc, awareness, people, comments, by, suggest, round, active, onActive } = options;
    // The room's own word on whose each caret is: its Yjs client ids, by connection.
    const who = useMemo(() => {
        const map = new Map();
        for (const p of people)
            for (const c of p.clients)
                map.set(c, { name: p.name, slot: personSlot(p.id) });
        return map;
    }, [people]);
    const peopleKey = people.map((p) => `${p.conn}:${p.clients.join(".")}`).join(",");
    const threads = useMemo(() => comments
        .filter((c) => !c.parentId && !c.resolvedAt)
        .map((c) => ({ id: c.id, anchor: c.anchor })), [comments]);
    const live = useRef({ who, threads, active, round });
    const choose = useRef(onActive);
    useLayoutEffect(() => {
        live.current = { who, threads, active, round };
        choose.current = onActive;
    });
    const binding = useMemo(() => doc && awareness
        ? {
            extensions: () => [
                Collaboration.configure({ document: doc, field: FRAGMENT }),
                roomCarets(awareness, () => (id) => live.current.who.get(id) ?? null),
                suggesting({ by, clientId: doc.clientID, round: () => live.current.round || null }),
                commentMarks(() => ({ threads: live.current.threads, active: live.current.active }), (id) => choose.current(id)),
            ],
            markdown: (json) => markdownOf(doc, json),
            sourceLocked: (state) => isSuggestChangesEnabled(state),
        }
        : null, [doc, awareness, by]);
    // The binding's functions read the refs when the editor calls them, after render, never during it.
    // oxlint-disable-next-line react/refs -- reading `binding` is not reading a ref: its functions hold them for later
    if (!binding)
        return null;
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
export function useRoomEditing(options) {
    const { path, initial, unsaved, viewer, names, hideFrontMatter, round } = options;
    const room = useRoom(path, initial, unsaved);
    const mayEdit = viewer.access === "edit";
    const mode = mayEdit && options.mode !== "suggest" ? "edit" : "suggest";
    const [editor, setEditor] = useState(null);
    const [active, setActive] = useState(null);
    const pending = usePending(editor);
    const suggest = !mayEdit || mode === "suggest";
    const binding = useRichRoom({
        doc: room.synced ? room.doc : null,
        awareness: room.synced ? room.provider.awareness : null,
        people: room.people,
        comments: room.comments,
        by: String(viewer.id),
        suggest,
        round,
        active,
        onActive: setActive,
        hideFrontMatter,
    });
    const rich = binding
        ? { ...binding, key: `${path}#${room.generation}` }
        : null;
    const markdownLocked = suggest
        ? "Suggestions are made in the formatted view. The Markdown here shows the text as it stands."
        : pending > 0
            ? "Accept or reject the suggestions first: Markdown cannot show them. The Markdown here shows the text without them."
            : null;
    const bar = (_jsx(RoomBar, { people: room.people, me: viewer.id, status: room.status, mayEdit: mayEdit, mode: mode, onMode: options.onMode, pending: pending }));
    const panels = (_jsxs(_Fragment, { children: [_jsx(SuggestionsPanel, { editor: editor, names: names, me: viewer.id, mayDecide: mayEdit, round: round, onRound: options.onRound }), _jsx(CommentsPanel, { comments: room.comments, me: viewer, send: room.send, editor: editor, active: active, onActive: setActive })] }));
    return { room, rich, editor, setEditor, pending, markdownLocked, bar, panels };
}
/** The suggestions waiting in an editor's text, counted again on each change. */
export function usePending(editor) {
    const [pending, setPending] = useState(0);
    useEffect(() => {
        if (!editor)
            return;
        const read = () => setPending(listSuggestions(editor.state.doc).length);
        read();
        editor.on("update", read);
        return () => {
            editor.off("update", read);
        };
    }, [editor]);
    return editor ? pending : 0;
}
