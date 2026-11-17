import type { ReactNode } from "react";
export type MarkTone = "ok" | "crit" | "warn" | "info";
export declare function StatusMark({ tone }: {
    tone: MarkTone;
}): import("react").JSX.Element;
export interface ResultPageProps {
    title: string;
    titleHidden?: boolean;
    tone?: MarkTone;
    children: ReactNode;
    actions?: ReactNode;
    brand?: ReactNode;
}
export declare function ResultPage({ title, titleHidden, tone, children, actions, brand, }: ResultPageProps): import("react").JSX.Element;
