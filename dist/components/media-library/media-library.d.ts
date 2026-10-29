import type { ContentLabels, IntentResult, MediaData, MediaOffers, MediaQuery, MediaRevision, MediaSuggestions, MediaUse } from "../content/content.ts";
import { type MediaRecord, type UsedIn } from "../media/media-record.ts";
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
    credit: boolean;
    transform: boolean;
    revert: boolean;
    resize: number | null;
    suggest: boolean;
    embedded: boolean;
    twins: boolean;
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
export declare const KIND_WORDS: Record<NonNullable<MediaQuery["kind"]>, string>;
export declare const ORIENTATION_WORDS: Record<NonNullable<MediaQuery["orientation"]>, string>;
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
export interface KitMediaRow {
    id: string;
    url: string;
    src: string;
    filename: string | null;
    contentType: string;
    bytes: number;
    width: number | null;
    height: number | null;
    alt: string;
    uploadedAt: string | null;
    version?: string;
    tags?: string[];
    trashedAt?: string | null;
    focus?: string | null;
    caption?: string;
    usedCount?: number;
    credit?: string;
    license?: string;
    sourceUrl?: string | null;
    licenseExpires?: string | null;
    takenAt?: string | null;
    orientation?: "landscape" | "portrait" | "square";
}
export interface KitMediaData {
    site: {
        name: string;
    };
    query: Omit<MediaQuery, "layout" | "size" | "group" | "pick">;
    rows: KitMediaRow[];
    page: MediaData["page"];
    detail?: (KitMediaRow & {
        usedBy: MediaUse[];
        twins?: Array<{
            id: string;
            filename: string | null;
        }>;
        history?: MediaRevision[];
        suggestions?: MediaSuggestions | null;
    }) | null;
    offers: MediaOffers & {
        media?: boolean;
    };
    can: MediaData["can"];
}
export interface KitMediaChanges {
    rows: KitMediaRow[];
    removed: string[];
    changeCursor: string;
    more: boolean;
}
export declare function recordOfKit(row: KitMediaRow, used?: UsedIn[]): MediaRecord;
export declare function mediaDataOfKit(kit: KitMediaData, options?: {
    usedHref?: (use: MediaUse) => string;
    view?: Pick<MediaQuery, "layout" | "size" | "group" | "pick">;
}): MediaData;
export declare function applyChanges(rows: readonly MediaRecord[], changed: ReadonlyMap<string, MediaRecord | null>, q: MediaQuery): {
    rows: MediaRecord[];
    elsewhere: number;
    updated: number;
};
export declare function turnMakesCopy(item: Pick<MediaRecord, "orientation">, offers: Pick<MediaOffers, "replaceKeepsSize">): boolean;
export declare function oversized(item: Pick<MediaRecord, "kind" | "width" | "height">, maxEdge: number | null): boolean;
export declare function licenseEnded(licenseExpires: string | null | undefined, today?: Date): boolean;
export declare function filesToOpen(result: Pick<IntentResult, "outcomes"> | null | undefined): Array<{
    id: string;
    why: "duplicate" | "new" | "copy";
}>;
export declare function dayWords(iso: string): string;
export declare function momentWords(iso: string): string;
