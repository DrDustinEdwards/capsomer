import { type ReactNode } from "react";
/** One work that cites this one, as a scholarly index reports it. Every field but the title may be missing. */
export interface CitingWork {
    title: string | null;
    doi?: string | null;
    href?: string | null;
    venue?: string | null;
    year?: number | string | null;
}
/** "Cited by 40", or "Cited by 25 of 40" when the list holds fewer than the count. */
export declare function citedByHeading(total: number, shown: number): string;
export interface CitedByCountProps {
    count: number | null | undefined;
    href?: string | null;
    source: string;
    readAt?: ReactNode;
}
export declare function CitedByCount({ count, href, source, readAt }: CitedByCountProps): import("react").JSX.Element | null;
export interface CitedByProps {
    total: number;
    works: readonly CitingWork[];
    source: string;
    readAt?: ReactNode;
    order?: string;
    headingLevel?: 2 | 3 | 4;
}
export declare function CitedBy({ total, works, source, readAt, order, headingLevel }: CitedByProps): import("react").JSX.Element | null;
