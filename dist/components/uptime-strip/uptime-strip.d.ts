export type RingStatus = "up" | "degraded" | "down" | "unknown";
export interface RingSlot {
    status: RingStatus;
    label: string;
}
export interface FromRingOptions {
    slots: number;
    label?: (run: {
        first: number;
        seen: number;
        down: number;
    }) => string;
}
export declare function uptimeOf(ring: string): number | null;
export declare function padRing(ring: string, length: number): string;
export declare function fromRing(ring: string, { slots, label }: FromRingOptions): RingSlot[];
export declare const LEGEND: ReadonlyArray<readonly [key: string, word: string]>;
