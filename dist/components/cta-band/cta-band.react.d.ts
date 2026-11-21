import { type ReactNode } from "react";
export interface CtaBandProps {
    title: ReactNode;
    children?: ReactNode;
    actions: ReactNode;
    quiet?: boolean;
    headingLevel?: "h2" | "h3";
    className?: string;
}
export declare function CtaBand({ title, children, actions, quiet, headingLevel: H, className, }: CtaBandProps): import("react").JSX.Element;
