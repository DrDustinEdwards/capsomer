export type SortDirection = "ascending" | "descending";
export declare function sortValue(cell: Element | undefined): string | number;
export declare function compareValues(a: string | number, b: string | number): number;
export declare function sortRows(table: HTMLTableElement, index: number, direction: SortDirection): void;
export declare function columnIndex(th: HTMLTableCellElement): number;
export declare function sortByHeader(th: HTMLTableCellElement, direction?: SortDirection): SortDirection;
export declare function enhance(root?: ParentNode): () => void;
