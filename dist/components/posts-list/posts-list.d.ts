import { type ContentLabels, type ContentStatus, type PostRow, type PostsData, type PostsQuery, type PostSort } from "../content/content.ts";
export interface ContentStatusWords {
    tone: "ok" | "info" | "nodata";
    word: string;
    when?: string;
}
export declare function inDays(at: string, now: number): string;
export declare function contentStatus(status: ContentStatus, publishAt?: string | null, now?: number): ContentStatusWords;
export declare function rowStatus(row: Pick<PostRow, "status" | "publishAt" | "scheduledUpdate">, now?: number): ContentStatusWords & {
    note?: string;
};
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
export declare function trashLine(labels?: ContentLabels): string;
export declare function countLine(data: Pick<PostsData, "rows" | "page"> & {
    query?: PostsQuery;
}, labels?: ContentLabels): string;
export declare function authorLine(authors: readonly string[] | undefined): string;
export declare function filtered(q: PostsQuery): boolean;
export declare const NO_FILTERS: Partial<PostsQuery>;
export declare function emptyWords(q: PostsQuery, labels?: ContentLabels): {
    kind: "nothing-yet" | "no-match" | "all-clear";
    title: string;
    text: string;
};
export declare function postsHref(base: string, q: PostsQuery): string;
export declare function withFilter(q: PostsQuery, change: Partial<PostsQuery>): PostsQuery;
export type PostIntent = "tag-add" | "tag-remove" | "duplicate" | "unpublish" | "trash" | "restore" | "delete" | "reschedule" | "cancel-schedule" | "rename" | "preview-link";
export interface OfferedAction {
    intent: PostIntent;
    label: string;
    destructive?: boolean;
}
export declare function postActions(data: Pick<PostsData, "offers" | "can"> & {
    query?: PostsQuery;
}, labels?: ContentLabels): {
    bulk: OfferedAction[];
    withheld: string[];
};
export interface RowAction {
    label: string;
    value: string;
    href?: string;
    danger?: boolean;
    publishAt?: string;
}
export declare function scheduledTime(row: Pick<PostRow, "status" | "publishAt" | "scheduledUpdate">): string | null;
export declare function rowActions(row: PostRow, data: Pick<PostsData, "offers" | "can">): RowAction[];
export declare function localInputValue(iso: string): string;
export declare function isoFromLocal(value: string): string;
export { intentForm, outcomesOf } from "../content/content.ts";
