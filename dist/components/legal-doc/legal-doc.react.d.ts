import { type ReactNode } from "react";
export interface LegalSection {
    id: string;
    title: string;
    body: ReactNode;
}
export interface LegalDocProps {
    title: ReactNode;
    updated: string;
    sections: readonly LegalSection[];
    intro?: ReactNode;
    outro?: ReactNode;
    contentsLabel?: string;
    updatedLabel?: string;
    headingLevel?: "h1" | "h2";
    className?: string;
}
export declare function updatedWords(updated: string): string;
export declare function LegalDoc(props: LegalDocProps): import("react").JSX.Element;
