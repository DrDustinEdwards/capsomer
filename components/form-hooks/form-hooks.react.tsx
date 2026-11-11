import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import {
  useFetcher,
  useLocation,
  useNavigate,
  useNavigation,
  useRevalidator,
  useSearchParams,
  type FetcherSubmitOptions,
  type SubmitTarget,
} from "react-router";
import {
  CLEAN_DRAFT,
  createSaveQueue,
  draftAfter,
  draftDirty,
  filterParams,
  pagePending,
  withParam,
  type SaveQueue,
} from "./form-hooks.ts";

export { createSaveQueue, draftAfter, draftDirty, pagePending } from "./form-hooks.ts";
export type { DraftEvent, DraftState, SaveQueue } from "./form-hooks.ts";

/**
 * Save-on-change without racing saves: call the returned `change()` from each control's handler.
 * `submit` posts the form as it stands; `saving` is the fetcher's or navigation's busy state, and
 * its fall to false settles the save in flight and sends any change made meanwhile.
 */
export function useSaveQueue(submit: () => void, saving: boolean): () => void {
  const send = useRef(submit);
  useEffect(() => {
    send.current = submit;
  });
  const queue = useRef<SaveQueue | null>(null);
  queue.current ??= createSaveQueue(() => send.current());
  const wasSaving = useRef(saving);
  useEffect(() => {
    if (wasSaving.current && !saving) queue.current?.settled();
    wasSaving.current = saving;
  }, [saving]);
  return useCallback(() => queue.current?.change(), []);
}

/**
 * A result shown for `ms` and then dropped: "Saved." under a form, a bulk result line. A new value
 * (by identity) shows again. `clears` says which values go on their own; the rest (a failure) stay
 * until `dismiss()` or the next value, since a failure that vanishes on a timer fails WCAG 2.2.1.
 */
export function useTransient<T>(
  value: T,
  ms: number,
  clears: (value: NonNullable<T>) => boolean = () => true,
): [NonNullable<T> | undefined, () => void] {
  const [dismissed, setDismissed] = useState<unknown>(undefined);
  const goes = useRef(clears);
  useEffect(() => {
    goes.current = clears;
  });
  useEffect(() => {
    if (value === undefined || value === null || !goes.current(value)) return;
    const timer = setTimeout(() => setDismissed(value), ms);
    return () => clearTimeout(timer);
  }, [value, ms]);
  const dismiss = useCallback(() => setDismissed(value), [value]);
  const shown = value === undefined || value === null || dismissed === value ? undefined : value;
  return [shown as NonNullable<T> | undefined, dismiss];
}

/**
 * A flag that turns itself off `ms` after it was last turned on: "Copied" on a copy button.
 * Turning it on again restarts the wait; the timer is cleared when the part unmounts.
 */
export function useAutoDismiss(ms: number): [boolean, () => void] {
  const [shownAt, setShownAt] = useState(0);
  useEffect(() => {
    if (!shownAt) return;
    const timer = setTimeout(() => setShownAt(0), ms);
    return () => clearTimeout(timer);
  }, [shownAt, ms]);
  const show = useCallback(() => setShownAt((n) => n + 1), []);
  return [shownAt > 0, show];
}

/**
 * Whether a form holds edits its last successful save did not cover. Call `edit()` from the form's
 * change handler and `submit()` from its submit; pass the save's answer as `saved` when it
 * succeeded (a new object each save), and an edit typed while that save was in flight stays dirty.
 */
export function useDraftDirty(saved: unknown): {
  dirty: boolean;
  edit: () => void;
  submit: () => void;
} {
  const [draft, dispatch] = useReducer(draftAfter, CLEAN_DRAFT);
  useEffect(() => {
    if (saved) dispatch({ type: "saved" });
  }, [saved]);
  return {
    dirty: draftDirty(draft),
    edit: useCallback(() => dispatch({ type: "edit" }), []),
    submit: useCallback(() => dispatch({ type: "submit" }), []),
  };
}

/** `value`, once it has held still for `ms`. The first render answers it at once. */
export function useDebounced<T>(value: T, ms: number): T {
  const [settled, setSettled] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setSettled(value), ms);
    return () => clearTimeout(timer);
  }, [value, ms]);
  return settled;
}

export interface DebouncedPreview<R> {
  /** The newest answer that landed, kept while a newer request is waiting or reading. */
  result: R | null;
  /** The newest failure's message, cleared by the next answer. */
  error: string | null;
  /** The current request has not settled yet. */
  busy: boolean;
}

/**
 * A preview a beat after the input stops changing: the server's rendering of a form, a search as
 * you type. `request` is the serialized input (null asks for nothing); `read` fetches it, and a
 * request overtaken by a newer one is aborted, so a slow answer never lands over a newer one.
 * `busy` is derived: the current request is not yet the one an answer settled.
 */
export function useDebouncedPreview<R>(
  request: string | null,
  read: (request: string, signal: AbortSignal) => Promise<R>,
  delay = 900,
): DebouncedPreview<R> {
  const [result, setResult] = useState<R | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [settled, setSettled] = useState<string | null>(null);
  const reader = useRef(read);
  useEffect(() => {
    reader.current = read;
  });
  useEffect(() => {
    if (request === null) return;
    const abort = new AbortController();
    const timer = setTimeout(() => {
      reader
        .current(request, abort.signal)
        .then(
          (answer) => {
            if (abort.signal.aborted) return;
            setResult(answer);
            setError(null);
          },
          (e: unknown) => {
            if (abort.signal.aborted) return;
            setError(e instanceof Error ? e.message : String(e));
          },
        )
        .finally(() => {
          if (!abort.signal.aborted) setSettled(request);
        });
    }, delay);
    return () => {
      clearTimeout(timer);
      abort.abort();
    };
  }, [request, delay]);
  return { result, error, busy: request !== null && request !== settled };
}

/** What a fetcher for the action `D` holds once it is idle (undefined before its first answer). */
export type FetcherData<D> = ReturnType<typeof useFetcher<D>>["data"];

/**
 * A fetcher submit that answers a promise: for a toast's Undo or a dialog's perform, which wait for
 * the result. Resolves with the action's data once the fetcher is idle again. One at a time: a
 * second call while one is running is refused with `busyMessage`.
 */
export function useFetcherPromise<D>({
  key,
  busyMessage = "Another request is still running. Try again in a moment.",
}: { key?: string; busyMessage?: string } = {}): (
  target: SubmitTarget,
  options?: FetcherSubmitOptions,
) => Promise<FetcherData<D>> {
  const fetcher = useFetcher<D>(key ? { key } : undefined);
  const waiting = useRef<((data: FetcherData<D>) => void) | null>(null);
  const started = useRef(false);
  const { submit, state, data } = fetcher;
  useEffect(() => {
    if (state !== "idle") {
      started.current = true;
      return;
    }
    if (!waiting.current || !started.current) return;
    const settle = waiting.current;
    waiting.current = null;
    started.current = false;
    settle(data);
  }, [state, data]);
  return useCallback(
    (target, options) =>
      new Promise<FetcherData<D>>((resolve, reject) => {
        if (waiting.current) {
          reject(new Error(busyMessage));
          return;
        }
        waiting.current = resolve;
        started.current = false;
        void submit(target, { method: "post", ...options });
      }),
    [submit, busyMessage],
  );
}

/**
 * A dialog or panel the address opens: `?add=person`. A link to `href(value)` opens it (and works
 * before the page's script runs, where the page shows the same form as a panel); `close()` takes
 * the parameter off, replacing the history entry and keeping the scroll.
 */
export function useUrlDialog(name: string): {
  value: string | null;
  href: (value: string | null) => string;
  close: () => void;
  onOpenChange: (open: boolean) => void;
} {
  const { pathname, search } = useLocation();
  const navigate = useNavigate();
  const value = new URLSearchParams(search).get(name);
  const href = useCallback(
    (next: string | null) => withParam(pathname, search, name, next),
    [pathname, search, name],
  );
  const close = useCallback(() => {
    void navigate(withParam(pathname, search, name, null), {
      replace: true,
      preventScrollReset: true,
    });
  }, [navigate, pathname, search, name]);
  const onOpenChange = useCallback(
    (open: boolean) => {
      if (!open) close();
    },
    [close],
  );
  return { value, href, close, onOpenChange };
}

export interface UrlFilters<K extends string> {
  /** The filter the address holds, every name present ("" when unset). */
  applied: Record<K, string>;
  /** What the fields hold; it follows the address when the address changes (back, a link). */
  input: Record<K, string>;
  setInput: (patch: Partial<Record<K, string>>) => void;
  /** Puts `next` (the fields by default) in the address, replacing the history entry. */
  apply: (next?: Partial<Record<K, string>>) => void;
  /** Whether any filter is applied. */
  active: boolean;
  /** One string for the applied filter, for a query key. */
  key: string;
}

/**
 * A filter kept in the address, so a view can be reloaded or shared: the fields are local state
 * that apply on submit. `keep` names other parameters the filter leaves in place (a tab); `fixed`
 * sets parameters every filtered address carries.
 */
export function useUrlFilters<K extends string>(
  names: readonly K[],
  {
    keep = [],
    fixed = {},
  }: { keep?: readonly string[]; fixed?: Readonly<Record<string, string>> } = {},
): UrlFilters<K> {
  const [params, setParams] = useSearchParams();
  const applied = Object.fromEntries(names.map((n) => [n, params.get(n) ?? ""])) as Record<
    K,
    string
  >;
  const key = names.map((n) => applied[n]).join("\u0000");
  const [input, setInputState] = useState(applied);
  // The address changed: the fields follow it. Adjusted while rendering, not in an effect.
  const [seen, setSeen] = useState(key);
  if (seen !== key) {
    setSeen(key);
    setInputState(applied);
  }
  const setInput = useCallback(
    (patch: Partial<Record<K, string>>) => setInputState((s) => ({ ...s, ...patch })),
    [],
  );
  const apply = (next?: Partial<Record<K, string>>) => {
    const values = { ...input, ...next } as Record<string, string>;
    setParams((from) => filterParams(from, values, keep, fixed), {
      replace: true,
      preventScrollReset: true,
    });
  };
  return { applied, input, setInput, apply, active: names.some((n) => applied[n] !== ""), key };
}

/** Whether this page's own data is being read again, not whether the reader is leaving it. */
export function usePagePending(pathname?: string): boolean {
  const navigation = useNavigation();
  const { state } = useRevalidator();
  const here = useLocation().pathname;
  return pagePending(navigation, state, pathname ?? here);
}
