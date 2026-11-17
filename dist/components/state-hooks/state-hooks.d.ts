/** An id a server accepts as the client's own (a UUID where the platform has one). */
export declare function newId(): string;
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
export declare function versionedStore<T extends object>({ key, v, parse, }: {
    key: string;
    v: number;
    parse: (value: Record<string, unknown>) => T | null;
}): VersionedStore<T>;
/** A stored string as version `v` of a record, or null. */
export declare function parseVersioned<T>(raw: string | null, v: number, parse: (value: Record<string, unknown>) => T | null): T | null;
/** Which of `keys` are selected, kept to the keys still shown, and whether that is none, some or all. */
export declare function selectionOf(selected: ReadonlySet<string>, keys: readonly string[]): {
    ticked: string[];
    all: boolean;
    some: boolean;
};
/** The start of the "since you last looked" window: the stored time, else `fallbackMs` before `now`. */
export declare function sinceOf(stored: string | null, now: number, fallbackMs: number): string;
