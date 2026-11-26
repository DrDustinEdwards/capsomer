import type { CatalogDefinition, CatalogResult, CatalogState } from "./catalog-types.ts";
export interface RecordOptions<T> {
    id?: (item: T) => string;
    url?: (item: T) => string;
    keys?: "header" | "key";
    allFields?: boolean;
    join?: string;
}
export declare function catalogRecords<T>(def: CatalogDefinition<T>, items: readonly T[], state: CatalogState | URLSearchParams | string, options?: RecordOptions<T>): Array<Record<string, string>>;
export interface MarkdownOptions<T> {
    origin?: string;
    href?: (item: T) => string;
    empty?: string;
    join?: string;
}
export declare function catalogMarkdown<T>(def: CatalogDefinition<T>, items: readonly T[], state?: CatalogState | URLSearchParams | string, options?: MarkdownOptions<T>): string;
export declare function catalogDownloads<T>(def: CatalogDefinition<T>, result: Pick<CatalogResult<T>, "href">): {
    csv: string;
    json: string;
    markdown: string;
};
