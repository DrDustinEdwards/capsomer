// The page's side of a file's room (the app's y-partyserver room): the shared copy as a Yjs document kept in
// step over one WebSocket, the people in the room and the comments, as the room says them.
//
// The editor is made only once the copy has arrived, so it never starts from an empty document and
// writes that into the room. A change the room refuses (someone who suggests, typing plainly) leaves
// this copy different from everyone else's, so the hook starts again from the room's, and says why.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import YProvider from "y-partyserver/provider";
import * as Y from "yjs";
import { patchMarkdown, readMeta, roomMarkdown } from "./collab-editor-doc.js";
export function useRoom(path, initial, initiallyUnsaved) {
    const [generation, setGeneration] = useState(0);
    const [live, setLive] = useState(null);
    const [synced, setSynced] = useState(false);
    const [status, setStatus] = useState("connecting");
    const [source, setSourceState] = useState(initial);
    const [unsaved, setUnsaved] = useState(initiallyUnsaved);
    const [people, setPeople] = useState([]);
    const [comments, setComments] = useState([]);
    const [notice, setNotice] = useState(null);
    const flushes = useRef({ n: 0, waiting: new Map() });
    useEffect(() => {
        const waiting = flushes.current.waiting;
        const doc = new Y.Doc();
        const provider = withoutUnload(() => new YProvider(window.location.host, path, doc, {
            prefix: path,
            protocol: window.location.protocol === "https:" ? "wss" : "ws",
            // Another tab of the same person is another connection, so the room knows of both.
            disableBc: true,
        }));
        // oxlint-disable-next-line react/set-state-in-effect -- the doc and its provider are made here, in the effect that owns their lifetime, and handed to render.
        setLive({ doc, provider });
        setSynced(false);
        let frame = 0;
        const take = () => {
            const md = roomMarkdown(doc);
            setSourceState(md);
            setUnsaved(md !== readMeta(doc).saved);
        };
        const read = () => {
            cancelAnimationFrame(frame);
            frame = requestAnimationFrame(take);
        };
        doc.on("update", read);
        const onSync = (done) => {
            if (!done)
                return;
            setSynced(true);
            take();
        };
        const onStatus = ({ status: s }) => setStatus(s === "connected" ? "connected" : s === "connecting" ? "connecting" : "offline");
        const onMessage = (raw) => {
            let message;
            try {
                message = JSON.parse(raw);
            }
            catch {
                return;
            }
            if (message.t === "people")
                setPeople(message.people);
            else if (message.t === "comments")
                setComments(message.comments);
            else if (message.t === "flushed") {
                const done = flushes.current.waiting.get(message.n);
                flushes.current.waiting.delete(message.n);
                done?.();
            }
            else if (message.t === "replaced")
                setNotice(`${message.by} replaced the text for everyone.`);
            else if (message.t === "error")
                setNotice(message.message);
            else if (message.t === "refused") {
                setNotice(`That change was not taken: ${message.reason}`);
                setGeneration((g) => g + 1);
            }
        };
        provider.on("sync", onSync);
        provider.on("status", onStatus);
        provider.on("custom-message", onMessage);
        return () => {
            cancelAnimationFrame(frame);
            for (const done of waiting.values())
                done();
            waiting.clear();
            withoutUnload(() => provider.destroy());
            doc.destroy();
        };
    }, [path, generation]);
    const send = useCallback((message) => live?.provider.sendMessage(JSON.stringify(message)), [live]);
    const flush = useCallback(() => new Promise((resolve) => {
        if (!live?.provider.wsconnected)
            return resolve();
        const n = ++flushes.current.n;
        flushes.current.waiting.set(n, resolve);
        live.provider.sendMessage(JSON.stringify({ t: "flush", n }));
        // A room that does not answer does not hold the save: the save reads what the room has.
        window.setTimeout(() => {
            if (flushes.current.waiting.delete(n))
                resolve();
        }, 3000);
    }), [live]);
    const setSource = useCallback((markdown) => live ? patchMarkdown(live.doc, markdown) : { ok: true, changed: false }, [live]);
    return useMemo(() => live
        ? {
            doc: live.doc,
            provider: live.provider,
            synced,
            status,
            source,
            unsaved,
            people,
            comments,
            notice,
            generation,
            send,
            flush,
            setSource,
        }
        : // Before the page is in the browser: the text the server read, and nothing live yet.
            {
                doc: null,
                provider: null,
                synced: false,
                status: "connecting",
                source,
                unsaved,
                people,
                comments,
                notice,
                generation,
                send,
                flush,
                setSource,
            }, [
        live,
        synced,
        status,
        source,
        unsaved,
        people,
        comments,
        notice,
        generation,
        send,
        flush,
        setSource,
    ]);
}
/** A person's color in the room, the same on every screen: one of eight, set in collab-editor.css by `data-who`. */
export const personSlot = (id) => Math.abs(id) % 8;
/**
 * Runs the provider's set up or tear down with its `unload` listener moved to `pagehide`: the
 * sites' Permissions-Policy forbids `unload` (it also spoils the back and forward cache). The listener tells
 * the room this caret is gone; the room drops it when the socket closes in any case.
 */
function withoutUnload(run) {
    const w = window;
    const { addEventListener: add, removeEventListener: remove } = w;
    const swap = (type) => (type === "unload" ? "pagehide" : type);
    w.addEventListener = (type, ...rest) => add.call(w, swap(type), ...rest);
    w.removeEventListener = (type, ...rest) => remove.call(w, swap(type), ...rest);
    try {
        return run();
    }
    finally {
        w.addEventListener = add;
        w.removeEventListener = remove;
    }
}
