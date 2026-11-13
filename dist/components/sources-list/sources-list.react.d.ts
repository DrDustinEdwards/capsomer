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
}
export declare function SourcesList({ sources, label, isExternal }: SourcesListProps): import("react").JSX.Element | null;
