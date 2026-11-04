export type PageItem = number | "gap-start" | "gap-end";
export declare function pageItems(page: number, count: number): PageItem[];
export declare function showingRange(page: number, perPage: number, total: number): {
    from: number;
    to: number;
};
export declare function statusText(page: number, perPage: number, total: number, noun?: string): string;
export declare function pageCountOf(total: number, perPage: number): number;
export declare function render(nav: HTMLElement): void;
export declare function setPage(nav: HTMLElement, page: number, options?: {
    silent?: boolean;
}): boolean;
export declare function enhance(root?: ParentNode): () => void;
