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
