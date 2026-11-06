import type { ReactElement } from "react";
export interface SpinnerProps {
    label?: string;
    hideLabel?: boolean;
    size?: "sm" | "lg";
    layout?: "page";
}
export declare function Spinner({ label, hideLabel, size, layout }: SpinnerProps): ReactElement;
export interface SkeletonProps {
    lines?: number;
    label?: string;
}
export declare function Skeleton({ lines, label }: SkeletonProps): ReactElement;
export interface SkeletonBlockProps {
    shape?: "block" | "circle" | "card";
}
export declare function SkeletonBlock({ shape }: SkeletonBlockProps): ReactElement;
