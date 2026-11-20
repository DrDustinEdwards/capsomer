export declare const MIN_SCALE = 0.5;
export declare const MAX_SCALE = 3;
export declare const SCALE_STEP = 0.25;
export declare const DEFAULT_SCALE = 1.2;
export declare function clampView(to: {
    page?: number;
    scale?: number;
}, at: {
    page: number;
    scale: number;
    pages: number;
}): {
    page: number;
    scale: number;
};
export declare function start(root: HTMLElement): () => void;
export declare function enhance(root?: ParentNode): () => void;
