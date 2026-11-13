/**
 * True when the only change between two addresses is in the named display parameters (a view, a
 * grouping, a size): the same path, every other parameter the same, and at least one named one
 * different. A route's `shouldRevalidate` then skips the loader, because nothing it reads changed.
 * A missing parameter reads as its default, so `?view=grid` and the bare address are the same state
 * when grid is the default. Identical addresses are false: a revalidation after an action has the same
 * address on both sides, and skipping it would hide the write. From dustinedwards.info's media
 * library (app/lib/media/view.mjs, onlyDisplayChanged).
 */
export declare function onlyParamsChanged(current: URL, next: URL, display: readonly string[], defaults?: Readonly<Record<string, string>>): boolean;
