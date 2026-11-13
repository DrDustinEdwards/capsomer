// The plain parts of the state hooks (state-hooks.react.tsx): ids, a versioned record kept in this
// browser, and the selection's sums. No framework. Stored strings go through the hooks component's
// readStored and writeStored, which fall back to memory where storage is refused.

import { readStored, writeStored } from "../hooks/hooks.ts";

/** An id a server accepts as the client's own (a UUID where the platform has one). */
export function newId(): string {
  const c = globalThis.crypto as Crypto | undefined;
  if (c?.randomUUID) return c.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

/** A record kept in localStorage under one key, with its format version inside it. */
export interface VersionedStore<T> {
  /** The record, or null when none is kept, it is another version, it does not parse, or storage is refused. */
  read(): T | null;
  /** Keeps the record (in memory for this page when storage is refused). */
  write(value: T): void;
  clear(): void;
}

/**
 * A versioned record in this browser: stored as JSON with `v` beside its own fields, so a record
 * written by an older format is dropped instead of misread. `parse` checks the fields and answers
 * the record or null. Storage can be refused; the record is then kept for this page only.
 */
export function versionedStore<T extends object>({
  key,
  v,
  parse,
}: {
  key: string;
  v: number;
  parse: (value: Record<string, unknown>) => T | null;
}): VersionedStore<T> {
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
export function parseVersioned<T>(
  raw: string | null,
  v: number,
  parse: (value: Record<string, unknown>) => T | null,
): T | null {
  if (!raw) return null;
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!value || typeof value !== "object" || (value as { v?: unknown }).v !== v) return null;
  return parse(value as Record<string, unknown>);
}

/** Which of `keys` are selected, kept to the keys still shown, and whether that is none, some or all. */
export function selectionOf(
  selected: ReadonlySet<string>,
  keys: readonly string[],
): { ticked: string[]; all: boolean; some: boolean } {
  const ticked = keys.filter((k) => selected.has(k));
  return {
    ticked,
    all: ticked.length > 0 && ticked.length === keys.length,
    some: ticked.length > 0 && ticked.length < keys.length,
  };
}

/** The start of the "since you last looked" window: the stored time, else `fallbackMs` before `now`. */
export function sinceOf(stored: string | null, now: number, fallbackMs: number): string {
  const at = stored ? Date.parse(stored) : Number.NaN;
  return new Date(Number.isNaN(at) ? now - fallbackMs : at).toISOString();
}
