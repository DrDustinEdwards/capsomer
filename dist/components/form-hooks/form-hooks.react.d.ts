export type { DraftEvent, DraftState, SaveQueue } from "./form-hooks.ts";
/**
 * Save-on-change without racing saves: call the returned `change()` from each control's handler.
 * `submit` posts the form as it stands; `saving` is the fetcher's or navigation's busy state, and
 * its fall to false settles the save in flight and sends any change made meanwhile.
 */
export declare function useSaveQueue(submit: () => void, saving: boolean): () => void;
/**
 * Whether a form holds edits its last successful save did not cover. Call `edit()` from the form's
 * change handler and `submit()` from its submit; pass the save's answer as `saved` when it
 * succeeded (a new object each save), and an edit typed while that save was in flight stays dirty.
 */
export declare function useDraftDirty(saved: unknown): {
    dirty: boolean;
    edit: () => void;
    submit: () => void;
};
/** `value`, once it has held still for `ms`. The first render answers it at once. */
export declare function useDebounced<T>(value: T, ms: number): T;
export interface DebouncedPreview<R> {
    /** The newest answer that landed, kept while a newer request is waiting or reading. */
    result: R | null;
    /** The newest failure's message, cleared by the next answer. */
    error: string | null;
    /** The current request has not settled yet. */
    busy: boolean;
}
/**
 * A preview a beat after the input stops changing: the server's rendering of a form, a search as
 * you type. `request` is the serialized input (null asks for nothing); `read` fetches it, and a
 * request overtaken by a newer one is aborted, so a slow answer never lands over a newer one.
 * `busy` is derived: the current request is not yet the one an answer settled.
 */
export declare function useDebouncedPreview<R>(request: string | null, read: (request: string, signal: AbortSignal) => Promise<R>, delay?: number): DebouncedPreview<R>;
