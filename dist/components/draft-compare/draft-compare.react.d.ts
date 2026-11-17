import { type CompareLabels, type CompareSide, type CompareView, type RunSpan } from "./draft-compare.ts";
import { type MergePick, type MergePlan } from "./draft-compare-merge.ts";
export interface DraftCompareProps {
    before: CompareSide;
    after: CompareSide;
    labels?: Partial<CompareLabels>;
    view?: CompareView;
    onViewChange?: (view: CompareView) => void;
    context?: number;
    runs?: {
        before?: RunSpan[];
        after?: RunSpan[];
    };
    similarity?: number;
    id?: string;
    heads?: boolean;
}
export declare function DraftCompare({ before, after, labels, view, onViewChange, context, runs, similarity, id, heads, }: DraftCompareProps): import("react").JSX.Element;
export interface DraftPatchProps {
    patch: string;
    title?: string;
    id?: string;
}
export declare function DraftPatch({ patch, title, id }: DraftPatchProps): import("react").JSX.Element;
export interface MergeLabels {
    mine: string;
    theirs: string;
    keepMine: string;
    keepTheirs: string;
    keepBoth: string;
    notInMine: string;
    notInTheirs: string;
    changedMine: string;
    changedTheirs: string;
    leftOut: string;
    intro: string;
    withBase: string;
    withoutBase: string;
    apply: string;
}
/** "3 differences, 1 changed on both": for the heading or panel the merge sits in. */
export declare function mergeCountsText(plan: MergePlan): string;
export interface DraftMergeProps {
    plan: MergePlan;
    onApply: (picks: MergePick[]) => void;
    pending?: boolean;
    labels?: Partial<MergeLabels>;
    level?: 3 | 4;
}
export declare function DraftMerge({ plan, onApply, pending, labels, level }: DraftMergeProps): import("react").JSX.Element;
