import { useCallback, useEffect, useRef, useState } from "react";
import {
  useFetcher,
  useLocation,
  useNavigate,
  useNavigation,
  useRevalidator,
  useRouteLoaderData,
  useSearchParams,
  type FetcherSubmitOptions,
  type SubmitTarget,
} from "react-router";
import { filterParams, pagePending, withParam } from "../form-hooks/form-hooks.ts";

// The hooks that read the address, a fetcher or loader data (React Router 8). The ones that need
// no router are capsomer/react/form-hooks and capsomer/react/state-hooks.

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

// The element id a hash names: percent-decoded, or as written when it is not valid
// percent-encoding ("#%E0"), where decodeURIComponent throws.
function hashId(hash: string): string {
  try {
    return decodeURIComponent(hash);
  } catch {
    return hash;
  }
}

/**
 * Scrolls to the address's `#id` once that element is drawn: sections that load after the page do
 * are not there when the browser looks. Tries each frame for about two seconds, then gives up.
 */
export function useScrollToHash(frames = 120): void {
  const location = useLocation();
  useEffect(() => {
    const id = location.hash.slice(1);
    if (!id) return;
    let tries = 0;
    let raf = 0;
    const seek = () => {
      const el = document.getElementById(hashId(id));
      if (el) el.scrollIntoView();
      else if (tries++ < frames) raf = requestAnimationFrame(seek);
    };
    raf = requestAnimationFrame(seek);
    return () => cancelAnimationFrame(raf);
  }, [location, frames]);
}

/**
 * A choice kept in one search parameter (`?by=word`) that switches at once: while the navigation
 * to the other choice loads, the pending address's value shows, and the loader's answer confirms
 * it. `loaded` is the value the loader read; `choices[0]` is the default.
 */
export function useParamChoice<T extends string>(
  name: string,
  loaded: T,
  choices: readonly T[],
): [T, (next: T) => void] {
  const navigate = useNavigate();
  const location = useLocation();
  const pending = useNavigation().location;
  let shown = loaded;
  if (pending && pending.pathname === location.pathname) {
    const asked = new URLSearchParams(pending.search).get(name);
    shown = choices.find((c) => c === asked) ?? choices[0] ?? loaded;
  }
  const choose = useCallback(
    (next: T) => {
      const params = new URLSearchParams(location.search);
      params.set(name, next);
      void navigate(`${location.pathname}?${params.toString()}`, { preventScrollReset: true });
    },
    [navigate, location.pathname, location.search, name],
  );
  return [shown, choose];
}

/**
 * The site's editable snippets: the root loader hands down `snippets` (key to text), and a missing
 * one falls back to the same in-code default the server uses, so a missing row never breaks a part.
 */
export function createSnippetHook(
  defaults: Readonly<Record<string, string>>,
  { route = "root", field = "snippets" }: { route?: string; field?: string } = {},
): (key: string, fallback?: string) => string {
  return function useSnippet(key, fallback = "") {
    const data = useRouteLoaderData(route) as Record<string, unknown> | undefined;
    const map = data?.[field] as Record<string, string> | undefined;
    return map?.[key] ?? defaults[key] ?? fallback;
  };
}
