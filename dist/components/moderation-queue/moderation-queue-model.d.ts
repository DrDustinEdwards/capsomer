export type ModState = "unverified" | "pending" | "approved" | "rejected" | "failed";
export type ModView = "pending" | "failed" | "approved" | "rejected" | "all";
export type ModAction = "approve" | "reject" | "reset";
export interface Mention {
    id: string;
    author: string;
    host: string;
    url?: string;
    external?: boolean;
    excerpt: string;
    post: string;
    postHref?: string;
    at: string;
    state: ModState;
    decidedAt?: string;
    failureReason?: string;
    version?: string;
    expiring?: boolean;
}
export declare const VIEWS: readonly ModView[];
export declare const VIEW_LABEL: Record<ModView, string>;
export declare const STATE_LABEL: Record<ModState, string>;
export declare const ACTIONS: readonly ModAction[];
export declare const ACTION_KEY: Partial<Record<ModAction, string>>;
export declare const DELETE_KEY = "d";
export declare function decide(state: ModState, action: ModAction, reset?: boolean): ModState | null;
export declare function actionsFor(state: ModState, reset?: boolean): ModAction[];
export declare function bulkActionsFor(view: ModView, reset?: boolean): ModAction[];
export declare function inView(state: ModState, view: ModView): boolean;
export type Counts = Record<ModState | "all", number>;
export declare function countStates(items: ReadonlyArray<Pick<Mention, "state">>): Counts;
export declare function summaryText(c: Pick<Counts, "pending" | "unverified">): string;
export interface Status {
    tone: "info" | "ok" | "crit" | "nodata" | "warn";
    word: string;
    glyph: string;
}
export declare function statusOf(state: ModState): Status;
export declare const ACTION_LABEL: Record<ModAction, string>;
export declare function decidedText(action: ModAction, who: string[]): string;
export declare function undoneText(who: string[]): string;
export declare function undoAction(from: ModState, reset?: boolean): ModAction | null;
export declare const NO_UNDO_TEXT = "This site cannot put a mention back to waiting, so there is no Undo; the other decision is one key away.";
export interface UndoEntry {
    ids: string[];
    who: string[];
    action: ModAction;
    from: Record<string, {
        state: ModState;
        decidedAt?: string;
    }>;
}
export interface UndoStack<T> {
    push(entry: T): void;
    pop(): T | undefined;
    peek(): T | undefined;
    remove(match: (entry: T) => boolean): void;
    clear(): void;
    readonly size: number;
}
export declare function undoStack<T>(max?: number): UndoStack<T>;
export declare function sweepLines(expiring: {
    failed: number;
    rejected: number;
}): string[];
export declare function mentionsWord(n: number): string;
export declare const EMPTY_TEXT: Record<ModView, {
    title: string;
    text: string;
}>;
type Attrs = Record<string, string | boolean | undefined>;
export declare function h<K extends keyof HTMLElementTagNameMap>(tag: K, attrs?: Attrs, ...kids: Array<Node | string>): HTMLElementTagNameMap[K];
export declare function statusEl(state: ModState): HTMLElement;
export declare function actionButton(action: ModAction | "delete", who: string, opts?: {
    bar?: boolean;
}): HTMLButtonElement;
export {};
