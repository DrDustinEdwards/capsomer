export declare function formatBytes(bytes: number): string;
export declare function shortCount(n: number): string;
export declare function median(values: readonly number[], options?: {
    round?: boolean;
}): number | null;
export interface PercentOptions {
    digits?: number;
}
export declare function percentOf(part: number, whole: number, options?: PercentOptions): number | null;
export declare function formatPercent(value: number, options?: PercentOptions): string;
export declare function formatBps(bps: number, options?: PercentOptions): string;
