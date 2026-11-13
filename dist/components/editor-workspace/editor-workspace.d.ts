export type Layout = "write" | "split" | "preview";
export declare const LAYOUTS: readonly Layout[];
export declare const LAYOUT_KEY = "cap-editor-layout";
export declare function readLayout(stored: string | null | undefined): Layout;
export declare function storedLayout(key?: string): Layout | null;
export declare function storeLayout(layout: Layout, key?: string): void;
export declare function previewUrl(base: string, stamp: string, param?: string): string;
export declare function onSaveKey(save: () => void, target?: Window | HTMLElement): () => void;
export declare const TYPING_SURFACE = ".cm-editor, .cap-rich-editor-surface, [data-cap-typing-surface]";
export declare const TYPING_ATTR = "data-cap-typing";
export declare function typingRecede(options?: {
    surface?: string;
    root?: HTMLElement;
}): () => void;
export declare function enhance(root?: Element | Document | DocumentFragment): () => void;
