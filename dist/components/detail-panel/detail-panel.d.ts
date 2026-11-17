export interface DetailOptions {
    history?: boolean;
}
export declare function detailHash(dialog: HTMLDialogElement): string;
export declare function detailUrl(dialog: HTMLDialogElement, open: boolean, from?: string): string;
export declare function detailInUrl(dialog: HTMLDialogElement, from?: string): boolean;
export declare function wireDetail(dialog: HTMLDialogElement): () => void;
export declare function openDetail(dialog: HTMLDialogElement, opener?: Element | null, opts?: DetailOptions): void;
export declare function closeDetail(dialog: HTMLDialogElement): void;
export declare function copyFrom(button: HTMLElement, scope?: ParentNode): Promise<boolean>;
export declare function enhance(root?: ParentNode): () => void;
