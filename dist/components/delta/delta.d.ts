export type Delta = {
    kind: "none";
} | {
    kind: "unchanged";
} | {
    kind: "moved";
    pct: number;
    direction: "up" | "down";
    tone: "good" | "bad";
};
export interface CompareOptions {
    higherIsBetter: boolean;
    unchangedBelowPct?: number;
}
export declare const UNCHANGED_BELOW_PCT = 5;
export declare function compareFigures(current: number | null | undefined, previous: number | null | undefined, { higherIsBetter, unchangedBelowPct }: CompareOptions): Delta;
export declare function deltaText(d: Delta): string;
