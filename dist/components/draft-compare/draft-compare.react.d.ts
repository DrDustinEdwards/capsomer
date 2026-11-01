import { type CompareLabels, type CompareSide, type CompareView, type RunSpan } from "./draft-compare.ts";
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
export declare function DraftCompare({ before, after, labels, view, onViewChange, context, runs, similarity, id, heads }: DraftCompareProps): import("react").JSX.Element;
export interface DraftPatchProps {
    patch: string;
    title?: string;
    id?: string;
}
export declare function DraftPatch({ patch, title, id }: DraftPatchProps): import("react").JSX.Element;
