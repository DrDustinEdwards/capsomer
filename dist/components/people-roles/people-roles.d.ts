export interface PersonRow {
    email: string;
    name: string;
    title: string;
    endDate: string | null;
    status: "active" | "expired" | "removed";
    sync: "ready" | "waiting" | "failed";
    syncError?: string;
    manageable: boolean;
    renewTo?: string | null;
    you?: boolean;
    endedOn?: string;
}
export interface TitleOption {
    value: string;
    label: string;
    defaultEnd: string | null;
}
export interface HistoryEntry {
    at: string;
    by: string;
    action: "add" | "change_title" | "renew" | "remove" | "expire" | "review_keep";
    fromTitle?: string;
    toTitle?: string;
    endDate?: string | null;
    reason?: string;
    cloudflare: "accepted" | "pending" | "failed";
    cloudflareError?: string;
}
export declare const SOON_DAYS = 21;
export declare const REASON_MISSING = "Type a reason. It is recorded with the change.";
export declare function dayText(date: string): string;
export declare function timeText(iso: string): string;
export declare function daysLeft(endDate: string, now: number): number;
export declare function accessText(p: Pick<PersonRow, "endDate" | "status" | "endedOn">, now: number): string;
export declare function endsSoon(p: Pick<PersonRow, "endDate" | "status">, now: number): boolean;
export declare function syncText(p: Pick<PersonRow, "sync" | "status">): string;
export declare function actionText(e: HistoryEntry): string;
export declare function cloudflareText(e: Pick<HistoryEntry, "cloudflare" | "cloudflareError">): string;
export declare function endHelp(defaultEnd: string | null): string;
export declare function tallyText(keep: number, remove: number, open: number): string;
export declare function removeBody(name: string, email: string): string[];
export declare function removeTarget(form: HTMLFormElement): {
    name: string;
    email: string;
};
export declare function confirmRemove(form: HTMLFormElement): Promise<boolean>;
export interface RowAction {
    value: string;
    label: string;
    href?: string;
    danger?: boolean;
}
export declare function rowActions(p: Pick<PersonRow, "manageable" | "status" | "sync" | "renewTo">, canChangeTitle: boolean, changeHref: string, historyHref: string): {
    primary: {
        intent: string;
        label: string;
    } | null;
    items: RowAction[];
};
export declare function followTitle(form: HTMLFormElement): void;
export declare function updateTally(form: HTMLFormElement): void;
export declare function enhance(root?: ParentNode): () => void;
