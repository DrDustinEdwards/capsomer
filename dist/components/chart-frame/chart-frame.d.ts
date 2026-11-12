import { type RedrawSpec } from "enarratio/redraw";
export type Gridlines = "none" | "x" | "y" | "both";
export interface FrameOptions {
    inline?: boolean;
    gridlines?: Gridlines;
    after?: string;
    redraw?: RedrawSpec;
}
export declare function frameHtml(chart: string, o?: FrameOptions): string;
export declare function noDataHtml(title: string, reason: string): string;
/**
 * The width and height of the chart's own drawing in `html`: the first `viewBox` that is not one of
 * Enarratio's 16 px toolbar icons (`enarratio-icon`), which come before the chart in the figure.
 */
export declare function chartViewBox(html: string): {
    w: number;
    h: number;
} | undefined;
