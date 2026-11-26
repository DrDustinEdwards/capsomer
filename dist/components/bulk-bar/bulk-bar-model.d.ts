export interface BulkItem {
    id: string;
    label: string;
}
export declare function countText(n: number): string;
export declare function fillCount(template: string, n: number): string;
export declare function previewItems(items: readonly BulkItem[]): string[];
export interface BulkOutcome {
    id: string;
    label: string;
    ok: boolean;
    message?: string;
    usedBy?: readonly string[];
}
export declare function orderOutcomes(outcomes: readonly BulkOutcome[]): BulkOutcome[];
export declare function outcomeSummary(outcomes: readonly BulkOutcome[]): string;
export declare function visibleSelection(selected: ReadonlySet<string>, rows: ReadonlyArray<{
    id: string;
}>): string[];
export declare function allVisibleSelected(selected: ReadonlySet<string>, rows: ReadonlyArray<{
    id: string;
}>): boolean;
export declare function toggleAllVisible(selected: ReadonlySet<string>, rows: ReadonlyArray<{
    id: string;
}>): Set<string>;
export declare function toggleOne(selected: ReadonlySet<string>, id: string): Set<string>;
export declare function failedIds(outcomes: readonly BulkOutcome[]): Set<string>;
