export type AttentionTone = "crit" | "warn" | "nodata" | "info";
export interface AttentionItem {
    id: string;
    tone: AttentionTone;
    title: string;
    detail?: string;
    when?: string | {
        text: string;
        datetime: string;
    };
    href: string;
    group?: string;
}
export interface AttentionGroupInfo {
    title?: (count: number) => string;
    detail?: string;
    when?: string | {
        text: string;
        datetime: string;
    };
    view?: {
        href: string;
        label: string;
    };
}
export declare const GROUP_CHILDREN = 5;
export declare const PROBLEM_ROWS = 8;
export interface ArrangeOptions {
    rows?: number;
    children?: number;
    groups?: Record<string, AttentionGroupInfo>;
}
export declare const TONE_ORDER: readonly AttentionTone[];
export declare const TONE_WORD: Record<AttentionTone, string>;
export interface AttentionRowEntry {
    kind: "row";
    item: AttentionItem;
}
export interface AttentionGroupEntry {
    kind: "group";
    key: string;
    label: string;
    detail?: string;
    when?: AttentionItem["when"];
    tone: AttentionTone;
    items: AttentionItem[];
    total: number;
    view?: {
        href: string;
        label: string;
    };
}
export type AttentionEntry = AttentionRowEntry | AttentionGroupEntry;
export interface Arranged {
    problems: AttentionEntry[];
    more: AttentionEntry[];
    notices: AttentionItem[];
    noticeCount: number;
}
export declare function isNotice(tone: AttentionTone): boolean;
export declare function arrange(items: readonly AttentionItem[], options?: ArrangeOptions): Arranged;
export declare function problemCount(a: Arranged): string;
export declare function viewLinkText(g: AttentionGroupEntry): string;
export declare function setGroup(button: HTMLElement, open: boolean): void;
export declare function toggleGroup(button: HTMLElement): void;
export declare function enhance(root?: ParentNode): () => void;
export type NeedUrgency = "blocking" | "waiting";
export declare const URGENCY_ORDER: readonly NeedUrgency[];
export declare const URGENCY_TITLE: Record<NeedUrgency, string>;
export interface Need<G extends string = string> {
    id: string;
    group: G;
    urgency: NeedUrgency;
    title: string;
    detail?: string;
    action: {
        label: string;
        href: string;
    };
    at: string | null;
    later?: string;
}
export declare function needsShown<G extends string>(needs: readonly Need<G>[], show: "all" | "later" | G): Need<G>[];
export declare function needCount(needs: readonly Pick<Need, "later">[]): number;
export declare function focusNeighbor(row: HTMLElement, rowSelector?: string): void;
export type InboxSeverity = "needs-you" | "failing" | "none";
export interface InboxItem<K extends string = string> {
    title: string;
    kind: K;
    link: string | null;
    since: string;
    job?: string;
}
export interface InboxApp<K extends string = string> {
    namespace: string;
    name: string;
    count: number;
    severity: InboxSeverity;
    items: InboxItem<K>[];
}
export interface Inbox<K extends string = string> {
    generated: string;
    count: number;
    severity: InboxSeverity;
    apps: InboxApp<K>[];
}
export declare function severityOf<K extends string>(items: readonly Pick<InboxItem<K>, "kind">[], waitsOnPerson: ReadonlySet<K> | ((kind: K) => boolean)): InboxSeverity;
export declare function worstSeverity(severities: readonly InboxSeverity[]): InboxSeverity;
export declare function severityTone(s: InboxSeverity): "need" | "crit" | undefined;
