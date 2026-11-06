export declare function rememberOpener(dialog: HTMLDialogElement, opener?: Element | null): void;
export declare function returnFocus(dialog: HTMLDialogElement, fallback?: HTMLElement | null): void;
export declare function isBackdropClick(dialog: HTMLDialogElement, e: MouseEvent): boolean;
export declare function errorText(e: unknown): string;
export declare function uid(prefix: string): string;
export declare function isBusy(dialog: HTMLDialogElement): boolean;
export declare function setDialogBusy(dialog: HTMLDialogElement, on: boolean): void;
export declare function isLocked(dialog: HTMLDialogElement): boolean;
export interface DialogOptions {
    history?: boolean;
    focus?: HTMLElement | null;
    returnTo?: HTMLElement | null;
}
export declare function historyHash(dialog: HTMLDialogElement): string;
export declare function focusInitial(dialog: HTMLDialogElement, target?: HTMLElement | null): void;
export declare function syncScroll(dialog: HTMLDialogElement): void;
export declare function wireDialog(dialog: HTMLDialogElement, opts?: DialogOptions): () => void;
export declare function openDialog(dialog: HTMLDialogElement, opener?: Element | null, opts?: DialogOptions): void;
export declare function closeDialog(dialog: HTMLDialogElement, returnValue?: string): void;
export declare function enhance(root?: ParentNode): () => void;
