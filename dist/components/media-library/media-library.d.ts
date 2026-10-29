import type { ContentLabels, MediaData, MediaOffers, MediaQuery } from "../content/content.ts";
import type { MediaRecord } from "../media/media.ts";
export declare function nounsOf(labels?: ContentLabels): {
    noun: string;
    plural: string;
};
export type MediaSort = NonNullable<MediaQuery["sort"]>;
export declare const SORT_DIR: Record<MediaSort, "asc" | "desc">;
export declare function dirOf(q: Pick<MediaQuery, "sort" | "dir">): "asc" | "desc";
export declare function mediaHref(base: string, q: MediaQuery): string;
export declare function withMedia(q: MediaQuery, change: Partial<MediaQuery>): MediaQuery;
export type MediaIntent = "tag-add" | "tag-remove" | "trash" | "restore" | "delete";
export interface OfferedAction {
    intent: MediaIntent;
    label: string;
    destructive?: boolean;
}
export declare function mediaActions(data: Pick<MediaData, "offers" | "can" | "query">, labels?: ContentLabels): {
    bulk: OfferedAction[];
    withheld: string[];
};
export declare function inspectorOffers(data: Pick<MediaData, "offers" | "can">): {
    alt: boolean;
    tags: boolean;
    trash: boolean;
    delete: boolean;
    focus: boolean;
    caption: boolean;
    replace: boolean;
};
export declare function countLine(data: Pick<MediaData, "rows" | "page" | "query">, labels?: ContentLabels): string;
export declare function filtered(q: MediaQuery): boolean;
export declare function emptyWords(q: MediaQuery, labels?: ContentLabels): {
    kind: "nothing-yet" | "no-match" | "all-clear";
    title: string;
    text: string;
};
export declare function uploadRules(limits: NonNullable<MediaOffers["upload"]>, imagesOnly?: boolean): {
    accept: string;
    hint: string;
} | null;
export declare function pickable(rows: readonly MediaRecord[]): MediaRecord[];
export declare const LENS_WORDS: Record<string, {
    label: string;
    hint: string;
}>;
export declare function lensChips(data: Pick<MediaData, "offers" | "extra">): Array<{
    id: string;
    label: string;
    hint?: string;
    count?: number;
}>;
export declare function folderOf(key: string): string;
export declare function monthOf(uploaded: string | undefined): string;
export declare function groupRows(rows: readonly MediaRecord[], group: MediaQuery["group"]): Array<{
    label: string;
    items: MediaRecord[];
}> | null;
export declare function readMediaView(search: URLSearchParams): Pick<MediaQuery, "layout" | "size" | "group">;
