export { newId, parseVersioned, selectionOf, versionedStore } from "./state-hooks.ts";
export type { VersionedStore } from "./state-hooks.ts";
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
export declare function useSelection(keys: readonly string[]): Selection;
/** A ref for a select-all checkbox: indeterminate while some, not all, are selected. */
export declare function indeterminate(some: boolean): (el: HTMLInputElement | null) => void;
/**
 * When this browser last opened the page, as an ISO time: `fallbackMs` (24 h) before `now` on the
 * server and while hydrating, then the time this browser stored on its last visit. The visit is
 * stored once, so the next one reports from now. A per-viewer convenience: with storage refused it
 * keeps reporting the fallback window.
 */
export declare function useSinceLastVisit(key: string, now: number, fallbackMs?: number): string;
