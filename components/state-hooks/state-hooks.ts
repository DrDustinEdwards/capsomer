// The plain parts of the state hooks: ids, a versioned record kept in this browser, and the selection's sums. No framework.

import { readStored, writeStored } from "../hooks/hooks.ts";

export function newId(): string {
  const c = globalThis.crypto as Crypto | undefined;
  if (c?.randomUUID) return c.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

export interface VersionedStore<T> {
  read(): T | null;
  write(value: T): void;
  clear(): void;
}

/** A versioned record in this browser: JSON with `v` beside its fields, so a record from an older format is dropped, not misread. `parse` answers the record or null. */
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

export function sinceOf(stored: string | null, now: number, fallbackMs: number): string {
  const at = stored ? Date.parse(stored) : Number.NaN;
  return new Date(Number.isNaN(at) ? now - fallbackMs : at).toISOString();
}
