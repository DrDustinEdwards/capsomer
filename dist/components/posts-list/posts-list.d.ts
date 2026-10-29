import { type ContentLabels, type ContentStatus, type PostRow, type PostsData, type PostsQuery, type PostSort } from "../content/content.ts";
export interface ContentStatusWords {
    tone: "ok" | "info" | "nodata";
    word: string;
    when?: string;
}
export declare function inDays(at: string, now: number): string;
export declare function contentStatus(status: ContentStatus, publishAt?: string | null, now?: number): ContentStatusWords;
export declare function nounsOf(labels?: ContentLabels): {
    noun: string;
    plural: string;
};
export declare const STATUS_TABS: ReadonlyArray<{
    status: ContentStatus | undefined;
    label: string;
}>;
export declare const SORTS: ReadonlyArray<{
    value: PostSort;
    label: string;
}>;
export declare function countLine(data: Pick<PostsData, "rows" | "page">, labels?: ContentLabels): string;
export declare function filtered(q: PostsQuery): boolean;
export declare function emptyWords(q: PostsQuery, labels?: ContentLabels): {
    kind: "nothing-yet" | "no-match";
    title: string;
    text: string;
};
export declare function postsHref(base: string, q: PostsQuery): string;
export declare function withFilter(q: PostsQuery, change: Partial<PostsQuery>): PostsQuery;
export type PostIntent = "add-tag" | "remove-tag" | "duplicate" | "unpublish" | "delete";
export interface OfferedAction {
    intent: PostIntent;
    label: string;
    destructive?: boolean;
}
export declare function postActions(data: Pick<PostsData, "offers" | "can">, labels?: ContentLabels): {
    bulk: OfferedAction[];
    withheld: string[];
};
export interface RowAction {
    label: string;
    value: string;
    href?: string;
    danger?: boolean;
}
export declare function rowActions(row: PostRow, data: Pick<PostsData, "offers" | "can">): RowAction[];
export { intentForm, outcomesOf } from "../content/content.ts";
