import type { ReactNode } from "react";
import { type Author } from "./author-list.ts";
export type { Author } from "./author-list.ts";
export interface AuthorListProps {
    authors: readonly Author[];
    isOwner?: (name: string) => boolean;
    collapse?: number;
    format?: (name: string) => ReactNode;
}
export declare function AuthorList({ authors, isOwner, collapse, format, }: AuthorListProps): import("react").JSX.Element | null;
