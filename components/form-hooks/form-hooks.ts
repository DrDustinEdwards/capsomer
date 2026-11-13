// The pure parts of the form and async hooks (form-hooks.react.tsx): no framework, so a page without
// React and a unit test use them too.

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
export function createSaveQueue(submit: () => void): SaveQueue {
  let inFlight = false;
  let owed = false;
  return {
    change() {
      if (inFlight) {
        owed = true;
        return;
      }
      inFlight = true;
      submit();
    },
    settled() {
      inFlight = false;
      if (!owed) return;
      owed = false;
      inFlight = true;
      submit();
    },
  };
}

/** Counts that say whether a draft holds edits its last successful save did not cover. */
export interface DraftState {
  /** Edits since the page loaded. */
  edits: number;
  /** The edit count when the last save was sent. */
  submitted: number;
  /** The edit count the last successful save covered. */
  saved: number;
}

export type DraftEvent = { type: "edit" } | { type: "submit" } | { type: "saved" };

export const CLEAN_DRAFT: DraftState = { edits: 0, submitted: 0, saved: 0 };

/** The reducer: an edit typed while a save is in flight stays unsaved after that save lands. */
export function draftAfter(state: DraftState, event: DraftEvent): DraftState {
  if (event.type === "edit") return { ...state, edits: state.edits + 1 };
  if (event.type === "submit") return { ...state, submitted: state.edits };
  return { ...state, saved: state.submitted };
}

export function draftDirty(state: DraftState): boolean {
  return state.edits !== state.saved;
}

/** Search parameters with `values` set (trimmed, empty ones dropped) over the `keep` names of `from`. */
export function filterParams(
  from: URLSearchParams,
  values: Readonly<Record<string, string>>,
  keep: readonly string[] = [],
  fixed: Readonly<Record<string, string>> = {},
): URLSearchParams {
  const next = new URLSearchParams();
  for (const name of keep) for (const v of from.getAll(name)) next.append(name, v);
  for (const [name, v] of Object.entries(fixed)) next.set(name, v);
  for (const [name, v] of Object.entries(values)) {
    const trimmed = v.trim();
    if (trimmed) next.set(name, trimmed);
  }
  return next;
}

/** The address `pathname?search` with `name` set to `value`, or removed when it is null. */
export function withParam(
  pathname: string,
  search: string,
  name: string,
  value: string | null,
): string {
  const params = new URLSearchParams(search);
  if (value === null) params.delete(name);
  else params.set(name, value);
  const qs = params.toString();
  return qs ? `${pathname}?${qs}` : pathname;
}

/**
 * Whether a page's own data is being read again (the revalidator, or a navigation that lands on
 * this same page), not whether the reader is leaving for another page. "/a/" is the same page as
 * "/a".
 */
export function pagePending(
  navigation: { state: string; location?: { pathname: string } },
  revalidatorState: string,
  pathname: string,
): boolean {
  if (revalidatorState === "loading") return true;
  if (navigation.state !== "loading" || !navigation.location) return false;
  return trimSlash(navigation.location.pathname) === trimSlash(pathname);
}

function trimSlash(path: string): string {
  return path.length > 1 ? path.replace(/\/+$/, "") || "/" : path;
}
