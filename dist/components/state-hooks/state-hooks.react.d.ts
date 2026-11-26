export { newId, parseVersioned, selectionOf, versionedStore } from "./state-hooks.ts";
export type { VersionedStore } from "./state-hooks.ts";
export interface Selection {
    ticked: string[];
    has: (key: string) => boolean;
    toggle: (key: string) => void;
    setAll: (on: boolean) => void;
    all: boolean;
    some: boolean;
}
/** The ticked rows of a list for a bulk bar, kept to the rows still shown. */
export declare function useSelection(keys: readonly string[]): Selection;
export declare function indeterminate(some: boolean): (el: HTMLInputElement | null) => void;
/** When this browser last opened the page, as an ISO time: `fallbackMs` (24 h) before `now` on the server and while hydrating, then the stored last visit. Stored once, so the next visit reports from now. */
export declare function useSinceLastVisit(key: string, now: number, fallbackMs?: number): string;
