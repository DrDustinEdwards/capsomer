export interface SaveQueue {
    change(): void;
    settled(): void;
}
/** Saves on every change without two saves racing. The controls stay enabled during a save (disabling
 * the focused one throws focus to the body), so a change can arrive mid-save; it is held and one more
 * save is sent after the first settles. `submit` posts what the controls show then, so the last value wins. */
export declare function createSaveQueue(submit: () => void): SaveQueue;
export interface DraftState {
    edits: number;
    submitted: number;
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
export declare function draftAfter(state: DraftState, event: DraftEvent): DraftState;
export declare function draftDirty(state: DraftState): boolean;
export declare function filterParams(from: URLSearchParams, values: Readonly<Record<string, string>>, keep?: readonly string[], fixed?: Readonly<Record<string, string>>): URLSearchParams;
export declare function withParam(pathname: string, search: string, name: string, value: string | null): string;
/** Whether a page's own data is being read again (revalidation, or a navigation to this same page;
 * "/a/" is the same page as "/a"), not whether the reader is leaving for another page. */
export declare function pagePending(navigation: {
    state: string;
    location?: {
        pathname: string;
    };
}, revalidatorState: string, pathname: string): boolean;
