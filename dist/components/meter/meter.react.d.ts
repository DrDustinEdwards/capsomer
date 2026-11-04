import { type ReactNode } from "react";
import { type MeterTone } from "./meter.ts";
export interface MeterProps {
    label: ReactNode;
    value: number | null;
    max: number;
    min?: number;
    valueText: string;
    display?: ReactNode;
    tone?: MeterTone;
    warnAt?: number;
    critAt?: number;
    words?: {
        warn: string;
        crit: string;
    };
    threshold?: number;
    projected?: number;
    size?: "sm" | "md" | "lg";
    measuring?: boolean;
    note?: ReactNode;
    className?: string;
    as?: "div" | "li";
    after?: ReactNode;
}
export declare function Meter({ label, value, max, min, valueText, display, tone, warnAt, critAt, words, threshold, projected, size, measuring, note, className, as: Root, after }: MeterProps): import("react").JSX.Element;
