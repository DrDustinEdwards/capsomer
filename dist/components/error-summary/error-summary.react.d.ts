import { type ReactNode } from "react";
export interface ErrorSummaryProps {
    errors: Array<{
        id: string;
        text: ReactNode;
    }>;
    title?: ReactNode;
}
export declare function ErrorSummary({ errors, title }: ErrorSummaryProps): import("react").JSX.Element;
