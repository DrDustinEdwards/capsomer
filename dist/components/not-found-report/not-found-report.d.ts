export interface NotFoundRow {
    path: string;
    hits: number;
    referrers: ReadonlyArray<{
        host: string;
        hits: number;
    }>;
    lastSeen?: string;
}
export declare function referrerLine(referrers: NotFoundRow["referrers"]): string;
export declare const hitsWord: (n: number) => string;
export declare function windowOf(asked: unknown, windows: readonly number[], fallback?: number): number;
export declare function probesLine(probes: number | null | undefined): string | null;
