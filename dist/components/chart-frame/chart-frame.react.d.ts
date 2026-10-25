import { type ReactNode } from "react";
import { escapeHtml, type DataTable } from "./chart-frame.ts";
export type { DataTable };
export interface ChartDataProps {
    table: DataTable;
    label: string;
    open?: boolean;
}
export declare function ChartData({ table, label, open }: ChartDataProps): import("react").JSX.Element;
export interface ChartFrameProps {
    title: string;
    summary: string;
    chart: string | ReactNode;
    table: DataTable;
    tableLabel?: string;
    open?: boolean;
    meta?: ReactNode;
    hideSummary?: boolean;
    level?: 2 | 3 | 4;
    className?: string;
    children?: ReactNode;
}
export declare function ChartFrame({ title, summary, chart, table, tableLabel, open, meta, hideSummary, level, className, children }: ChartFrameProps): import("react").JSX.Element;
export { escapeHtml };
