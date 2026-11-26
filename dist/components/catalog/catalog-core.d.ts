import type { CatalogDefinition, CatalogResult, CatalogState } from "./catalog-types.ts";
export type * from "./catalog-types.ts";
export { RESERVED_PARAMS, catalogHref, catalogRedirect, listParam, oneOf, parseCatalogParams, readRange, yearParam, } from "./catalog-address.ts";
export declare function fold(text: string): string;
export declare function defineCatalog<T>(def: CatalogDefinition<T>): CatalogDefinition<T>;
export declare function queryCatalog<T>(def: CatalogDefinition<T>, items: readonly T[], state: CatalogState): CatalogResult<T>;
export declare function countText<T>(def: CatalogDefinition<T>, result: Pick<CatalogResult<T>, "count" | "total">): string;
