export declare const MIN_HISTORY = 7;
export declare const WARN_AT = 0.75;
export declare const CRIT_AT = 0.9;
export type UsageTone = "ok" | "warn" | "crit";
export interface UsageInput {
    used: number;
    limit: number;
    history: number[];
    resetsAt: number | Date | null;
    now: number | Date;
    periodMs?: number;
    unit?: string;
    atLimit?: string;
}
export interface UsageAssessment {
    tone: UsageTone;
    percent: number;
    projectedAtReset: number | null;
    fullAt: number | null;
    label: string;
    text: string;
    lead: string;
    projection: string;
}
export declare function duration(span: number): string;
export declare function utcClock(t: number | Date): string;
export declare function assess(input: UsageInput): UsageAssessment;
export declare function widths(used: number, limit: number, projected: number | null): {
    used: number;
    projected: number;
};
export declare function usageTable(items: Array<UsageInput & {
    name: string;
}>): {
    columns: string[];
    rows: string[][];
};
export declare const sizeBar: (bar: HTMLElement) => void;
export declare function enhance(root?: ParentNode): () => void;
