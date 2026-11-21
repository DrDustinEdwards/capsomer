// The parts of an app's React Router glue that are plain logic, so a Worker or a test can use them
// without React. router.react.tsx holds the bindings.
/** The value a search parameter reads as: its default when it is absent. */
function read(params, name, defaults) {
    return params.get(name) ?? defaults[name] ?? "";
}
/**
 * True when the only change between two addresses is in the named display parameters (a view, a
 * grouping, a size): the same path, every other parameter the same, and at least one named one
 * different. A route's `shouldRevalidate` then skips the loader, because nothing it reads changed.
 * A missing parameter reads as its default, so `?view=grid` and the bare address are the same state
 * when grid is the default. Identical addresses are false: a revalidation after an action has the same
 * address on both sides, and skipping it would hide the write. From dustinedwards.info's media
 * library (app/lib/media/view.mjs, onlyDisplayChanged).
 */
export function onlyParamsChanged(current, next, display, defaults = {}) {
    if (current.pathname !== next.pathname)
        return false;
    const a = current.searchParams;
    const b = next.searchParams;
    const names = new Set([...a.keys(), ...b.keys(), ...display]);
    let changed = false;
    for (const name of names) {
        const same = display.includes(name)
            ? read(a, name, defaults) === read(b, name, defaults)
            : a.getAll(name).join("\u0000") === b.getAll(name).join("\u0000");
        if (same)
            continue;
        if (!display.includes(name))
            return false;
        changed = true;
    }
    return changed;
}
