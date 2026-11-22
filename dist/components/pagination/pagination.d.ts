export type PageItem = number | "gap-start" | "gap-end";
export declare function pageItems(page: number, count: number): PageItem[];
export declare function showingRange(page: number, perPage: number, total: number): {
    from: number;
    to: number;
};
export declare function statusText(page: number, perPage: number, total: number, noun?: string): string;
export declare function pageCountOf(total: number, perPage: number): number;
export declare function parsePage(raw: string | null | undefined): number;
export interface PageEnvelope {
    page: number;
    perPage: number;
    total: number;
    pageCount: number;
    offset: number;
    from: number;
    to: number;
    hasPrev: boolean;
    hasNext: boolean;
}
export declare function pageEnvelope(page: number, perPage: number | "all", total: number): PageEnvelope;
export declare function pageHref(path: string, params: URLSearchParams | Record<string, string | number | boolean | null | undefined>, page: number, options?: {
    param?: string;
}): string;
export declare function pageRelLinks(page: number, pageCount: number, hrefFor: (page: number) => string): Array<{
    rel: "prev" | "next";
    href: string;
}>;
export declare function render(nav: HTMLElement): void;
export declare function setPage(nav: HTMLElement, page: number, options?: {
    silent?: boolean;
}): boolean;
export declare function enhance(root?: ParentNode): () => void;
