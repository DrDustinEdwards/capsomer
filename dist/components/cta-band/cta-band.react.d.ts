import { type ReactNode } from "react";
export interface CtaBandProps {
    title: ReactNode;
    eyebrow?: ReactNode;
    children?: ReactNode;
    actions: ReactNode;
    quiet?: boolean;
    note?: ReactNode;
    headingLevel?: "h2" | "h3";
    className?: string;
}
export declare function CtaBand({ title, eyebrow, children, actions, quiet, note, headingLevel: H, className, }: CtaBandProps): import("react").JSX.Element;
