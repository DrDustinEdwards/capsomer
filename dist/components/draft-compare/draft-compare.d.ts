import { type CompareView } from "./draft-compare-render.ts";
export { tokenize, countWords, commonSubsequence, diffWords, splitSentences, diffSentences, analyze, analyse, // codespell:ignore
countsText, } from "./draft-compare-diff.ts";
export type { Op, WordPart, DiffOptions, Sentence, Entry, SentenceOptions, Counts, Analysis, } from "./draft-compare-diff.ts";
export { escapeHtml as esc } from "@dustinedwards/site-runtime/html";
export { VIEWS, STORAGE_KEY, renderCompare } from "./draft-compare-render.ts";
export type { CompareView, CompareSide, RunKind, RunSpan, CompareLabels, CompareOptions, } from "./draft-compare-render.ts";
export { choicesOf, merged, mergePlan, startPicks } from "./draft-compare-merge.ts";
export type { MergeBlock, MergeChoice, MergePick, MergePlan, MergeSegment, } from "./draft-compare-merge.ts";
export { parsePatch, patchCounts, patchCountsText, revisionPair, renderPatch, unifiedPatch, hasChanges, } from "./draft-compare-patch.ts";
export type { PatchOp, PatchLine, PatchHunk, PatchFile, PatchOptions, PatchCounts, UnifiedSide, UnifiedOptions, } from "./draft-compare-patch.ts";
export declare function currentView(root: Element): CompareView;
export declare function setView(root: Element, view: CompareView): void;
export declare function toggleAll(root: Element): void;
export declare function enhance(root?: Element | Document | DocumentFragment): () => void;
