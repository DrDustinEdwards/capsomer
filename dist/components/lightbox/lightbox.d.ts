export declare function grow(from: HTMLElement | undefined, to: HTMLElement, change: () => void): void;
export declare function openViewer(options: {
    src: string;
    alt: string;
    label?: string;
    source?: HTMLElement;
    opener?: HTMLElement | null;
}): HTMLDialogElement;
export declare function closeViewer(dialog: HTMLDialogElement, source?: HTMLElement): void;
export declare function enhance(root?: ParentNode): () => void;
