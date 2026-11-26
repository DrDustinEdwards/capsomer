import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { errorText } from "../dialog/dialog.js";
import { CLEAN_DRAFT, createSaveQueue, draftAfter, draftDirty, } from "./form-hooks.js";
/** Save-on-change without racing saves: call the returned `change()` from each control's handler.
 * The fall of `saving` to false settles the save in flight and sends any change made meanwhile. */
export function useSaveQueue(submit, saving) {
    const send = useRef(submit);
    useEffect(() => {
        send.current = submit;
    });
    const queue = useRef(null);
    useEffect(() => {
        queue.current = createSaveQueue(() => send.current());
    }, []);
    const wasSaving = useRef(saving);
    useEffect(() => {
        if (wasSaving.current && !saving)
            queue.current?.settled();
        wasSaving.current = saving;
    }, [saving]);
    return useCallback(() => queue.current?.change(), []);
}
/** Whether a form holds edits its last successful save did not cover. Pass the save's answer as
 * `saved` (a new object each save); an edit typed while that save was in flight stays dirty. */
export function useDraftDirty(saved) {
    const [draft, dispatch] = useReducer(draftAfter, CLEAN_DRAFT);
    useEffect(() => {
        if (saved)
            dispatch({ type: "saved" });
    }, [saved]);
    return {
        dirty: draftDirty(draft),
        edit: useCallback(() => dispatch({ type: "edit" }), []),
        submit: useCallback(() => dispatch({ type: "submit" }), []),
    };
}
export function useDebounced(value, ms) {
    const [settled, setSettled] = useState(value);
    useEffect(() => {
        const timer = setTimeout(() => setSettled(value), ms);
        return () => clearTimeout(timer);
    }, [value, ms]);
    return settled;
}
/** A preview a beat after the input stops changing. `request` is the serialized input (null asks for
 * nothing); a request overtaken by a newer one is aborted, so a slow answer never lands over a newer one. */
export function useDebouncedPreview(request, read, delay = 900) {
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);
    const [settled, setSettled] = useState(null);
    const reader = useRef(read);
    useEffect(() => {
        reader.current = read;
    });
    useEffect(() => {
        if (request === null)
            return;
        const abort = new AbortController();
        const timer = setTimeout(() => {
            reader
                .current(request, abort.signal)
                .then((answer) => {
                if (abort.signal.aborted)
                    return;
                setResult(answer);
                setError(null);
            }, (e) => {
                if (abort.signal.aborted)
                    return;
                setError(errorText(e));
            })
                .finally(() => {
                if (!abort.signal.aborted)
                    setSettled(request);
            });
        }, delay);
        return () => {
            clearTimeout(timer);
            abort.abort();
        };
    }, [request, delay]);
    return { result, error, busy: request !== null && request !== settled };
}
