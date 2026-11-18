export declare const DURATION_MS = 600;
export declare function easeOutCubic(t: number): number;
export declare function countUp(onProgress: (progress: number) => void, duration?: number): () => void;
export declare function formatter(el: HTMLElement): (n: number) => string;
export declare function enhance(root?: ParentNode): () => void;
