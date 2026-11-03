import { isTypingKey } from "../row-list/row-list.ts";
import { type Mention, type ModAction, type ModState, type ModView } from "./moderation-queue-model.ts";
export { VIEWS, VIEW_LABEL, STATE_LABEL, ACTIONS, ACTION_KEY, DELETE_KEY, decide, actionsFor, bulkActionsFor, inView, countStates, summaryText, statusOf, ACTION_LABEL, decidedText, undoneText, undoAction, NO_UNDO_TEXT, undoStack, sweepLines, mentionsWord, EMPTY_TEXT, statusEl, actionButton } from "./moderation-queue-model.ts";
export type { ModState, ModView, ModAction, Mention, Counts, Status, UndoEntry, UndoStack } from "./moderation-queue-model.ts";
export { isTypingKey };
export declare function mentionOf(row: HTMLElement): Pick<Mention, "id" | "state" | "at" | "decidedAt" | "author" | "host" | "expiring">;
export declare function refresh(root: HTMLElement): void;
export declare function syncSelection(root: HTMLElement): HTMLLIElement[];
export interface DecidedDetail {
    ids: string[];
    action: ModAction;
    from: Record<string, ModState>;
    to: Record<string, ModState>;
}
export declare function decideRows(root: HTMLElement, rows: HTMLLIElement[], action: ModAction, opts?: {
    focus?: boolean;
    announce?: boolean;
    note?: string;
}): string[];
export declare function run(root: HTMLElement, rows: HTMLLIElement[], action: ModAction | "delete"): Promise<void>;
export declare function setView(root: HTMLElement, view: ModView): void;
export declare const QUEUE_SHORTCUTS: readonly [{
    readonly key: "j";
    readonly label: "Next row";
}, {
    readonly key: "k";
    readonly label: "Previous row";
}, {
    readonly key: "a";
    readonly label: "Approve the row";
}, {
    readonly key: "r";
    readonly label: "Reject the row";
}, {
    readonly key: "d";
    readonly label: "Delete the row, after a confirm";
}, {
    readonly key: "x";
    readonly label: "Select the row";
}];
export declare function enhance(root?: ParentNode): () => void;
