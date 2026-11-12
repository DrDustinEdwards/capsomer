// The lifecycle of a file the server generates (an abstract book PDF, a printed program): the
// pure model behind the generated-file panel, and the lock rule the server's store keeps. No
// DOM. The store (site-runtime, or the app's own table) records what happened; this says what
// state that is and what may happen next.
import { formatBytes } from "../drop-zone/drop-zone.js";
import { toMsOrNull } from "../time/time.js";
// How long a run may hold the lock. A run still "generating" after this is taken to have died
// (a crashed Worker never records a failure), and a new run may start. txasm's is 5 minutes.
export const LOCK_MS = 5 * 60 * 1000;
// The reason a run that died says, since it recorded none.
export const STALLED_REASON = "The last run stopped without finishing.";
// The state a record is in, at `now`.
export function fileState(rec, now = Date.now(), lockMs = LOCK_MS) {
    const generatedAt = toMsOrNull(rec?.generatedAt);
    const bytes = rec?.bytes ?? null;
    const hasFile = generatedAt !== null;
    const base = { hasFile, generatedAt, bytes, stalled: false, reason: null };
    const status = rec?.status ?? null;
    if (status === "generating") {
        const started = toMsOrNull(rec?.startedAt);
        // A run with no start time cannot be aged; it holds the lock until it records an outcome.
        if (started === null || now - started < lockMs)
            return { ...base, state: "generating", canStart: false };
        return { ...base, state: "failed", canStart: true, stalled: true, reason: STALLED_REASON };
    }
    if (status === "failed")
        return { ...base, state: "failed", canStart: true, reason: rec?.reason || null };
    if (status === "ready" || hasFile) {
        const changed = toMsOrNull(rec?.changedAt);
        const stale = changed !== null && generatedAt !== null && changed > generatedAt;
        return { ...base, hasFile: true, state: stale ? "stale" : "ready", canStart: true };
    }
    return { ...base, state: "none", canStart: true };
}
// The server's rule before it starts a run: refuse a second one while a live run holds the lock.
export function mayStart(rec, now = Date.now(), lockMs = LOCK_MS) {
    return fileState(rec, now, lockMs).canStart;
}
// The status word for each state: shape, word and color together.
export const STATE_WORDS = {
    none: "Not made yet",
    generating: "Generating",
    ready: "Ready",
    stale: "Out of date",
    failed: "Failed",
};
// "PDF, 2.4 MB": what the download link's meta says.
export function fileMeta(format, bytes) {
    return bytes != null && bytes > 0 ? `${format}, ${formatBytes(bytes)}` : format;
}
