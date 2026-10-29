import type { BulkOutcome } from "../bulk-bar/bulk-bar.ts";
import type { MediaRecord } from "../media/media.ts";
import type { Mention, ModState, ModView } from "../moderation-queue/moderation-queue.ts";
export type ContentStatus = "draft" | "scheduled" | "published";
export interface ContentCan {
    edit: boolean;
    publish: boolean;
    deleteContent: boolean;
    deleteMedia: boolean;
    decideMentions: boolean;
}
export interface RowNote {
    text: string;
    tone?: "info" | "ok" | "warn" | "crit";
}
export interface ConfirmSpec {
    title: string;
    lead?: string;
    action: string;
    typeToConfirm?: string;
    cancelLabel?: string;
}
export interface ExtraAction {
    intent: string;
    label: string;
}
export interface ExtraColumn {
    id: string;
    label: string;
    cells: Record<string, string>;
}
export interface PageInfo {
    nextCursor: string | null;
    prevCursor?: string | null;
    total?: number;
    sortedOnPage?: boolean;
}
export interface MediaUse {
    type: string;
    id: string;
    title: string;
    detail: string;
}
export type IntentFields = Record<string, string | string[]>;
export interface IntentOutcome {
    id: string;
    ok: boolean;
    message?: string;
    usedBy?: MediaUse[];
}
export interface ConfirmRequest extends ConfirmSpec {
    intent: string;
    items: string[];
    fields: IntentFields;
}
export interface IntentResult {
    ok: boolean;
    message: string;
    outcomes?: IntentOutcome[];
    undo?: {
        intent: string;
        fields: IntentFields;
    };
    conflict?: {
        id: string;
        currentVersion: string | null;
    };
    confirm?: ConfirmRequest;
}
export type SubmitIntent = (form: FormData) => Promise<IntentResult>;
export interface ContentLabels {
    noun?: string;
    plural?: string;
}
export type PostSort = "updated" | "published" | "title";
export interface PostsQuery {
    q?: string;
    status?: ContentStatus;
    kind?: string;
    tag?: string;
    sort?: PostSort;
    cursor?: string;
}
export interface PostOffers {
    delete: boolean;
    schedule: boolean;
    tags: boolean;
    duplicate: boolean;
    scheduledUpdates?: boolean;
}
export interface ScheduledUpdateSummary {
    publishAt: string;
    href: string;
}
export interface PostRow {
    id: string;
    title: string;
    kind: string;
    status: ContentStatus;
    path: string | null;
    href: string;
    liveHref: string | null;
    publishAt: string | null;
    publishedAt: string | null;
    updatedAt: string | null;
    scheduledUpdate?: ScheduledUpdateSummary;
    version?: string;
    tags?: string[];
    notes?: RowNote[];
}
export interface PostsData {
    site: {
        name: string;
    };
    query: PostsQuery;
    rows: PostRow[];
    page: PageInfo;
    counts?: Partial<Record<ContentStatus | "all", number>>;
    kinds: string[];
    offers: PostOffers;
    can: ContentCan;
    newHref?: string;
    extra?: {
        columns?: ExtraColumn[];
        toolbar?: ExtraAction[];
    };
}
export interface ScheduledUpdateView {
    id: string;
    title: string;
    publishAt: string;
    when: string;
    scheduledAt: string;
    source: string;
    live: {
        source: string;
        version: string;
        href: string | null;
    };
    patch: string;
    editorHref: string;
    can: ContentCan;
}
export interface MediaQuery {
    q?: string;
    tag?: string;
    view?: "library" | "trash";
    layout?: "grid" | "list";
    lens?: string;
    cursor?: string;
    inspect?: string;
    pick?: string;
}
export interface MediaOffers {
    upload: {
        maxBytes: number;
        types: string[];
    } | null;
    alt: boolean;
    tags: boolean;
    trash: boolean;
    delete: boolean;
}
export interface MediaData {
    site: {
        name: string;
    };
    query: MediaQuery;
    rows: MediaRecord[];
    page: PageInfo;
    counts?: {
        library?: number;
        trash?: number;
    };
    tags: Array<{
        tag: string;
        count?: number;
    }>;
    offers: MediaOffers;
    can: ContentCan;
    inspected?: MediaRecord | null;
    extra?: {
        lenses?: Array<{
            id: string;
            label: string;
            count?: number;
        }>;
        toolbar?: ExtraAction[];
    };
}
export interface PickedMedia {
    id: string;
    url: string;
    alt: string;
}
export type MentionStatus = ModState;
export type MentionCounts = Record<MentionStatus | "all", number>;
export interface MentionsQuery {
    view?: ModView;
    cursor?: string;
    open?: string;
}
export interface MentionOffers {
    reset: boolean;
    delete: boolean;
    sweep: boolean;
}
export interface MentionsData {
    site: {
        name: string;
    };
    query: MentionsQuery;
    rows: Mention[];
    page: PageInfo;
    counts: MentionCounts;
    expiring: {
        failed: number;
        rejected: number;
    };
    retention?: string;
    offers: MentionOffers;
    can: ContentCan;
}
export declare function queryHref<Q extends object>(base: string, q: Q, order: ReadonlyArray<keyof Q>): string;
export declare function intentForm(intent: string, fields?: IntentFields): FormData;
export declare function outcomesOf(result: Pick<IntentResult, "outcomes">, names: ReadonlyMap<string, string>): BulkOutcome[];
