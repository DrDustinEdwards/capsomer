export interface HexOptions {
    count?: number;
    phoneCount?: number;
    random?: () => number;
}
export declare function drawHexes(field: HTMLElement, options?: HexOptions): HTMLElement[];
export declare function pauseOffscreen(layer: HTMLElement): () => void;
export declare function enhance(root?: ParentNode, options?: HexOptions): () => void;
