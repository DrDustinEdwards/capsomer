export type MeterTone = "ok" | "warn" | "crit";
export declare function ratio(value: number, max: number, min?: number): number;
export declare function toneFor(value: number, max: number, options?: {
    min?: number;
    warnAt?: number;
    critAt?: number;
}): MeterTone;
export interface BarValues {
    value: number;
    max: number;
    min?: number;
    projected?: number | null;
    threshold?: number | null;
}
export declare function setBar(bar: HTMLElement, v: BarValues): void;
export declare function update(bar: HTMLElement): void;
export declare function enhance(root?: ParentNode): () => void;
