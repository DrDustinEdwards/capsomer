import { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate, useNavigation, useRouteLoaderData } from "react-router";
import { readPref, writePref } from "../shell/shell.ts";
import { selectionOf, sinceOf } from "./state-hooks.ts";

export { newId, parseVersioned, selectionOf, versionedStore } from "./state-hooks.ts";
export type { VersionedStore } from "./state-hooks.ts";

// useMedia, useBrowserZone, useHydrated and useRemembered are capsomer/react/hooks.

export interface Selection {
  /** The selected keys among those shown, in their order. */
  ticked: string[];
  has: (key: string) => boolean;
  toggle: (key: string) => void;
  /** Selects every shown key, or none. */
  setAll: (on: boolean) => void;
  /** Every shown key is selected. */
  all: boolean;
  /** Some, not all: the select-all box is indeterminate. */
  some: boolean;
}

/**
 * The ticked rows of a list for a bulk bar, kept to the rows still shown: a row that leaves the
 * list (decided, filtered out) leaves the selection with it.
 */
export function useSelection(keys: readonly string[]): Selection {
  const [selected, setSelected] = useState<ReadonlySet<string>>(() => new Set());
  const { ticked, all, some } = selectionOf(selected, keys);
  return {
    ticked,
    has: (k) => selected.has(k) && keys.includes(k),
    toggle: (k) =>
      setSelected((s) => {
        const next = new Set(s);
        if (next.has(k)) next.delete(k);
        else next.add(k);
        return next;
      }),
    setAll: (on) => setSelected(on ? new Set(keys) : new Set()),
    all,
    some,
  };
}

/** A ref for a select-all checkbox: indeterminate while some, not all, are selected. */
export function indeterminate(some: boolean): (el: HTMLInputElement | null) => void {
  return (el) => {
    if (el) el.indeterminate = some;
  };
}

/**
 * When this browser last opened the page, as an ISO time: `fallbackMs` (24 h) before `now` on the
 * server and while hydrating, then the time this browser stored on its last visit. The visit is
 * stored once, so the next one reports from now. A per-viewer convenience: with storage refused it
 * keeps reporting the fallback window.
 */
export function useSinceLastVisit(key: string, now: number, fallbackMs = 86_400_000): string {
  const [since, setSince] = useState(() => sinceOf(null, now, fallbackMs));
  useEffect(() => {
    setSince(sinceOf(readPref(key), now, fallbackMs));
    writePref(key, new Date(now).toISOString());
    // oxlint-disable-next-line react-hooks/exhaustive-deps -- once after hydration: a later `now` must not rewrite the visit
  }, [key]);
  return since;
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
      const el = document.getElementById(decodeURIComponent(id));
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
