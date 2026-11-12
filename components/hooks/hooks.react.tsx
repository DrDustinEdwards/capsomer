import { Suspense, useCallback, useId, useMemo, useSyncExternalStore, type ReactNode } from "react";
import { readStored, subscribeStored, writeStored } from "./hooks.ts";

export { cn } from "./hooks.ts";

// Every hook here reads the browser through useSyncExternalStore with a server snapshot, so the
// server's HTML and the render that hydrates it agree (no React #418), and the browser's value
// arrives in the next render with no effect setting state.

const noSubscribe = () => () => {};

/** React's useId with only letters and digits, safe in an id, a selector and an anchor (React's own has colons). */
export function useCleanId(): string {
  return useId().replace(/[^a-zA-Z0-9]/g, "");
}

/** False on the server and in the render that hydrates; true after, and at once for a part first drawn in the browser. */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    noSubscribe,
    () => true,
    () => false,
  );
}

/** `fallback` on the server and while hydrating, then `children` (in Suspense, for a lazy import). For window-only libraries; the fallback is the accessible text equivalent. */
export function ClientOnly({ children, fallback }: { children: ReactNode; fallback: ReactNode }) {
  if (!useHydrated()) return <>{fallback}</>;
  return <Suspense fallback={fallback}>{children}</Suspense>;
}

/** Whether a media query matches; `serverValue` (false) on the server and while hydrating. */
export function useMedia(query: string, serverValue = false): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const mq = window.matchMedia(query);
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    },
    [query],
  );
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => serverValue,
  );
}

/** True when the reader asked for less motion. A script-driven motion checks it; CSS motion sits in its own media query. */
export function usePrefersReducedMotion(): boolean {
  return useMedia("(prefers-reduced-motion: reduce)");
}

/** The browser's time zone once hydrated; `fallback` (the server's) until then. */
export function useBrowserZone<T extends string | null>(fallback: T): string | T {
  return useSyncExternalStore(
    noSubscribe,
    () => Intl.DateTimeFormat().resolvedOptions().timeZone || fallback,
    () => fallback,
  );
}

/**
 * A value remembered in this browser under `key` (null on the server, while hydrating, or when none
 * is kept) and its setter (null forgets it). Every reader of the key on the page, and in other tabs,
 * follows a change. Where storage is refused it is kept for this page only.
 */
export function useRemembered(key: string): [string | null, (value: string | null) => void] {
  const value = useSyncExternalStore(
    subscribeStored,
    () => readStored(key),
    () => null,
  );
  const remember = useCallback((next: string | null) => writeStored(key, next), [key]);
  return [value, remember];
}

/**
 * The time now, in milliseconds, ticking every `ms` (30 s) once the page is live; 0 on the server
 * and while hydrating, so a time measured against it says the same words in both renders. Pass the
 * server's own read time as `serverNow` to draw against it until the clock starts.
 */
export function useNow(ms = 30_000, serverNow = 0): number {
  const clock = useMemo(() => createClock(ms, serverNow), [ms, serverNow]);
  return useSyncExternalStore(clock.subscribe, clock.read, () => serverNow);
}

function createClock(ms: number, start: number) {
  let now = start;
  return {
    subscribe(onChange: () => void) {
      now = Date.now();
      onChange();
      const t = setInterval(() => {
        now = Date.now();
        onChange();
      }, ms);
      return () => clearInterval(t);
    },
    read: () => now,
  };
}
