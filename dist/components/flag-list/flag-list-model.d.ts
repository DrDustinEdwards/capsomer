export type FlagKind = "blocking" | "advisory";
export type FlagState = "open" | "resolved";
export type Resolution = "resolved" | "dismissed" | "applied";
export type AnchorStatus = "found" | "lost" | "none";
export interface FlagAnchor {
    id: string;
    quote: string;
    before?: string;
    after?: string;
    lost?: boolean;
    label?: string;
}
export interface FlagSuggestion {
    replacement: string;
    by?: string;
}
export interface Flag {
    id: string;
    kind: FlagKind;
    cause: string;
    message: string;
    raisedBy?: string;
    anchor?: FlagAnchor;
    suggestion?: FlagSuggestion;
    state: FlagState;
    resolution?: Resolution;
    resolvedBy?: string;
    resolvedAt?: string;
}
export declare function groupFlags(flags: readonly Flag[]): {
    blocking: Flag[];
    advisory: Flag[];
};
export interface FlagCounts {
    blocking: number;
    advisory: number;
    open: number;
    resolved: number;
    total: number;
}
export declare function countFlags(flags: readonly Flag[]): FlagCounts;
export declare function summaryLine(c: FlagCounts): string;
export declare function anchorStatus(flag: Pick<Flag, "anchor">, text?: string): AnchorStatus;
export declare function applySuggestion(text: string, flag: Pick<Flag, "anchor" | "suggestion">): string | null;
export declare function revertSuggestion(text: string, flag: Pick<Flag, "anchor" | "suggestion">): string | null;
export declare function appliable(flags: readonly Flag[], text?: string): Flag[];
