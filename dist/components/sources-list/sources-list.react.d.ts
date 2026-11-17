export interface Source {
    type: string;
    title: string;
    url?: string;
    authors?: string;
    publisher?: string;
    license?: string;
    note?: string;
}
export declare const SOURCE_KINDS: Record<string, string>;
export interface SourcesListProps {
    sources: Source[];
    label?: string;
    isExternal?: (url: string) => boolean;
    markAway?: boolean;
}
export declare function SourcesList({ sources, label, isExternal, markAway }: SourcesListProps): import("react").JSX.Element | null;
