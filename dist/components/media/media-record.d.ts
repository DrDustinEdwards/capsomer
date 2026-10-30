export type AltState = "missing" | "decorative" | "set";
export type TileState = "ready" | "uploading" | "failed" | "binned";
export interface UsedIn {
    title: string;
    href: string;
    how?: string;
}
export interface MediaRecord {
    key: string;
    name: string;
    url: string;
    thumb?: string;
    kind: "image" | "document";
    type: string;
    bytes: number;
    width?: number;
    height?: number;
    uploaded?: string;
    alt: string;
    altState: AltState;
    title: string;
    caption: string;
    tags: string[];
    used: UsedIn[];
    state: TileState;
    suggestedTags?: string[];
    progress?: number;
    error?: string;
    version?: string;
    usedUnknown?: boolean;
    focus?: string | null;
    usedCount?: number;
    credit?: string;
    license?: string;
    sourceUrl?: string | null;
    licenseExpires?: string | null;
    takenAt?: string | null;
    twins?: Array<{
        key: string;
        name: string;
    }>;
    orientation?: "landscape" | "portrait" | "square";
}
export interface MediaFields {
    alt: string;
    decorative: boolean;
    title: string;
    caption: string;
    tags: string[];
}
export declare function byteSize(size: number): string;
export declare const LARGE_BYTES: number;
export declare function suggestedAlt(name: string): string;
export declare function altStateOf(alt: string, decorative: boolean): AltState;
export declare function parseTags(text: string): string[];
export interface Flag {
    tone: "warn" | "info" | "nodata";
    word: string;
}
export declare function flagsFor(r: Pick<MediaRecord, "kind" | "altState" | "used" | "state" | "usedUnknown" | "usedCount">): Flag[];
export declare function describeRecord(r: Pick<MediaRecord, "kind" | "type" | "bytes" | "state" | "progress" | "error">): string;
export declare function copySnippets(r: Pick<MediaRecord, "url" | "kind" | "alt" | "name">): Array<{
    id: string;
    label: string;
    name: string;
    value: string;
}>;
