import { type ReactNode } from "react";
export interface TimelineStep {
    mark: ReactNode;
    title: ReactNode;
    children?: ReactNode;
    icon?: ReactNode;
}
export interface TimelineProps {
    steps: TimelineStep[];
    level?: "h2" | "h3" | "h4";
    className?: string;
}
export declare function Timeline({ steps, level: H, className }: TimelineProps): import("react").JSX.Element;
