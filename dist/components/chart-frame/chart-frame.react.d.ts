import type { EnhanceOptions } from "enarratio/enhance";
import { type ReactNode } from "react";
import type { Gridlines } from "./chart-frame.ts";
export declare const DEFAULT_WIDTH = 640;
export declare function drawWidth(measured: number, min?: number): number;
export interface ChartFrameProps {
    draw?: (width: number) => string;
    chart?: string;
    width?: number;
    minWidth?: number;
    noData?: {
        title: string;
        reason: string;
    };
    inline?: boolean;
    enhance?: boolean | EnhanceOptions;
    gridlines?: Gridlines;
    onDraw?: (el: HTMLElement) => void | (() => void);
    className?: string;
    children?: ReactNode;
}
export declare function ChartFrame({ draw, chart, width, minWidth, noData, inline, enhance, gridlines, onDraw, className, children }: ChartFrameProps): import("react").JSX.Element;
