import { QueryClient, type QueryKey, type UseQueryResult } from "@tanstack/react-query";
import { type ComponentType, type LazyExoticComponent } from "react";
import { type Answer, type Flag } from "./data.ts";
export { NO_ANSWER, SignedOut, answerOf, ask, createFlag, getAnswer, postAnswer, reconnectDelay, sessionEnded, socketUrl, } from "./data.ts";
export type { Answer, Failure, Flag } from "./data.ts";
export interface QueryClientOptions {
    /** How long a read stays fresh (30 s). Above 0, so a read the server made for this page is fresh
     *  on hydration and not read again at once (TanStack Query, Advanced Server Rendering). */
    staleTime?: number;
    /** Retries for a failed read (2). A read `final` calls final is never retried. */
    retries?: number;
    /** A failure retrying cannot mend, such as a 4xx answer. */
    final?: (error: unknown) => boolean;
    /** Read again when the tab comes back or the network returns (true, TanStack's default). */
    refetchOnFocus?: boolean;
    /** Every failed read, once: a SignedOut sets the page's signed-out flag here. */
    onError?: (error: unknown) => void;
}
/**
 * One QueryClient per page load in the browser and one per request on the server, so no request
 * shares a cache with another. Writes are never retried: the reader sees the error and decides.
 */
export declare function createQueryClient({ staleTime, retries, final, refetchOnFocus, onError, }?: QueryClientOptions): QueryClient;
/** With a seed the data is never undefined, so a seeded page reads `.data` directly. */
export type SeededResult<T, S> = [S] extends [T] ? UseQueryResult<T> & {
    data: T;
} : UseQueryResult<T>;
/**
 * A query that starts from its route loader's data (server-rendered, no loading flash) and then
 * lives in the cache. A loader that runs again (a navigation, a search parameter) hands down a newer
 * object, which replaces what the cache holds for the same key.
 */
export declare function useSeededQuery<T, S extends T | undefined = undefined>(options: {
    queryKey: QueryKey;
    queryFn: (context: {
        signal: AbortSignal;
    }) => Promise<T>;
    enabled?: boolean;
}, seed?: S): SeededResult<T, S>;
/** A cache patch: the key, how its data changes, and whether only that exact key. */
export type Patch = readonly [QueryKey, (old: never) => unknown, boolean];
/** Patches the one query at exactly this key: keys are prefixes, and ["library"] must not reach
 *  ["library", "book", id], whose data has another shape. Missing data stays missing. */
export declare function patch<T>(key: QueryKey, update: (old: T) => T): Patch;
/** Patches every query under this prefix; each one must hold data of the same shape. */
export declare function patchAll<T>(prefix: QueryKey, update: (old: T) => T): Patch;
export interface WriteSpec<V, R> {
    write: (vars: V) => Promise<R>;
    /** Applied before the request goes out; rolled back if it fails. */
    optimistic?: (vars: V) => readonly Patch[];
    /** Read again once the write settles (prefix match), and only these. */
    invalidates?: (vars: V, result: R | undefined) => readonly QueryKey[];
    onSuccess?: (result: R, vars: V) => void;
}
/** The words for a failed write when an app gives none of its own. */
export declare function writeFailureText(error: unknown): string | null;
/**
 * A write with optimistic cache patches that roll back on failure and a targeted read of only the
 * keys it touched, so a save never reloads the page. `words` turns the failure into the line the
 * reader sees.
 */
export declare function useWrite<V = void, R = unknown>(spec: WriteSpec<V, R>, words?: (error: unknown) => string | null): {
    run: (vars: V) => Promise<R | undefined>;
    fire: (vars: V) => void;
    pending: boolean;
    error: string | null;
    reset: () => void;
};
/** A page-wide flag as React state. False on the server, which renders only signed-in pages. */
export declare function useFlag(flag: Flag): boolean;
export type Load<T> = {
    data: T | null;
    loading: boolean;
    error: string | null;
};
/**
 * A route's Answer, cached under `key`. A new key keeps what is on screen and marks it loading
 * (`keep: false` starts empty); a failed read keeps it too and says why; a SignedOut is not shown
 * as an error (the client's onError sets the signed-out flag). `reread` reads it again now.
 */
export declare function useAnswer<T>(key: readonly unknown[], read: () => Promise<Answer<T>>, { keep, staleTime, enabled, }?: {
    keep?: boolean;
    staleTime?: number;
    enabled?: boolean;
}): Load<T> & {
    reread: () => void;
};
export interface LiveRoomOptions {
    /** Each text frame the room sends. */
    onMessage: (data: string) => void;
    /** The socket closed (it reconnects on its own): clear what only a live room knows, such as presence. */
    onDrop?: () => void;
    /** A keepalive frame, sent every `pingMs` (30 s) so an idle socket is not reaped. */
    ping?: string;
    pingMs?: number;
}
/**
 * A WebSocket that stays open: it reconnects after a drop with exponential backoff and jitter,
 * at once when the network comes back, and closes on unmount or when `room` changes. `room` null
 * opens nothing. `open` makes the socket (an app's own, which may add a session cookie).
 */
export declare function useLiveRoom(room: string | null, open: (room: string) => WebSocket, options: LiveRoomOptions): {
    connected: boolean;
};
/**
 * A chunk of lazy components that the page can load before it hydrates. React.lazy suspends on its
 * first render, and an update reaching a boundary still suspended makes React drop the server's
 * HTML for the fallback until it renders again, so a chart drawn on the server would lose its
 * height for a moment. The client entry calls `load()` first on a page that needs the chunk; a part
 * made after that renders at once, because its factory answers with an already resolved thenable,
 * which React.lazy reads synchronously.
 */
type AnyComponent = ComponentType<any>;
export declare function preloadedLazy<M extends Record<string, unknown>>(importer: () => Promise<M>): {
    load: () => Promise<M>;
    part: <K extends { [K_1 in keyof M]: M[K_1] extends AnyComponent ? K_1 : never; }[keyof M]>(name: K) => LazyExoticComponent<Extract<M[K], AnyComponent>>;
};
