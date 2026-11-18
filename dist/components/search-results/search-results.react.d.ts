import type { ReactNode } from "react";
export interface SnippetProps {
    text: string;
    open?: string;
    close?: string;
}
export declare function Snippet({ text, open, close }: SnippetProps): import("react").JSX.Element;
export interface SearchResultProps {
    href: string;
    title: ReactNode;
    kind?: ReactNode;
    context?: ReactNode;
    snippet?: string;
    why?: ReactNode;
    level?: 2 | 3;
}
export declare function SearchResult({ href, title, kind, context, snippet, why, level, }: SearchResultProps): import("react").JSX.Element;
export interface SearchResultsProps {
    count: string;
    children?: ReactNode;
    facets?: ReactNode;
    sort?: ReactNode;
    empty?: ReactNode;
    pager?: ReactNode;
    label?: string;
}
export declare function SearchResults({ count, children, facets, sort, empty, pager, label, }: SearchResultsProps): import("react").JSX.Element;
