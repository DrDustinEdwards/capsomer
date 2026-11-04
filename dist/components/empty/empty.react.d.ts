import type { ReactNode } from "react";
export { Skeleton, Spinner, SkeletonBlock } from "../skeleton/skeleton.react.tsx";
export type EmptyKind = "nothing-yet" | "no-match" | "all-clear" | "failed";
export interface EmptyProps {
    kind: EmptyKind;
    title?: ReactNode;
    children?: ReactNode;
    action?: ReactNode;
    icon?: ReactNode;
    flush?: boolean;
    titleAs?: "p" | "h1" | "h2" | "h3";
}
export declare function Empty({ kind, title, children, action, icon, flush, titleAs: Title }: EmptyProps): import("react").JSX.Element;
export interface WaitProps {
    label: string;
    children: ReactNode;
}
export declare function Wait({ label, children }: WaitProps): import("react").JSX.Element;
