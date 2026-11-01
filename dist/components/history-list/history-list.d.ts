import { isTypingKey } from "../row-list/row-list.ts";
import { type HistoryEntry } from "./history-list-model.ts";
export { countWords, wordDelta, deltaSign, deltaText, deltaOf, condense, stamp, dayOf, rangeText, runTitle, pickTwo, orderPair, compareHref, PICK_NONE, PICK_BLOCKED, pickedText, restoredEntry, restoredMessage, destinationWord } from "./history-list-model.ts";
export type { HistoryKind, Destination, HistoryEntry, Run, Single, Line, Sign, Picks } from "./history-list-model.ts";
export { SIGN_GLYPH, destinationGlyph, destinationTone, buildRow, buildRun } from "./history-list-rows.ts";
export type { BuildOptions } from "./history-list-rows.ts";
export { isTypingKey };
export declare function attachListKeys(list: HTMLElement): () => void;
export interface LoadDetail {
    entry: HistoryEntry;
}
export interface RestoreDetail {
    source: HistoryEntry;
    entry: HistoryEntry;
}
export declare function restoreVersion(root: HTMLElement, id: string): HTMLLIElement | null;
export declare function appendEntries(root: HTMLElement, entries: readonly HistoryEntry[], opts?: {
    more?: boolean;
}): void;
export declare function syncPicks(root: HTMLElement, blocked?: boolean): string[];
export declare function enhance(root?: ParentNode): () => void;
