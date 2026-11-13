export declare const COPIED_MS = 2500;
export declare const COPY_FAILED_MS = 8000;
export type CopyOutcome = "copied" | "failed";
export type ShareOutcome = "shared" | "copied" | "canceled" | "failed";
export declare function copyText(text: string): Promise<boolean>;
export declare function shareLink(data: {
    url: string;
    title?: string;
    text?: string;
}): Promise<ShareOutcome>;
export declare function textOf(target: Element): string;
export declare function messageFor(outcome: CopyOutcome | ShareOutcome, button?: HTMLElement): string;
export declare function distinct(message: string): string;
export declare function report(button: HTMLElement, outcome: CopyOutcome | ShareOutcome): void;
export declare function run(button: HTMLElement, target: Element, command: string): Promise<void>;
export declare function enhance(root?: ParentNode): () => void;
