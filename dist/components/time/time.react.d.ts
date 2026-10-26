import { type TimeFormat } from "./time.ts";
export interface TimeProps {
    at: number | Date | string;
    format?: TimeFormat;
    now?: number;
}
export declare function Time({ at, format, now }: TimeProps): import("react").JSX.Element;
