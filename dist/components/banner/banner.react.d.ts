import type { ReactNode } from "react";
export type NoticeTone = "neutral" | "info" | "ok" | "warn" | "crit";
export interface BannerProps {
    tone?: NoticeTone;
    title?: ReactNode;
    children: ReactNode;
    actions?: ReactNode;
    onDismiss?: () => void;
}
export declare function Banner({ tone, title, children, actions, onDismiss }: BannerProps): import("react").JSX.Element;
export interface AlertProps {
    tone?: NoticeTone;
    title?: ReactNode;
    children: ReactNode;
    action?: ReactNode;
    id?: string;
}
export declare function Alert({ tone, title, children, action, id }: AlertProps): import("react").JSX.Element;
