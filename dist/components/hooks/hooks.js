// Small helpers every React app in the network wrote its own copy of. No framework here: the React
// hooks are in hooks.react.tsx.
/** Joins class names, dropping the empty ones: `cn("cap-btn", busy && "is-busy")`. No merging. */
export function cn(...parts) {
    return parts.filter(Boolean).join(" ");
}
/** `n` held to `lo` to `hi`; where `hi` is under `lo`, `lo`. */
export function clamp(n, lo, hi) {
    return Math.max(lo, Math.min(n, Math.max(lo, hi)));
}
/** "A, B and C", the family's list (no comma before "and"): the platform's own, in the English that has none. */
export function listText(words) {
    return new Intl.ListFormat("en-GB").format(words);
}
/** A count with its noun: `plural(1, "post")` is "1 post", `plural(3, "post")` "3 posts"; an irregular noun passes its plural. */
export function plural(n, one, many = `${one}s`) {
    return `${n} ${n === 1 ? one : many}`;
}
let ids = 0;
/** A new id on every call, `prefix-1`, `prefix-2`: for a part a script gives an id to. */
export function uid(prefix) {
    ids += 1;
    return `${prefix}-${ids}`;
}
// A value kept in this browser. localStorage where it may be used, a page-long Map where it is
// refused (a private window, blocked storage), so a choice still switches without being kept.
const memory = new Map();
const listeners = new Set();
export function readStored(key) {
    try {
        return localStorage.getItem(key) ?? memory.get(key) ?? null;
    }
    catch {
        return memory.get(key) ?? null;
    }
}
/** Stores a value (null forgets it) and tells every reader on the page. */
export function writeStored(key, value) {
    if (value === null)
        memory.delete(key);
    else
        memory.set(key, value);
    try {
        if (value === null)
            localStorage.removeItem(key);
        else
            localStorage.setItem(key, value);
    }
    catch {
        // Not kept; still switched, from memory.
    }
    for (const listener of listeners)
        listener();
}
/** Calls `listener` when a stored value changes here or in another tab. */
export function subscribeStored(listener) {
    listeners.add(listener);
    window.addEventListener("storage", listener);
    return () => {
        listeners.delete(listener);
        window.removeEventListener("storage", listener);
    };
}
