import { type ConfirmOptions } from "./confirm-build.ts";
export { buildConfirm } from "./confirm-build.ts";
export type { ConfirmOptions } from "./confirm-build.ts";
export declare function wordPattern(word: string): string;
type Perform = (reason: string) => Promise<void>;
export declare function reasonOf(dialog: HTMLDialogElement): string;
export declare function setBusy(dialog: HTMLDialogElement, on: boolean): void;
export declare function showError(dialog: HTMLDialogElement, message: string): void;
export declare function showReasonError(dialog: HTMLDialogElement): void;
export declare function clearError(dialog: HTMLDialogElement): void;
export declare function bindPerform(dialog: HTMLDialogElement, perform: Perform): void;
export declare function openConfirm(dialog: HTMLDialogElement, opener?: Element | null): void;
export declare function wasPerformed(dialog: HTMLDialogElement): boolean;
export declare function wire(dialog: HTMLDialogElement, fallback?: HTMLElement | null): () => void;
export declare function confirm(o: ConfirmOptions): Promise<boolean>;
export type ConfirmSubmitOptions = Omit<ConfirmOptions, "perform" | "body"> & {
    body?: string[];
};
export declare function confirmSubmit(e: {
    preventDefault(): void;
    currentTarget: Element;
    submitter?: HTMLElement | null;
    nativeEvent?: object;
}, o: ConfirmSubmitOptions): void;
export declare function enhance(root?: ParentNode): () => void;
