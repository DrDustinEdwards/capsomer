// The lifecycle of a file the server generates (an abstract book PDF, a printed program): the
// pure model behind the generated-file panel, and the lock rule the server's store keeps. No
// DOM. The store (site-runtime, or the app's own table) records what happened; this says what
// state that is and what may happen next.

import { formatBytes } from "../drop-zone/drop-zone.ts";

// How long a run may hold the lock. A run still "generating" after this is taken to have died
// (a crashed Worker never records a failure), and a new run may start. txasm's is 5 minutes.
export const LOCK_MS = 5 * 60 * 1000;

// What the store records.
export interface GeneratedRecord {
  // The last run's outcome, or that one is running; null or missing when none has run.
  status?: "generating" | "ready" | "failed" | null;
  // When the current or last run started (the lock's age is measured from it).
  startedAt?: number | Date | string | null;
  // When the file now stored was made. A regenerate keeps the old file until the new one is in.
  generatedAt?: number | Date | string | null;
  // The stored file's size, in bytes.
  bytes?: number | null;
  // Why the last run failed, in words a person can act on.
  reason?: string | null;
  // When the data the file is made from last changed. Later than generatedAt: the file is stale.
  changedAt?: number | Date | string | null;
}

export type GeneratedState = "none" | "generating" | "ready" | "stale" | "failed";

export interface GeneratedView {
  state: GeneratedState;
  // A file is stored and can be downloaded: ready and stale always, and during a regenerate or
  // after a failed one when an earlier file is kept.
  hasFile: boolean;
  // A run may start now (the Generate button is live).
  canStart: boolean;
  // The run died without recording an outcome: shown as failed, with that reason.
  stalled: boolean;
  generatedAt: number | null;
  bytes: number | null;
  reason: string | null;
}

const ms = (v: number | Date | string | null | undefined): number | null => {
  if (v == null || v === "") return null;
  const t = typeof v === "number" ? v : v instanceof Date ? v.getTime() : Date.parse(v);
  return Number.isFinite(t) ? t : null;
};

// The reason a run that died says, since it recorded none.
export const STALLED_REASON = "The last run stopped without finishing.";

// The state a record is in, at `now`.
export function fileState(
  rec: GeneratedRecord | null | undefined,
  now: number = Date.now(),
  lockMs: number = LOCK_MS,
): GeneratedView {
  const generatedAt = ms(rec?.generatedAt);
  const bytes = rec?.bytes ?? null;
  const hasFile = generatedAt !== null;
  const base = { hasFile, generatedAt, bytes, stalled: false, reason: null as string | null };
  const status = rec?.status ?? null;
  if (status === "generating") {
    const started = ms(rec?.startedAt);
    // A run with no start time cannot be aged; it holds the lock until it records an outcome.
    if (started === null || now - started < lockMs)
      return { ...base, state: "generating", canStart: false };
    return { ...base, state: "failed", canStart: true, stalled: true, reason: STALLED_REASON };
  }
  if (status === "failed")
    return { ...base, state: "failed", canStart: true, reason: rec?.reason || null };
  if (status === "ready" || hasFile) {
    const changed = ms(rec?.changedAt);
    const stale = changed !== null && generatedAt !== null && changed > generatedAt;
    return { ...base, hasFile: true, state: stale ? "stale" : "ready", canStart: true };
  }
  return { ...base, state: "none", canStart: true };
}

// The server's rule before it starts a run: refuse a second one while a live run holds the lock.
export function mayStart(
  rec: GeneratedRecord | null | undefined,
  now: number = Date.now(),
  lockMs: number = LOCK_MS,
): boolean {
  return fileState(rec, now, lockMs).canStart;
}

// The status word for each state: shape, word and color together.
export const STATE_WORDS: Record<GeneratedState, string> = {
  none: "Not made yet",
  generating: "Generating",
  ready: "Ready",
  stale: "Out of date",
  failed: "Failed",
};

// "PDF, 2.4 MB": what the download link's meta says.
export function fileMeta(format: string, bytes: number | null): string {
  return bytes != null && bytes > 0 ? `${format}, ${formatBytes(bytes)}` : format;
}
