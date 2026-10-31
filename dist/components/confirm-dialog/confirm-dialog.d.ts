export { errorText, isBackdropClick, isBusy, rememberOpener, returnFocus, uid } from "../dialog/dialog.ts";
export declare function wordMatches(typed: string, word: string | undefined): boolean;
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
export interface ConfirmOptions {
    title: string;
    lead?: string;
    body: string[];
    action: string;
    typeToConfirm?: string;
    perform: (reason: string) => Promise<void>;
    cancelLabel?: string;
    returnTo?: HTMLElement | null;
    reason?: {
        label?: string;
        note?: string;
    };
    media?: boolean;
}
export declare function buildConfirm(o: ConfirmOptions): HTMLDialogElement;
export declare function confirm(o: ConfirmOptions): Promise<boolean>;
export declare function enhance(root?: ParentNode): () => void;
