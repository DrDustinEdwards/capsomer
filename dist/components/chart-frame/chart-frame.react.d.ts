import type { EnhanceOptions } from "enarratio/enhance";
import { type ReactNode } from "react";
import { type ChartFit, type Gridlines, shownHeight } from "./chart-frame.ts";
export declare const DEFAULT_WIDTH = 640;
export declare function drawWidth(measured: number, min?: number): number;
export { shownHeight, type ChartFit };
export interface ChartFrameProps {
    draw?: (width: number, fit: ChartFit) => string;
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
export declare function ChartFrame({ draw, chart, width, minWidth, noData, inline, enhance, gridlines, onDraw, className, children, }: ChartFrameProps): import("react").JSX.Element;
export interface ChartPanelProps extends Omit<ChartFrameProps, "noData" | "className"> {
    title?: string;
    level?: 2 | 3;
    description?: ReactNode;
    more?: ReactNode;
    src?: ReactNode;
    id?: string;
    empty?: {
        reason: string;
    } | null;
    stale?: string | null;
    className?: string;
}
export declare function ChartPanel({ title, level, description, more, src, id, empty, stale, className, ...frame }: ChartPanelProps): import("react").JSX.Element;
export interface DataPreviewProps {
    id?: string;
    heading: ReactNode;
    chart: string;
    summary: ReactNode;
    link: {
        href: string;
        label: ReactNode;
    };
    source?: {
        href: string;
        label: ReactNode;
    };
    level?: 2 | 3 | 4;
}
export declare function DataPreview({ id, heading, chart, summary, link, source, level, }: DataPreviewProps): import("react").JSX.Element;
