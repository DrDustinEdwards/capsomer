export type HistoryKind = "edit" | "autosave" | "named" | "publish" | "restore";
export interface Destination {
    name: string;
    status: "live" | "failed" | "queued";
}
export interface HistoryEntry {
    id: string;
    kind: HistoryKind;
    who: string;
    ai?: boolean;
    at: string;
    words?: number;
    delta?: number;
    summary: string;
    name?: string;
    destinations?: Destination[];
    restoredFrom?: {
        id: string;
        at: string;
    };
}
export interface Run {
    type: "run";
    entries: HistoryEntry[];
    from: string;
    to: string;
    delta?: number;
    who: string[];
}
export interface Single {
    type: "entry";
    entry: HistoryEntry;
}
export type Line = Run | Single;
export declare function countWords(text: string): number;
export declare function wordDelta(before: string | number, after: string | number): number;
export type Sign = "plus" | "minus" | "zero";
export declare function deltaSign(n: number): Sign;
export declare function deltaText(n: number): string;
export declare function deltaOf(entries: readonly HistoryEntry[], index: number): number | undefined;
export declare function condense(entries: readonly HistoryEntry[], minRun?: number): Line[];
export declare function stamp(iso: string, now?: number): string;
export declare function dayOf(iso: string, now?: number): string;
export declare function rangeText(fromIso: string, toIso: string, now?: number): string;
export declare function runTitle(run: Pick<Run, "entries">): string;
export interface Picks {
    picked: string[];
    blocked: boolean;
}
export declare function pickTwo(picked: readonly string[], id: string): Picks;
export declare function orderPair(picked: readonly string[], at: (id: string) => number): [string, string] | null;
export declare function compareHref(base: string, older: string, newer: string): string;
export declare const PICK_NONE = "Pick two versions to compare.";
export declare const PICK_BLOCKED = "Two versions are picked; untick one first.";
export declare function pickedText(count: number, older?: string, newer?: string): string;
export declare function restoredEntry(source: HistoryEntry, current: HistoryEntry, who: string, id: string, atIso: string, now?: number): HistoryEntry;
export declare function restoredMessage(source: Pick<HistoryEntry, "at">, now?: number): string;
export declare function destinationWord(s: Destination["status"]): string;
