import type { ReactNode } from "react";
export interface ProcessStep {
    title: ReactNode;
    text?: ReactNode;
    tag?: ReactNode;
    id?: string;
}
export interface ProcessStepsProps {
    steps: ProcessStep[];
    layout?: "columns" | "rows";
    flush?: boolean;
    headingLevel?: "h2" | "h3" | "h4" | "p";
    label?: string;
}
export declare function ProcessSteps({ steps, layout, flush, headingLevel: H, label, }: ProcessStepsProps): import("react").JSX.Element;
