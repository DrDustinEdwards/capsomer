import type { ReactNode } from "react";
export interface FaqItem {
    question: string;
    answer: ReactNode;
    id?: string;
}
export interface FaqProps {
    items: FaqItem[];
    variant?: "accordion" | "cards" | "list";
    name?: string;
    openFirst?: boolean;
    headingLevel?: "h2" | "h3" | "h4";
}
export declare function Faq({ items, variant, name, openFirst, headingLevel: H, }: FaqProps): import("react").JSX.Element;
