export interface SummaryItem {
    control: HTMLElement;
    text: string;
}
export declare function setTitleError(on: boolean): void;
export declare function wireSummary(summary: HTMLElement): () => void;
export declare function summaryFor(form: HTMLFormElement): HTMLElement;
export declare function showSummary(summary: HTMLElement, items: SummaryItem[]): void;
export declare function hideSummary(summary: HTMLElement): void;
export declare function enhance(root?: ParentNode): () => void;
