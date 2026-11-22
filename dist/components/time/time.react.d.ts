import { type ReactNode } from "react";
import { type TimeFormat } from "./time.ts";
export interface TimeProps {
    at: number | Date | string | null | undefined;
    format?: TimeFormat;
    empty?: ReactNode;
    tip?: boolean;
    now?: number;
}
export declare function Time({ at, format, now, empty, tip }: TimeProps): import("react").JSX.Element;
