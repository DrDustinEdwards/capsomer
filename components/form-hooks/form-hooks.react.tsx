import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { errorText } from "../dialog/dialog.ts";
import {
  CLEAN_DRAFT,
  createSaveQueue,
  draftAfter,
  draftDirty,
  type SaveQueue,
} from "./form-hooks.ts";

// No router and no DOM here, so a React Native app's shared client uses these too. The hooks that
// read the address, a fetcher or loader data are capsomer/react/route-hooks.
export type { DraftEvent, DraftState, SaveQueue } from "./form-hooks.ts";

/**
 * Save-on-change without racing saves: call the returned `change()` from each control's handler.
 * `submit` posts the form as it stands; `saving` is the fetcher's or navigation's busy state, and
 * its fall to false settles the save in flight and sends any change made meanwhile.
 */
export function useSaveQueue(submit: () => void, saving: boolean): () => void {
  const send = useRef(submit);
  useEffect(() => {
    send.current = submit;
  });
  const queue = useRef<SaveQueue | null>(null);
  queue.current ??= createSaveQueue(() => send.current());
  const wasSaving = useRef(saving);
  useEffect(() => {
    if (wasSaving.current && !saving) queue.current?.settled();
    wasSaving.current = saving;
  }, [saving]);
  return useCallback(() => queue.current?.change(), []);
}

/**
 * Whether a form holds edits its last successful save did not cover. Call `edit()` from the form's
 * change handler and `submit()` from its submit; pass the save's answer as `saved` when it
 * succeeded (a new object each save), and an edit typed while that save was in flight stays dirty.
 */
export function useDraftDirty(saved: unknown): {
  dirty: boolean;
  edit: () => void;
  submit: () => void;
} {
  const [draft, dispatch] = useReducer(draftAfter, CLEAN_DRAFT);
  useEffect(() => {
    if (saved) dispatch({ type: "saved" });
  }, [saved]);
  return {
    dirty: draftDirty(draft),
    edit: useCallback(() => dispatch({ type: "edit" }), []),
    submit: useCallback(() => dispatch({ type: "submit" }), []),
  };
}

/** `value`, once it has held still for `ms`. The first render answers it at once. */
export function useDebounced<T>(value: T, ms: number): T {
  const [settled, setSettled] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setSettled(value), ms);
    return () => clearTimeout(timer);
  }, [value, ms]);
  return settled;
}

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
export function useDebouncedPreview<R>(
  request: string | null,
  read: (request: string, signal: AbortSignal) => Promise<R>,
  delay = 900,
): DebouncedPreview<R> {
  const [result, setResult] = useState<R | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [settled, setSettled] = useState<string | null>(null);
  const reader = useRef(read);
  useEffect(() => {
    reader.current = read;
  });
  useEffect(() => {
    if (request === null) return;
    const abort = new AbortController();
    const timer = setTimeout(() => {
      reader
        .current(request, abort.signal)
        .then(
          (answer) => {
            if (abort.signal.aborted) return;
            setResult(answer);
            setError(null);
          },
          (e: unknown) => {
            if (abort.signal.aborted) return;
            setError(errorText(e));
          },
        )
        .finally(() => {
          if (!abort.signal.aborted) setSettled(request);
        });
    }, delay);
    return () => {
      clearTimeout(timer);
      abort.abort();
    };
  }, [request, delay]);
  return { result, error, busy: request !== null && request !== settled };
}
