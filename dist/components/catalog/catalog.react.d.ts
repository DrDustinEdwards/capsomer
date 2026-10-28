import { type ReactNode } from "react";
import { type CatalogDefinition, type CatalogResult } from "./catalog-core.ts";
export interface CatalogProps<T> {
    definition: CatalogDefinition<T>;
    result: CatalogResult<T>;
    title: (item: T) => ReactNode;
    cells?: Partial<Record<string, (item: T) => ReactNode>>;
    labelledBy: string;
    emptyText?: {
        nothingYet?: ReactNode;
        noMatch?: ReactNode;
    };
    actions?: ReactNode;
}
export declare function Catalog<T>({ definition: def, result, title, cells, labelledBy, emptyText, actions }: CatalogProps<T>): import("react").JSX.Element;
