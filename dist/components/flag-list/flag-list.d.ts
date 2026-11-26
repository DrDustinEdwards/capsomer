export { readFlag, flagRows, readFlags, renderFlag } from "./flag-list-rows.ts";
export { groupFlags, countFlags, summaryLine, anchorStatus, applySuggestion, revertSuggestion, appliable, } from "./flag-list-model.ts";
export type { FlagKind, FlagState, Resolution, AnchorStatus, FlagAnchor, FlagSuggestion, Flag, FlagCounts, } from "./flag-list-model.ts";
export interface FlagTextIO {
    getText(): string;
    setText(text: string): void;
}
export interface FlagListHandle {
    refresh(): void;
    detach(): void;
}
export declare function attachFlagList(root: HTMLElement, io?: FlagTextIO): FlagListHandle;
export declare function enhance(root?: ParentNode): () => void;
