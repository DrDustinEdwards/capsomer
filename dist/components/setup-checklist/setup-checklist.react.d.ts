import { type ReactNode } from "react";
export interface SetupStep {
    id: string;
    title: ReactNode;
    detail?: ReactNode;
    done: boolean;
    action?: ReactNode;
}
export interface SetupChecklistProps {
    title?: ReactNode;
    steps: readonly SetupStep[];
    ready?: {
        title: ReactNode;
        detail?: ReactNode;
    };
    level?: 2 | 3;
}
export declare function SetupChecklist({ title, steps, ready, level, }: SetupChecklistProps): import("react").JSX.Element;
