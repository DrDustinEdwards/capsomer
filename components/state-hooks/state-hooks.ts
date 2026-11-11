// The plain parts of the state hooks (state-hooks.react.tsx): ids, a versioned record kept in this
// browser, and the selection's sums. No framework.

/** An id a server accepts as the client's own (a UUID where the platform has one). */
export function newId(): string {
  const c = globalThis.crypto as Crypto | undefined;
  if (c?.randomUUID) return c.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

/** A string from localStorage, or null when none is kept or storage is refused. */
export function readStoredText(key: string): string | null {
  try {
    return globalThis.localStorage?.getItem(key) ?? null;
  } catch {
    return null;
  }
}

/** Keeps a string in localStorage; false when storage refused it. */
export function writeStoredText(key: string, value: string): boolean {
  try {
    globalThis.localStorage?.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

/** A record kept in localStorage under one key, with its format version inside it. */
export interface VersionedStore<T> {
  /** The record, or null when none is kept, it is another version, it does not parse, or storage is refused. */
  read(): T | null;
  /** Keeps the record; false when storage refused it (a private window, full or blocked storage). */
  write(value: T): boolean;
  clear(): void;
}

/**
 * A versioned record in this browser: stored as JSON with `v` beside its own fields, so a record
 * written by an older format is dropped instead of misread. `parse` checks the fields and answers
 * the record or null. Every storage call is in try/catch: storage can be refused.
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
      return parseVersioned(readStoredText(key), v, parse);
    },
    write(value) {
      return writeStoredText(key, JSON.stringify({ ...value, v }));
    },
    clear() {
      try {
        globalThis.localStorage?.removeItem(key);
      } catch {
        // Nothing kept to clear.
      }
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
