export declare const SEC = 1000;
export declare const MIN: number;
export declare const HOUR: number;
export declare const DAY: number;
export declare const whole: (n: number | null | undefined) => number;
export declare const two: (n: number) => string;
export declare function timecode(ms: number | null | undefined, options?: {
    hours?: "auto" | "always";
}): string;
export type DurationStyle = "long" | "short" | "narrow";
export interface DurationOptions {
    style?: DurationStyle;
    largest?: "hours" | "days";
}
export declare function duration(ms: number | null | undefined, options?: DurationOptions): string;
export declare function span(ms: number | null | undefined): string;
export declare function until(t: number, now?: number): string;
