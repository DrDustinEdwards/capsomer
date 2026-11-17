export declare function applyBulkTag<T>({ ids, wanted, adding, missing, read, write, }: {
    ids: readonly string[];
    wanted: string;
    adding: boolean;
    missing: string;
    read: (id: string) => Promise<{
        item: T;
        tags: string[];
    } | null>;
    write: (id: string, item: T, tags: string[]) => Promise<unknown>;
}): Promise<{
    done: string[];
    skipped: string[];
    failed: string[];
}>;
