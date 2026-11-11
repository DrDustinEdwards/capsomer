export declare const NO_DATE = "no-date";
export interface ScheduleTimes {
    start?: number | Date | string | null;
    end?: number | Date | string | null;
    day?: string | null;
    track?: string | null;
    order?: number | null;
}
export interface ScheduleSlot<T> {
    start: number | null;
    end: number | null;
    parallel: boolean;
    items: T[];
}
export interface ScheduleDay<T> {
    key: string;
    slots: ScheduleSlot<T>[];
}
export declare function toMs(v: number | Date | string | null | undefined): number | null;
export declare function dayKeyOf(t: number, zone?: string): string;
export declare function groupByDay<T>(items: readonly T[], timesOf: (item: T) => ScheduleTimes, zone?: string): ScheduleDay<T>[];
export declare function dayRange(from: number | Date | string | null | undefined, to: number | Date | string | null | undefined, zone?: string): string[];
export declare function dayKeys(days: readonly {
    key: string;
}[], range?: readonly string[], extra?: string | null): string[];
export declare function pickDay(keys: readonly string[], wanted?: string | null): string | null;
export declare function dayLabel(key: string, { year, noDate }?: {
    year?: boolean;
    noDate?: string;
}): string;
export declare function clock(t: number, zone?: string): string;
export declare function slotLabel(start: number | null, end: number | null, zone?: string, none?: string): string;
export declare function zoneLine(at: number | null, zone?: string): string;
export declare function tracksLabel(n: number): string;
