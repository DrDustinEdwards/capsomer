import type { ReactNode } from "react";
export interface RecordFact {
    label: string;
    value: ReactNode;
    href?: string;
    mono?: boolean;
}
export interface RecordFactsProps {
    facts: readonly RecordFact[];
}
export declare function RecordFacts({ facts }: RecordFactsProps): import("react").JSX.Element | null;
