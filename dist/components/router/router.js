// The plain-logic parts of an app's React Router glue, usable by a Worker or a test without React.
/** The value a search parameter reads as: its default when it is absent. */
function read(params, name, defaults) {
    return params.get(name) ?? defaults[name] ?? "";
}
/**
 * True when the only change between two addresses is in the named display parameters: same path,
 * every other parameter the same, at least one named one different. A missing parameter reads as its
 * default. Identical addresses are false: a revalidation after an action has the same address on both
 * sides, and skipping it would hide the write.
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
