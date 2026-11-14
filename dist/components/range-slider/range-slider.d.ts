export declare const COMMIT_DELAY_MS = 250;
export declare const COMMIT_EVENT = "cap:range-commit";
export interface RangeCommitDetail {
    low: number;
    high: number;
}
export declare function rangeFill(value: number, min: number, max: number): string;
export declare function clampPair(low: number, high: number, { min, max, step }: {
    min: number;
    max: number;
    step: number;
}, moved: "low" | "high"): [number, number];
export declare function trackPick(track: HTMLElement, clientX: number, [low, high]: [number, number], { min, max, step }: {
    min: number;
    max: number;
    step: number;
}): {
    which: "low" | "high";
    value: number;
};
export declare function formatValue(root: HTMLElement, value: number, max: number): string;
export declare function paint(root: HTMLElement): void;
export declare function enhance(root?: ParentNode): () => void;
