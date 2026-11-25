import { useEffect, useState } from "react";
import { readStored, writeStored } from "../hooks/hooks.ts";
import { selectionOf, sinceOf } from "./state-hooks.ts";

export { newId, parseVersioned, selectionOf, versionedStore } from "./state-hooks.ts";
export type { VersionedStore } from "./state-hooks.ts";

// useMedia, useBrowserZone, useHydrated and useRemembered are in capsomer/react/hooks; route hooks are in capsomer/react/route-hooks. No router, no DOM.

export interface Selection {
  ticked: string[];
  has: (key: string) => boolean;
  toggle: (key: string) => void;
  setAll: (on: boolean) => void;
  all: boolean;
  some: boolean;
}

/** The ticked rows of a list for a bulk bar, kept to the rows still shown. */
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

export function indeterminate(some: boolean): (el: HTMLInputElement | null) => void {
  return (el) => {
    if (el) el.indeterminate = some;
  };
}

/** When this browser last opened the page, as an ISO time: `fallbackMs` (24 h) before `now` on the server and while hydrating, then the stored last visit. Stored once, so the next visit reports from now. */
export function useSinceLastVisit(key: string, now: number, fallbackMs = 86_400_000): string {
  const [since, setSince] = useState(() => sinceOf(null, now, fallbackMs));
  useEffect(() => {
    setSince(sinceOf(readStored(key), now, fallbackMs));
    writeStored(key, new Date(now).toISOString());
    // oxlint-disable-next-line react-hooks/exhaustive-deps -- once after hydration: a later `now` must not rewrite the visit
  }, [key]);
  return since;
}
