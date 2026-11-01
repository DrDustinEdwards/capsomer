export interface PrefetchLink {
    href: string;
    from: string;
    exclude?: readonly string[];
    reloadDocument?: boolean;
    target?: string;
    download?: unknown;
}
export declare const ABSOLUTE: RegExp;
export declare function underPath(path: string, pattern: string): boolean;
export declare function mayPrefetch(link: PrefetchLink): boolean;
