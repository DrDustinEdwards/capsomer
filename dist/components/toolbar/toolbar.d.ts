export declare function rovingIndex(key: string, at: number, count: number, axis?: "horizontal" | "vertical", rtl?: boolean): number | null;
export interface ToolbarOptions {
    keepFocus?: () => HTMLElement | null;
}
export declare const NATIVE_FOCUSGROUP: boolean;
export declare function attachToolbar(bar: HTMLElement, items?: string, options?: ToolbarOptions): () => void;
export declare function enhance(root?: ParentNode): () => void;
