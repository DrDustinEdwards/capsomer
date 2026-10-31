import { countWords } from "../draft-compare/draft-compare.ts";
export type Kind = "you" | "ai" | "quoted";
export declare const KINDS: readonly Kind[];
export declare const KIND_WORD: Record<Kind, string>;
export declare const KIND_LABEL: Record<Kind, string>;
export { countWords };
export interface RunInput {
    kind: Kind;
    words?: number;
    text?: string;
}
export interface Share {
    kind: Kind;
    words: number;
    percent: number;
}
export interface Summary {
    total: number;
    shares: Share[];
    text: string;
}
/** @deprecated The British spelling, kept so existing imports work; use `summarize`. */
export declare const summarise: (runs: readonly RunInput[]) => Summary;
export declare function summarize(runs: readonly RunInput[]): Summary;
export declare function summaryText(shares: Share[]): string;
export declare function summaryHtml(summary: Summary, label?: string): string;
export declare const STORAGE_KEY = "cap-authorship";
export declare function collectRuns(root: Element): RunInput[];
export declare function refresh(root: Element): Summary;
export declare function isShown(root: Element): boolean;
export declare function setShown(root: HTMLElement, shown: boolean, persist?: boolean): void;
export declare function enhance(root?: ParentNode): () => void;
