export type { DraftEvent, DraftState, SaveQueue } from "./form-hooks.ts";
/** Save-on-change without racing saves: call the returned `change()` from each control's handler.
 * The fall of `saving` to false settles the save in flight and sends any change made meanwhile. */
export declare function useSaveQueue(submit: () => void, saving: boolean): () => void;
/** Whether a form holds edits its last successful save did not cover. Pass the save's answer as
 * `saved` (a new object each save); an edit typed while that save was in flight stays dirty. */
export declare function useDraftDirty(saved: unknown): {
    dirty: boolean;
    edit: () => void;
    submit: () => void;
};
export declare function useDebounced<T>(value: T, ms: number): T;
export interface DebouncedPreview<R> {
    result: R | null;
    error: string | null;
    busy: boolean;
}
/** A preview a beat after the input stops changing. `request` is the serialized input (null asks for
 * nothing); a request overtaken by a newer one is aborted, so a slow answer never lands over a newer one. */
export declare function useDebouncedPreview<R>(request: string | null, read: (request: string, signal: AbortSignal) => Promise<R>, delay?: number): DebouncedPreview<R>;
