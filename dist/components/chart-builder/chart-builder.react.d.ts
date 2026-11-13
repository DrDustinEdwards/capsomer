import { type ReactNode } from "react";
import { type ChartFit } from "../chart-frame/chart-frame.react.tsx";
import { type ChartFields, type ChartType } from "./chart-builder.ts";
export interface ChartCheck {
    findings: Array<{
        message: string;
    }>;
    suggestion?: string | null;
}
export interface ChartBuilderProps {
    onInsert: (block: string) => void;
    types?: readonly ChartType[];
    write?: (fields: ChartFields) => string;
    check?: (block: string, drawable: string) => Promise<ChartCheck>;
    draw?: (fields: ChartFields, width: number, fit: ChartFit) => string;
    preview?: {
        action: string;
        name?: string;
        source?: (block: string) => string;
    };
    maxBytes?: number;
    initial?: Partial<ChartFields>;
    label?: ReactNode;
    buttonVariant?: "default" | "quiet" | "secondary";
    buttonSize?: "xs" | "sm" | "default";
}
export declare function ChartBuilder({ onInsert, types, write, check, draw, preview, maxBytes, initial, label, buttonVariant, buttonSize, }: ChartBuilderProps): import("react").JSX.Element;
export type { ChartFields, ChartType, CsvColumn } from "./chart-builder.ts";
export { CHART_TYPES, chartDirective } from "./chart-builder.ts";
