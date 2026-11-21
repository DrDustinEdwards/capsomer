import type { ReactNode } from "react";
export type EmptyKind = "nothing-yet" | "no-match" | "all-clear" | "failed";
interface EmptyBase {
    title?: ReactNode;
    action?: ReactNode;
    icon?: ReactNode;
    flush?: boolean;
    titleAs?: "p" | "h1" | "h2" | "h3";
    role?: "status";
}
export type EmptyProps = (EmptyBase & {
    kind: "failed";
    children?: ReactNode;
}) | (EmptyBase & {
    kind: Exclude<EmptyKind, "failed">;
    children?: never;
});
export declare function Empty({ kind, title, children, action, icon, flush, titleAs: Title, role, }: EmptyProps): import("react").JSX.Element;
export interface WaitProps {
    label: string;
    children: ReactNode;
}
export declare function Wait({ label, children }: WaitProps): import("react").JSX.Element;
export interface MissingProps {
    children?: ReactNode;
    reason?: string;
}
export declare function Missing({ children, reason }: MissingProps): import("react").JSX.Element;
export {};
