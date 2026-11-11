import { type ReactNode } from "react";
export interface ArchiveDoc {
    key: string;
    title: string;
    href: string;
    detail?: ReactNode;
    meta?: ReactNode;
}
export interface ArchiveLinkProps {
    href: string;
    className?: string;
    rel?: string;
    "aria-describedby"?: string;
    children: ReactNode;
}
export interface DocumentListProps {
    docs: readonly ArchiveDoc[];
    labelledBy?: string;
    label?: string;
    empty?: ReactNode;
    renderLink?: (props: ArchiveLinkProps) => ReactNode;
}
export declare function DocumentList({ docs, labelledBy, label, empty, renderLink, }: DocumentListProps): import("react").JSX.Element;
export interface ArchiveGroup {
    id: string;
    title: string;
    docs: readonly ArchiveDoc[];
    href?: string;
    more?: string;
    empty?: ReactNode;
}
export interface DocumentArchiveProps {
    groups: readonly ArchiveGroup[];
    level?: 2 | 3;
    renderLink?: (props: ArchiveLinkProps) => ReactNode;
}
export declare function DocumentArchive({ groups, level, renderLink, }: DocumentArchiveProps): import("react").JSX.Element;
export interface PagerDoc {
    title: string;
    href: string;
}
export interface DocumentPagerProps {
    prev: PagerDoc | null;
    next: PagerDoc | null;
    collection: string;
    prevLabel?: string;
    nextLabel?: string;
    renderLink?: (props: ArchiveLinkProps) => ReactNode;
}
export declare function DocumentPager({ prev, next, collection, prevLabel, nextLabel, renderLink, }: DocumentPagerProps): import("react").JSX.Element | null;
export interface DocumentViewerProps {
    title: ReactNode;
    subtitle?: ReactNode;
    level?: 1 | 2;
    before?: ReactNode;
    download?: {
        href: string;
        format?: string;
        bytes?: number | null;
        label?: string;
    };
    children?: ReactNode;
    prev?: PagerDoc | null;
    next?: PagerDoc | null;
    collection: string;
    renderLink?: (props: ArchiveLinkProps) => ReactNode;
}
export declare function DocumentViewer({ title, subtitle, level, before, download, children, prev, next, collection, renderLink, }: DocumentViewerProps): import("react").JSX.Element;
