/** One more save is owed or sent: a change while a save is in flight waits for it to settle. */
export interface SaveQueue {
    /** A control changed. Saves now, or marks one more save as owed. */
    change(): void;
    /** The save in flight finished. Sends the owed save, if any. */
    settled(): void;
}
/**
 * Saves on every change without two saves racing. A form that saves as each control changes keeps
 * its controls enabled during a save (disabling the control that has focus throws focus to the page
 * body), so a change can arrive mid-save. Sending a second request at once would let two saves land
 * in either order; this holds every change made mid-save and sends one more save after the first
 * settles. `submit` posts what the controls show at that moment, so the last value wins.
 */
export declare function createSaveQueue(submit: () => void): SaveQueue;
/** Counts that say whether a draft holds edits its last successful save did not cover. */
export interface DraftState {
    /** Edits since the page loaded. */
    edits: number;
    /** The edit count when the last save was sent. */
    submitted: number;
    /** The edit count the last successful save covered. */
    saved: number;
}
export type DraftEvent = {
    type: "edit";
} | {
    type: "submit";
} | {
    type: "saved";
};
export declare const CLEAN_DRAFT: DraftState;
/** The reducer: an edit typed while a save is in flight stays unsaved after that save lands. */
export declare function draftAfter(state: DraftState, event: DraftEvent): DraftState;
export declare function draftDirty(state: DraftState): boolean;
/** Search parameters with `values` set (trimmed, empty ones dropped) over the `keep` names of `from`. */
export declare function filterParams(from: URLSearchParams, values: Readonly<Record<string, string>>, keep?: readonly string[], fixed?: Readonly<Record<string, string>>): URLSearchParams;
/** The address `pathname?search` with `name` set to `value`, or removed when it is null. */
export declare function withParam(pathname: string, search: string, name: string, value: string | null): string;
/**
 * Whether a page's own data is being read again (the revalidator, or a navigation that lands on
 * this same page), not whether the reader is leaving for another page. "/a/" is the same page as
 * "/a".
 */
export declare function pagePending(navigation: {
    state: string;
    location?: {
        pathname: string;
    };
}, revalidatorState: string, pathname: string): boolean;
