import { type MediaData, type MediaOffers, type MediaQuery, type MediaRevision, type MediaSuggestions, type MediaUse } from "../content/content.ts";
import { type MediaRecord, type UsedIn } from "../media/media-record.ts";
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
    query: Omit<MediaQuery, "layout" | "size" | "group" | "pick" | "upload">;
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
    view?: Pick<MediaQuery, "layout" | "size" | "group" | "pick" | "upload">;
}): MediaData;
