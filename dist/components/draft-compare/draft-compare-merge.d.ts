import { type WordPart } from "./draft-compare-diff.ts";
/** One block. `gap` is the blank lines written after it in its source, kept so an untouched text comes back byte for byte. */
export type MergeBlock = {
    front: boolean;
    text: string;
    gap: string;
};
export type MergePick = "mine" | "theirs" | "both";
export type MergeSegment = {
    kind: "same";
    blocks: MergeBlock[];
} | {
    kind: "choice";
    mine: MergeBlock[];
    theirs: MergeBlock[];
    /** Which side changed it from the base; null when both did, or there is no base. */
    changedBy: "mine" | "theirs" | null;
    /** The pick it opens on. */
    start: MergePick;
    /** For one block against one block: the words, from mine to theirs. */
    words?: WordPart[];
};
export type MergePlan = {
    segments: MergeSegment[];
    /** Whether the version both started from was given. */
    hasBase: boolean;
    /** The frontmatter fences to write: mine, else theirs. */
    open: string;
    close: string;
};
export type MergeChoice = Extract<MergeSegment, {
    kind: "choice";
}>;
export declare const choicesOf: (plan: MergePlan) => MergeChoice[];
/** The picks a plan opens on, one per choice, in order. */
export declare const startPicks: (plan: MergePlan) => MergePick[];
/** The merged source for these picks, one per choice in order (a missing pick is the choice's start). */
export declare function merged(plan: MergePlan, picks: readonly MergePick[]): string;
/** The merge plan for `mine` against `theirs`, over `base` (the version both started from) when it is known. */
export declare function mergePlan(mine: string, theirs: string, base: string | null): MergePlan;
