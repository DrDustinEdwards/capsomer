// The data hooks every React app in the network wrote its own copy of: server-seeded queries,
// optimistic writes that roll back, a route's Answer as a query, a page-wide flag, a live room
// that reconnects, and a lazy part the page can load before it hydrates. TanStack Query is an
// optional peer: only an app that imports this entry needs it. Nothing here touches the DOM, so a
// React Native app's shared client uses it too.
import {
  QueryCache,
  QueryClient,
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
  type QueryKey,
  type UseQueryResult,
} from "@tanstack/react-query";
import {
  lazy,
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ComponentType,
  type LazyExoticComponent,
} from "react";
import { SignedOut, ask, reconnectDelay, type Answer, type Flag } from "./data.ts";

export {
  NO_ANSWER,
  SignedOut,
  answerOf,
  ask,
  createFlag,
  getAnswer,
  postAnswer,
  reconnectDelay,
  sessionEnded,
  socketUrl,
} from "./data.ts";
export type { Answer, Failure, Flag } from "./data.ts";

// ---- The query client ---------------------------------------------------------------------------

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
export function createQueryClient({
  staleTime = 30_000,
  retries = 2,
  final = (e) => e instanceof SignedOut,
  refetchOnFocus = true,
  onError,
}: QueryClientOptions = {}): QueryClient {
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

// ---- Seeded reads and optimistic writes ---------------------------------------------------------

/** With a seed the data is never undefined, so a seeded page reads `.data` directly. */
export type SeededResult<T, S> = [S] extends [T]
  ? UseQueryResult<T> & { data: T }
  : UseQueryResult<T>;

/**
 * A query that starts from its route loader's data (server-rendered, no loading flash) and then
 * lives in the cache. A loader that runs again (a navigation, a search parameter) hands down a newer
 * object, which replaces what the cache holds for the same key.
 */
export function useSeededQuery<T, S extends T | undefined = undefined>(
  options: {
    queryKey: QueryKey;
    queryFn: (context: { signal: AbortSignal }) => Promise<T>;
    enabled?: boolean;
  },
  seed?: S,
): SeededResult<T, S> {
  const qc = useQueryClient();
  const [seededAt] = useState(() => Date.now());
  const query = useQuery<T>({
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
  return query as SeededResult<T, S>;
}

/** A cache patch: the key, how its data changes, and whether only that exact key. */
export type Patch = readonly [QueryKey, (old: never) => unknown, boolean];

/** Patches the one query at exactly this key: keys are prefixes, and ["library"] must not reach
 *  ["library", "book", id], whose data has another shape. Missing data stays missing. */
export function patch<T>(key: QueryKey, update: (old: T) => T): Patch {
  return [key, update as (old: never) => unknown, true];
}

/** Patches every query under this prefix; each one must hold data of the same shape. */
export function patchAll<T>(prefix: QueryKey, update: (old: T) => T): Patch {
  return [prefix, update as (old: never) => unknown, false];
}

async function applyPatches(qc: QueryClient, patches: readonly Patch[]): Promise<() => void> {
  const saved: Array<[QueryKey, unknown]> = [];
  for (const [key, update, exact] of patches) {
    await qc.cancelQueries({ queryKey: key, exact });
    for (const [k, data] of qc.getQueriesData({ queryKey: key, exact })) {
      saved.push([k, data]);
      if (data !== undefined) qc.setQueryData(k, (update as (old: unknown) => unknown)(data));
    }
  }
  return () => {
    for (const [k, data] of saved) qc.setQueryData(k, data);
  };
}

export interface WriteSpec<V, R> {
  write: (vars: V) => Promise<R>;
  /** Applied before the request goes out; rolled back if it fails. */
  optimistic?: (vars: V) => readonly Patch[];
  /** Read again once the write settles (prefix match), and only these. */
  invalidates?: (vars: V, result: R | undefined) => readonly QueryKey[];
  onSuccess?: (result: R, vars: V) => void;
}

/** The words for a failed write when an app gives none of its own. */
export function writeFailureText(error: unknown): string | null {
  if (!error) return null;
  return error instanceof Error && error.message
    ? `Could not save: ${error.message}`
    : "Could not save. Try again.";
}

/**
 * A write with optimistic cache patches that roll back on failure and a targeted read of only the
 * keys it touched, so a save never reloads the page. `words` turns the failure into the line the
 * reader sees.
 */
export function useWrite<V = void, R = unknown>(
  spec: WriteSpec<V, R>,
  words: (error: unknown) => string | null = writeFailureText,
) {
  const qc = useQueryClient();
  const m = useMutation<R, unknown, V, { rollback: () => void }>({
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
  const run = useCallback(
    (vars: V): Promise<R | undefined> =>
      mutateAsync(vars).then(
        (r) => r,
        () => undefined,
      ),
    [mutateAsync],
  );
  /** Fire and forget; the error shows through `error`. */
  const fire = useCallback((vars: V) => mutate(vars), [mutate]);
  return { run, fire, pending: m.isPending, error: words(m.error), reset: m.reset };
}

// ---- Answers as queries -------------------------------------------------------------------------

/** A page-wide flag as React state. False on the server, which renders only signed-in pages. */
export function useFlag(flag: Flag): boolean {
  return useSyncExternalStore(flag.subscribe, flag.get, () => false);
}

export type Load<T> = { data: T | null; loading: boolean; error: string | null };

/**
 * A route's Answer, cached under `key`. A new key keeps what is on screen and marks it loading
 * (`keep: false` starts empty); a failed read keeps it too and says why; a SignedOut is not shown
 * as an error (the client's onError sets the signed-out flag). `reread` reads it again now.
 */
export function useAnswer<T>(
  key: readonly unknown[],
  read: () => Promise<Answer<T>>,
  {
    keep = true,
    staleTime,
    enabled = true,
  }: { keep?: boolean; staleTime?: number; enabled?: boolean } = {},
): Load<T> & { reread: () => void } {
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

// ---- The live room ------------------------------------------------------------------------------

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
export function useLiveRoom(
  room: string | null,
  open: (room: string) => WebSocket,
  options: LiveRoomOptions,
): { connected: boolean } {
  const [connected, setConnected] = useState(false);
  const latest = useRef({ open, ...options });
  useEffect(() => {
    latest.current = { open, ...options };
  });
  useEffect(() => {
    if (!room) return;
    let ws: WebSocket | null = null;
    let attempt = 0;
    let retry: ReturnType<typeof setTimeout> | undefined;
    let ping: ReturnType<typeof setInterval> | undefined;
    let stopped = false;
    const connect = () => {
      clearTimeout(retry);
      if (stopped) return;
      const socket = latest.current.open(room);
      ws = socket;
      socket.onopen = () => {
        attempt = 0;
        setConnected(true);
      };
      socket.onmessage = (event) => latest.current.onMessage(String(event.data));
      socket.onclose = () => {
        if (ws !== socket) return;
        ws = null;
        clearInterval(ping);
        setConnected(false);
        latest.current.onDrop?.();
        if (stopped) return;
        retry = setTimeout(connect, reconnectDelay(attempt));
        attempt += 1;
      };
      const frame = latest.current.ping;
      if (frame) {
        clearInterval(ping);
        ping = setInterval(() => {
          if (socket.readyState === WebSocket.OPEN) socket.send(frame);
        }, latest.current.pingMs ?? 30_000);
      }
    };
    const online = () => {
      if (!ws) connect();
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

// ---- Lazy parts the page can load first --------------------------------------------------------

/**
 * A chunk of lazy components that the page can load before it hydrates. React.lazy suspends on its
 * first render, and an update reaching a boundary still suspended makes React drop the server's
 * HTML for the fallback until it renders again, so a chart drawn on the server would lose its
 * height for a moment. The client entry calls `load()` first on a page that needs the chunk; a part
 * made after that renders at once, because its factory answers with an already resolved thenable,
 * which React.lazy reads synchronously.
 */
// oxlint-disable-next-line typescript/no-explicit-any -- React.lazy's own constraint on a component
type AnyComponent = ComponentType<any>;

export function preloadedLazy<M extends Record<string, unknown>>(importer: () => Promise<M>) {
  let loaded: M | undefined;
  let loading: Promise<M> | undefined;
  const load = (): Promise<M> => {
    loading ??= importer().then((m) => (loaded = m));
    return loading;
  };
  type PartName = { [K in keyof M]: M[K] extends AnyComponent ? K : never }[keyof M];
  function part<K extends PartName>(name: K): LazyExoticComponent<Extract<M[K], AnyComponent>> {
    type Part = Extract<M[K], AnyComponent>;
    type Module = { default: Part };
    const pick = (m: M): Module => ({ default: m[name] as Part });
    return lazy<Part>(() => {
      const ready = loaded;
      if (!ready) return load().then(pick);
      const module = pick(ready);
      // oxlint-disable-next-line unicorn/no-thenable -- the point: React.lazy reads an already-resolved thenable synchronously, a Promise would suspend
      return { then: (resolve: (m: Module) => unknown) => resolve(module) } as Promise<Module>;
    });
  }
  return { load, part };
}
