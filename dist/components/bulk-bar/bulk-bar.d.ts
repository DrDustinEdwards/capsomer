export interface BulkItem {
    id: string;
    label: string;
}
export declare function countText(n: number): string;
export declare function plural(n: number, noun: string, many?: string): string;
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
export interface BulkActionSpec {
    action: string;
    items: readonly BulkItem[];
    value?: string;
    run: (items: readonly BulkItem[], value?: string) => void | Promise<void>;
    undo?: (items: readonly BulkItem[], value?: string) => void | Promise<void>;
    destructive?: boolean;
    confirmTitle?: string;
    confirmLead?: string;
    confirmAction?: string;
    said?: string;
    undone?: string;
    returnTo?: HTMLElement | null;
}
export declare function performBulk(spec: BulkActionSpec): Promise<boolean>;
export interface BulkHandler {
    run: BulkActionSpec["run"];
    undo?: BulkActionSpec["undo"];
    said?: string;
    undone?: string;
}
export declare function bindBulk(bar: HTMLElement, actions: Record<string, BulkHandler>): void;
export declare function listOf(bar: HTMLElement): HTMLElement | null;
export declare function boxesOf(list: ParentNode): HTMLInputElement[];
export declare function labelOf(box: HTMLInputElement): string;
export declare function selectedItems(bar: HTMLElement): BulkItem[];
export declare function itemsInView(list: ParentNode): HTMLInputElement[];
export declare function setAllInView(list: ParentNode, on: boolean): void;
export declare function showOutcomes(bar: HTMLElement, outcomes: readonly BulkOutcome[]): void;
export declare function refresh(bar: HTMLElement): number;
export declare function clearSelection(bar: HTMLElement): void;
export declare function invoke(bar: HTMLElement, button: HTMLElement): Promise<boolean>;
export declare function attachBulkBar(bar: HTMLElement): () => void;
export declare function enhance(root?: ParentNode): () => void;
