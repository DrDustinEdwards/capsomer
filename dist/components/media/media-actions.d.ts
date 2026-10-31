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
export declare const COPIED_MS = 2500;
export declare const COPY_FAILED_MS = 8000;
export declare function copyText(text: string): Promise<boolean>;
