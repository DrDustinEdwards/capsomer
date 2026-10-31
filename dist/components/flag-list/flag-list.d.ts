import { type Flag } from "./flag-list-model.ts";
export { groupFlags, countFlags, summaryLine, anchorStatus, applySuggestion, revertSuggestion, appliable } from "./flag-list-model.ts";
export type { FlagKind, FlagState, Resolution, AnchorStatus, FlagAnchor, FlagSuggestion, Flag, FlagCounts } from "./flag-list-model.ts";
declare const GLYPHS: Record<string, string>;
export declare function glyph(name: keyof typeof GLYPHS | string): SVGSVGElement;
export declare function statusEl(tone: "crit" | "warn" | "ok" | "info" | "nodata", word: string, glyphName?: string): HTMLSpanElement;
export declare function readFlag(li: HTMLElement): Flag;
export declare function flagRows(root: ParentNode): HTMLElement[];
export declare function readFlags(root: ParentNode): Flag[];
interface Ctx {
    owner: boolean;
    ownerName: string;
}
export declare function renderFlag(li: HTMLElement, ctx: Ctx): void;
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
