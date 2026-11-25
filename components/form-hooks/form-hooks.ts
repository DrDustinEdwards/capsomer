// The pure parts of the form and async hooks (form-hooks.react.tsx): no framework, so a page without
// React and a unit test use them too.

export interface SaveQueue {
  change(): void;
  settled(): void;
}

/** Saves on every change without two saves racing. The controls stay enabled during a save (disabling
 * the focused one throws focus to the body), so a change can arrive mid-save; it is held and one more
 * save is sent after the first settles. `submit` posts what the controls show then, so the last value wins. */
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

export interface DraftState {
  edits: number;
  submitted: number;
  saved: number;
}

export type DraftEvent = { type: "edit" } | { type: "submit" } | { type: "saved" };

export const CLEAN_DRAFT: DraftState = { edits: 0, submitted: 0, saved: 0 };

export function draftAfter(state: DraftState, event: DraftEvent): DraftState {
  if (event.type === "edit") return { ...state, edits: state.edits + 1 };
  if (event.type === "submit") return { ...state, submitted: state.edits };
  return { ...state, saved: state.submitted };
}

export function draftDirty(state: DraftState): boolean {
  return state.edits !== state.saved;
}

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

/** Whether a page's own data is being read again (revalidation, or a navigation to this same page;
 * "/a/" is the same page as "/a"), not whether the reader is leaving for another page. */
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
