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
