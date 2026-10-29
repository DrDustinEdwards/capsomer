import type { ReactElement } from "react";
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
}
export declare function Pagination({ page, pageCount, hrefFor, onPageChange, total, perPage, noun, prevLabel, nextLabel, label }: PaginationProps): ReactElement | null;
