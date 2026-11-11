export declare const LOCK_MS: number;
export interface GeneratedRecord {
    status?: "pending" | "generating" | "ready" | "failed" | null;
    startedAt?: number | Date | string | null;
    generatedAt?: number | Date | string | null;
    bytes?: number | null;
    reason?: string | null;
    changedAt?: number | Date | string | null;
}
export type GeneratedState = "none" | "generating" | "ready" | "stale" | "failed";
export interface GeneratedView {
    state: GeneratedState;
    hasFile: boolean;
    canStart: boolean;
    stalled: boolean;
    generatedAt: number | null;
    bytes: number | null;
    reason: string | null;
}
export declare const STALLED_REASON = "The last run stopped without finishing.";
export declare function fileState(rec: GeneratedRecord | null | undefined, now?: number, lockMs?: number): GeneratedView;
export declare function mayStart(rec: GeneratedRecord | null | undefined, now?: number, lockMs?: number): boolean;
export declare const STATE_WORDS: Record<GeneratedState, string>;
export declare function fileMeta(format: string, bytes: number | null): string;
