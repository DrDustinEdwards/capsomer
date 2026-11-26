import type { CatalogDefinition, CatalogField, CatalogState, CatalogValue } from "./catalog-types.ts";
export declare const RESERVED_PARAMS: readonly ["q", "sort", "page"];
export declare const asList: (v: CatalogValue | readonly CatalogValue[]) => string[];
export declare function readRange(value: string | undefined): {
    from: number | null;
    to: number | null;
};
export declare const rangeParams: <T>(field: CatalogField<T>) => {
    from: string;
    to: string;
};
export declare function parseCatalogParams<T>(def: CatalogDefinition<T>, input: URLSearchParams | string): CatalogState;
export declare function catalogHref<T>(def: CatalogDefinition<T>, state: CatalogState): string;
export declare function catalogRedirect<T>(def: CatalogDefinition<T>, url: URL, options?: {
    keepUnknown?: boolean;
}): string | null;
export declare function oneOf<V extends string, F>(value: unknown, allowed: readonly V[], fallback: F): V | F;
export declare function listParam(params: URLSearchParams, key: string, known?: ReadonlySet<string>): string[];
export declare function yearParam(raw: string | null | undefined): number | null;
