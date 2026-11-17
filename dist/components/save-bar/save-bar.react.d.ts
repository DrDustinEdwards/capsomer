import type { ReactNode } from "react";
export interface SaveBarProps {
    pending?: boolean;
    saved?: ReactNode;
    error?: ReactNode;
    submit?: ReactNode;
    button?: boolean;
    children?: ReactNode;
    disabledReason?: ReactNode;
    sticky?: boolean;
    form?: string;
    name?: string;
    value?: string;
    className?: string;
}
export declare function SaveBar({ pending, saved, error, submit, button, children, disabledReason, sticky, form, name, value, className, }: SaveBarProps): import("react").JSX.Element;
