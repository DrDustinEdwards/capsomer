import type { ReactElement, ReactNode } from "react";
export { countText, pageCountOf, pageEnvelope, pageHref, pageRelLinks, parsePage, showingRange, statusText, type PageEnvelope, } from "./pagination.ts";
export interface PageLinkProps {
    href: string;
    className: string;
    rel?: string;
    "data-kind"?: "prev" | "next";
    "aria-label"?: string;
    "aria-current"?: "page";
    children: ReactNode;
}
export interface PaginationProps {
    page: number;
    pageCount: number;
    hrefFor?: (page: number) => string;
    onPageChange?: (page: number) => void;
    total?: number;
    perPage?: number;
    noun?: string;
    prevLabel?: string;
    nextLabel?: string;
    label?: string;
    renderLink?: (props: PageLinkProps) => ReactNode;
    form?: "numbers" | "steps";
    hasNext?: boolean;
}
export declare function Pagination({ page, pageCount: known, hrefFor, onPageChange, total, perPage, noun, prevLabel, nextLabel, label, renderLink, form, hasNext, }: PaginationProps): ReactElement | null;
