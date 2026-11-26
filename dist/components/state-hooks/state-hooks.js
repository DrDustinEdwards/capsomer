// The plain parts of the state hooks: ids, a versioned record kept in this browser, and the selection's sums. No framework.
import { readStored, writeStored } from "../hooks/hooks.js";
export function newId() {
    const c = globalThis.crypto;
    if (c?.randomUUID)
        return c.randomUUID();
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}
/** A versioned record in this browser: JSON with `v` beside its fields, so a record from an older format is dropped, not misread. `parse` answers the record or null. */
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
export function selectionOf(selected, keys) {
    const ticked = keys.filter((k) => selected.has(k));
    return {
        ticked,
        all: ticked.length > 0 && ticked.length === keys.length,
        some: ticked.length > 0 && ticked.length < keys.length,
    };
}
export function sinceOf(stored, now, fallbackMs) {
    const at = stored ? Date.parse(stored) : Number.NaN;
    return new Date(Number.isNaN(at) ? now - fallbackMs : at).toISOString();
}
