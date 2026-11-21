import { type RedrawSpec } from "enarratio/redraw";
export type { RedrawSpec };
export type Gridlines = "none" | "x" | "y" | "both";
export interface FrameOptions {
    inline?: boolean;
    gridlines?: Gridlines;
    after?: string;
    redraw?: RedrawSpec;
    keepShape?: boolean;
}
export declare function frameHtml(chart: string, o?: FrameOptions): string;
export declare function noDataHtml(title: string, reason: string): string;
export interface ChartFit {
    height?: number;
}
export declare const WIDE_REM = 30;
export declare const NARROW_WIDTH = 262;
export declare function shownHeight(first: string, width: number, rem?: number): number | undefined;
export declare function drawWith<O extends object>(chart: (options: O & {
    width: number;
    height?: number;
}) => string, options: O | ((width: number) => O)): (width: number, fit: ChartFit) => string;
export declare function narrowRedraw(wide: string, drawNarrow: (width: number, fit: ChartFit) => string, o?: {
    keepShape?: boolean;
}): RedrawSpec;
export interface SeriesText {
    what: string;
    x: readonly (string | number)[];
    values: readonly number[] | readonly (readonly number[])[];
    format?: (value: number) => string;
    formatX?: (x: string | number) => string;
    at?: "in" | "on";
    empty?: string;
}
export declare function describeSeries(o: SeriesText): string;
/**
 * The width and height of the chart's own drawing in `html`: the first `viewBox` that is not one of
 * Enarratio's 16 px toolbar icons (`enarratio-icon`), which come before the chart in the figure.
 */
export declare function chartViewBox(html: string): {
    w: number;
    h: number;
} | undefined;
