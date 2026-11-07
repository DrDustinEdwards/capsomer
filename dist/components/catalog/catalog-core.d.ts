export type CatalogValue = string | number | boolean | null | undefined;
export interface CatalogFacet {
    kind?: "one" | "many";
    general?: boolean;
    order?: "count" | "alpha" | readonly string[];
    label?: (value: string) => string;
    limit?: number;
}
export interface CatalogColumn {
    header?: string;
    align?: "end";
    drop?: 1 | 2;
    note?: string;
    hideWhenGrouped?: boolean;
}
export interface CatalogGroup<T> {
    field: string;
    value?: (item: T) => string;
    label?: (value: string) => string;
}
export interface CatalogSort<T> {
    labels?: {
        asc: string;
        desc: string;
    };
    compare?: (a: T, b: T) => number;
}
export interface CatalogField<T> {
    key: string;
    label: string;
    value: (item: T) => CatalogValue | readonly CatalogValue[];
    search?: boolean | number;
    facet?: CatalogFacet;
    column?: CatalogColumn;
    sort?: boolean | CatalogSort<T>;
    type?: "text" | "number" | "date";
}
export interface CatalogDefinition<T> {
    id: string;
    noun: readonly [string, string];
    basePath: string;
    fields: readonly CatalogField<T>[];
    itemKey: (item: T) => string;
    defaultSort?: string;
    pageSize?: number;
    group?: CatalogGroup<T>;
}
export interface CatalogState {
    q: string;
    filters: Record<string, string[]>;
    sort: string;
    page: number;
}
export interface CatalogOption {
    value: string;
    label: string;
    count: number;
    selected: boolean;
}
export interface CatalogFacetResult {
    key: string;
    label: string;
    kind: "one" | "many";
    general: boolean;
    limit: number;
    options: CatalogOption[];
    selected: number;
}
export interface CatalogChip {
    id: string;
    field: string;
    value: string;
    label: string;
    href: string;
}
export interface CatalogSortOption {
    value: string;
    label: string;
    selected: boolean;
}
export interface CatalogRowGroup<T> {
    value: string;
    label: string;
    rows: T[];
}
export interface CatalogResult<T> {
    state: CatalogState;
    total: number;
    count: number;
    rows: T[];
    groups: CatalogRowGroup<T>[] | null;
    page: number;
    pageCount: number;
    from: number;
    to: number;
    facets: CatalogFacetResult[];
    chips: CatalogChip[];
    clearHref: string | null;
    sorts: CatalogSortOption[];
    href: (change?: Partial<CatalogState>) => string;
}
export declare const RESERVED_PARAMS: readonly ["q", "sort", "page"];
export declare function fold(text: string): string;
export declare function defineCatalog<T>(def: CatalogDefinition<T>): CatalogDefinition<T>;
export declare function parseCatalogParams<T>(def: CatalogDefinition<T>, input: URLSearchParams | string): CatalogState;
export declare function catalogHref<T>(def: CatalogDefinition<T>, state: CatalogState): string;
export declare function catalogRedirect<T>(def: CatalogDefinition<T>, url: URL): string | null;
export declare function queryCatalog<T>(def: CatalogDefinition<T>, items: readonly T[], state: CatalogState): CatalogResult<T>;
export declare function countText<T>(def: CatalogDefinition<T>, result: Pick<CatalogResult<T>, "count" | "total">): string;
export declare function catalogRecords<T>(def: CatalogDefinition<T>, items: readonly T[], state: CatalogState): Array<Record<string, string>>;
