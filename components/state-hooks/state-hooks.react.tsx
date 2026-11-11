import { useEffect, useState } from "react";
import { readStoredText, selectionOf, sinceOf, writeStoredText } from "./state-hooks.ts";

export { newId, parseVersioned, selectionOf, versionedStore } from "./state-hooks.ts";
export type { VersionedStore } from "./state-hooks.ts";

// useMedia, useBrowserZone, useHydrated and useRemembered are capsomer/react/hooks; the hooks that
// read the address or loader data are capsomer/react/route-hooks. No router and no DOM here.

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
    setSince(sinceOf(readStoredText(key), now, fallbackMs));
    writeStoredText(key, new Date(now).toISOString());
    // oxlint-disable-next-line react-hooks/exhaustive-deps -- once after hydration: a later `now` must not rewrite the visit
  }, [key]);
  return since;
}
