// The plain parts of the state hooks (state-hooks.react.tsx): ids, a versioned record kept in this
// browser, and the selection's sums. No framework. Stored strings go through the hooks component's
// readStored and writeStored, which fall back to memory where storage is refused.
import { readStored, writeStored } from "../hooks/hooks.js";
/** An id a server accepts as the client's own (a UUID where the platform has one). */
export function newId() {
    const c = globalThis.crypto;
    if (c?.randomUUID)
        return c.randomUUID();
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}
/**
 * A versioned record in this browser: stored as JSON with `v` beside its own fields, so a record
 * written by an older format is dropped instead of misread. `parse` checks the fields and answers
 * the record or null. Storage can be refused; the record is then kept for this page only.
 */
export function versionedStore({ key, v, parse, }) {
    return {
        read() {
            return parseVersioned(readStored(key), v, parse);
        },
        write(value) {
            writeStored(key, JSON.stringify({ ...value, v }));
        },
        clear() {
            writeStored(key, null);
        },
    };
}
/** A stored string as version `v` of a record, or null. */
export function parseVersioned(raw, v, parse) {
    if (!raw)
        return null;
    let value;
    try {
        value = JSON.parse(raw);
    }
    catch {
        return null;
    }
    if (!value || typeof value !== "object" || value.v !== v)
        return null;
    return parse(value);
}
/** Which of `keys` are selected, kept to the keys still shown, and whether that is none, some or all. */
export function selectionOf(selected, keys) {
    const ticked = keys.filter((k) => selected.has(k));
    return {
        ticked,
        all: ticked.length > 0 && ticked.length === keys.length,
        some: ticked.length > 0 && ticked.length < keys.length,
    };
}
/** The start of the "since you last looked" window: the stored time, else `fallbackMs` before `now`. */
export function sinceOf(stored, now, fallbackMs) {
    const at = stored ? Date.parse(stored) : Number.NaN;
    return new Date(Number.isNaN(at) ? now - fallbackMs : at).toISOString();
}
