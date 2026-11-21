import { type ReactNode } from "react";
export interface TocItem {
    id: string;
    text: string;
    level: number;
}
export interface TocProps {
    items: TocItem[];
    variant: "sidebar" | "inline";
    title?: ReactNode;
    min?: number;
}
export declare function Toc({ items, variant, title, min }: TocProps): import("react").JSX.Element | null;
