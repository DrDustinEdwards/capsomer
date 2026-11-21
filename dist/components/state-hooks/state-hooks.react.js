import { useEffect, useState } from "react";
import { readStored, writeStored } from "../hooks/hooks.js";
import { selectionOf, sinceOf } from "./state-hooks.js";
export { newId, parseVersioned, selectionOf, versionedStore } from "./state-hooks.js";
/**
 * The ticked rows of a list for a bulk bar, kept to the rows still shown: a row that leaves the
 * list (decided, filtered out) leaves the selection with it.
 */
export function useSelection(keys) {
    const [selected, setSelected] = useState(() => new Set());
    const { ticked, all, some } = selectionOf(selected, keys);
    return {
        ticked,
        has: (k) => selected.has(k) && keys.includes(k),
        toggle: (k) => setSelected((s) => {
            const next = new Set(s);
            if (next.has(k))
                next.delete(k);
            else
                next.add(k);
            return next;
        }),
        setAll: (on) => setSelected(on ? new Set(keys) : new Set()),
        all,
        some,
    };
}
/** A ref for a select-all checkbox: indeterminate while some, not all, are selected. */
export function indeterminate(some) {
    return (el) => {
        if (el)
            el.indeterminate = some;
    };
}
/**
 * When this browser last opened the page, as an ISO time: `fallbackMs` (24 h) before `now` on the
 * server and while hydrating, then the time this browser stored on its last visit. The visit is
 * stored once, so the next one reports from now. A per-viewer convenience: with storage refused it
 * keeps reporting the fallback window.
 */
export function useSinceLastVisit(key, now, fallbackMs = 86_400_000) {
    const [since, setSince] = useState(() => sinceOf(null, now, fallbackMs));
    useEffect(() => {
        setSince(sinceOf(readStored(key), now, fallbackMs));
        writeStored(key, new Date(now).toISOString());
        // oxlint-disable-next-line react-hooks/exhaustive-deps -- once after hydration: a later `now` must not rewrite the visit
    }, [key]);
    return since;
}
