export declare function newId(): string;
export interface VersionedStore<T> {
    read(): T | null;
    write(value: T): void;
    clear(): void;
}
/** A versioned record in this browser: JSON with `v` beside its fields, so a record from an older format is dropped, not misread. `parse` answers the record or null. */
export declare function versionedStore<T extends object>({ key, v, parse, }: {
    key: string;
    v: number;
    parse: (value: Record<string, unknown>) => T | null;
}): VersionedStore<T>;
export declare function parseVersioned<T>(raw: string | null, v: number, parse: (value: Record<string, unknown>) => T | null): T | null;
export declare function selectionOf(selected: ReadonlySet<string>, keys: readonly string[]): {
    ticked: string[];
    all: boolean;
    some: boolean;
};
export declare function sinceOf(stored: string | null, now: number, fallbackMs: number): string;
