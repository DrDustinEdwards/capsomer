import { type ReactNode } from "react";
export interface TriggerProps {
    ref: (el: HTMLElement | null) => void;
    "aria-describedby": string;
}
export interface TooltipProps {
    tip: ReactNode;
    children: (trigger: TriggerProps) => ReactNode;
    side?: "top" | "bottom" | "left" | "right" | "inline-start" | "inline-end";
    align?: "start" | "center" | "end";
    arrow?: boolean;
}
export declare function Tooltip({ tip, children, side, align, arrow }: TooltipProps): import("react").JSX.Element;
