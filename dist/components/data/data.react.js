// The data hooks every React app in the network wrote its own copy of: server-seeded queries,
// optimistic writes that roll back, a route's Answer as a query, a page-wide flag, a live room
// that reconnects, and a lazy part the page can load before it hydrates. TanStack Query is an
// optional peer: only an app that imports this entry needs it. Nothing here touches the DOM, so a
// React Native app's shared client uses it too.
import { QueryCache, QueryClient, keepPreviousData, useMutation, useQuery, useQueryClient, } from "@tanstack/react-query";
import { lazy, useCallback, useEffect, useRef, useState, useSyncExternalStore, } from "react";
import { SignedOut, ask, reconnectDelay } from "./data.js";
export { NO_ANSWER, SignedOut, answerOf, ask, createFlag, getAnswer, postAnswer, reconnectDelay, sessionEnded, socketUrl, } from "./data.js";
/**
 * One QueryClient per page load in the browser and one per request on the server, so no request
 * shares a cache with another. Writes are never retried: the reader sees the error and decides.
 */
export function createQueryClient({ staleTime = 30_000, retries = 2, final = (e) => e instanceof SignedOut, refetchOnFocus = true, onError, } = {}) {
    return new QueryClient({
        ...(onError ? { queryCache: new QueryCache({ onError }) } : {}),
        defaultOptions: {
            queries: {
                staleTime,
                retry: (count, error) => !final(error) && count < retries,
                refetchOnWindowFocus: refetchOnFocus,
                refetchOnReconnect: refetchOnFocus,
            },
            mutations: { retry: false },
        },
    });
}
/**
 * A query that starts from its route loader's data (server-rendered, no loading flash) and then
 * lives in the cache. A loader that runs again (a navigation, a search parameter) hands down a newer
 * object, which replaces what the cache holds for the same key.
 */
export function useSeededQuery(options, seed) {
    const qc = useQueryClient();
    const [seededAt] = useState(() => Date.now());
    const query = useQuery({
        ...options,
        ...(seed !== undefined ? { initialData: seed, initialDataUpdatedAt: seededAt } : {}),
    });
    const last = useRef(seed);
    const key = JSON.stringify(options.queryKey);
    useEffect(() => {
        if (seed !== undefined && seed !== last.current) {
            last.current = seed;
            qc.setQueryData(options.queryKey, seed);
        }
        // oxlint-disable-next-line react/exhaustive-deps -- the serialized key stands in for options.queryKey.
    }, [seed, key, qc]);
    return query;
}
/** Patches the one query at exactly this key: keys are prefixes, and ["library"] must not reach
 *  ["library", "book", id], whose data has another shape. Missing data stays missing. */
export function patch(key, update) {
    return [key, update, true];
}
/** Patches every query under this prefix; each one must hold data of the same shape. */
export function patchAll(prefix, update) {
    return [prefix, update, false];
}
async function applyPatches(qc, patches) {
    const saved = [];
    for (const [key, update, exact] of patches) {
        await qc.cancelQueries({ queryKey: key, exact });
        for (const [k, data] of qc.getQueriesData({ queryKey: key, exact })) {
            saved.push([k, data]);
            if (data !== undefined)
                qc.setQueryData(k, update(data));
        }
    }
    return () => {
        for (const [k, data] of saved)
            qc.setQueryData(k, data);
    };
}
/** The words for a failed write when an app gives none of its own. */
export function writeFailureText(error) {
    if (!error)
        return null;
    return error instanceof Error && error.message
        ? `Could not save: ${error.message}`
        : "Could not save. Try again.";
}
/**
 * A write with optimistic cache patches that roll back on failure and a targeted read of only the
 * keys it touched, so a save never reloads the page. `words` turns the failure into the line the
 * reader sees.
 */
export function useWrite(spec, words = writeFailureText) {
    const qc = useQueryClient();
    const m = useMutation({
        mutationFn: spec.write,
        onMutate: async (vars) => ({
            rollback: await applyPatches(qc, spec.optimistic?.(vars) ?? []),
        }),
        onError: (_err, _vars, ctx) => ctx?.rollback(),
        onSuccess: (result, vars) => spec.onSuccess?.(result, vars),
        onSettled: (result, _err, vars) => {
            for (const key of spec.invalidates?.(vars, result) ?? []) {
                void qc.invalidateQueries({ queryKey: key });
            }
        },
    });
    const { mutate, mutateAsync } = m;
    /** Resolves to the result, or undefined when the write failed (shown in `error`). */
    const run = useCallback((vars) => mutateAsync(vars).then((r) => r, () => undefined), [mutateAsync]);
    /** Fire and forget; the error shows through `error`. */
    const fire = useCallback((vars) => mutate(vars), [mutate]);
    return { run, fire, pending: m.isPending, error: words(m.error), reset: m.reset };
}
// ---- Answers as queries -------------------------------------------------------------------------
/** A page-wide flag as React state. False on the server, which renders only signed-in pages. */
export function useFlag(flag) {
    return useSyncExternalStore(flag.subscribe, flag.get, () => false);
}
/**
 * A route's Answer, cached under `key`. A new key keeps what is on screen and marks it loading
 * (`keep: false` starts empty); a failed read keeps it too and says why; a SignedOut is not shown
 * as an error (the client's onError sets the signed-out flag). `reread` reads it again now.
 */
export function useAnswer(key, read, { keep = true, staleTime, enabled = true, } = {}) {
    const q = useQuery({
        queryKey: key,
        queryFn: () => ask(read),
        placeholderData: keep ? keepPreviousData : undefined,
        enabled,
        ...(staleTime === undefined ? {} : { staleTime }),
    });
    const { refetch } = q;
    return {
        data: q.data ?? null,
        loading: q.isFetching,
        error: q.error && !(q.error instanceof SignedOut) ? q.error.message : null,
        reread: useCallback(() => void refetch(), [refetch]),
    };
}
/**
 * A WebSocket that stays open: it reconnects after a drop with exponential backoff and jitter,
 * at once when the network comes back, and closes on unmount or when `room` changes. `room` null
 * opens nothing. `open` makes the socket (an app's own, which may add a session cookie).
 */
export function useLiveRoom(room, open, options) {
    const [connected, setConnected] = useState(false);
    const latest = useRef({ open, ...options });
    useEffect(() => {
        latest.current = { open, ...options };
    });
    useEffect(() => {
        if (!room)
            return;
        let ws = null;
        let attempt = 0;
        let retry;
        let ping;
        let stopped = false;
        const connect = () => {
            clearTimeout(retry);
            if (stopped)
                return;
            const socket = latest.current.open(room);
            ws = socket;
            socket.onopen = () => {
                attempt = 0;
                setConnected(true);
            };
            socket.onmessage = (event) => latest.current.onMessage(String(event.data));
            socket.onclose = () => {
                if (ws !== socket)
                    return;
                ws = null;
                clearInterval(ping);
                setConnected(false);
                latest.current.onDrop?.();
                if (stopped)
                    return;
                retry = setTimeout(connect, reconnectDelay(attempt));
                attempt += 1;
            };
            const frame = latest.current.ping;
            if (frame) {
                clearInterval(ping);
                ping = setInterval(() => {
                    if (socket.readyState === WebSocket.OPEN)
                        socket.send(frame);
                }, latest.current.pingMs ?? 30_000);
            }
        };
        const online = () => {
            if (!ws)
                connect();
        };
        connect();
        globalThis.addEventListener?.("online", online);
        return () => {
            stopped = true;
            clearTimeout(retry);
            clearInterval(ping);
            globalThis.removeEventListener?.("online", online);
            const socket = ws;
            ws = null;
            socket?.close();
            setConnected(false);
            latest.current.onDrop?.();
        };
    }, [room]);
    return { connected };
}
export function preloadedLazy(importer) {
    let loaded;
    let loading;
    const load = () => {
        loading ??= importer().then((m) => (loaded = m));
        return loading;
    };
    function part(name) {
        const pick = (m) => ({ default: m[name] });
        return lazy(() => {
            const ready = loaded;
            if (!ready)
                return load().then(pick);
            const module = pick(ready);
            // oxlint-disable-next-line unicorn/no-thenable -- the point: React.lazy reads an already-resolved thenable synchronously, a Promise would suspend
            return { then: (resolve) => resolve(module) };
        });
    }
    return { load, part };
}
