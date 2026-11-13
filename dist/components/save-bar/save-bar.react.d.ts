import type { ReactNode } from "react";
export interface SaveBarProps {
    pending?: boolean;
    saved?: boolean;
    error?: ReactNode;
    submit?: ReactNode;
    button?: boolean;
}
export declare function SaveBar({ pending, saved, error, submit, button, }: SaveBarProps): import("react").JSX.Element;
