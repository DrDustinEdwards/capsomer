export { SEC, MIN, HOUR, DAY, two, timecode, duration, span, until } from "./time-duration.ts";
export type { DurationStyle, DurationOptions } from "./time-duration.ts";
export declare const REFRESH_MS: number;
export declare function parse(iso: string): number;
export declare function toMs(at: number | Date | string | null | undefined): number;
export declare function toMsOrNull(at: number | Date | string | null | undefined): number | null;
export declare function calendarDays(t: number, now: number, zone?: string): number;
export declare function day(t: number, now?: number, zone?: string): string;
export interface RelativeOptions {
    granularity?: "auto" | "day";
}
export declare function relative(t: number, now?: number, zone?: string, options?: RelativeOptions): string;
export declare function utc(t: number): string;
export type DateStyle = "long" | "medium" | "monthDay" | "monthYear" | "weekday" | "time";
export interface FormatDateOptions {
    style?: DateStyle;
    time?: boolean;
    zoneName?: boolean;
    year?: boolean;
    zone?: string;
}
export declare function formatDate(at: number | Date | string | null | undefined, options?: FormatDateOptions): string | null;
export declare function dateRange(start: number | Date | string | null | undefined, end: number | Date | string | null | undefined, options?: Pick<FormatDateOptions, "style" | "zone">): string | null;
export declare function zoneName(t: number, zone?: string): string;
export declare const UNREADABLE = "an unreadable time";
export declare function exactParts(t: number, zone?: string): {
    local: string;
    utc: string | null;
};
export declare function exact(t: number, zone?: string): string;
export type TimeFormat = "relative" | "exact" | "date";
export declare function text(t: number, format: TimeFormat, now?: number, zone?: string): string;
export declare function serverNow(clientNow: number, skew: number, newestServerRead: number): number;
export declare function setClock(fn: (() => number) | null): void;
export declare function nowFor(el: Element): {
    now: number;
    frozen: boolean;
};
export declare function draw(el: HTMLElement): void;
export declare function enhance(root?: ParentNode): () => void;
export declare function knownZone(zone: string | null | undefined): string;
export declare const LATER_HOUR = 8;
export declare function laterUntil(now: Date | number, zone: string | null | undefined, hour?: number): string;
