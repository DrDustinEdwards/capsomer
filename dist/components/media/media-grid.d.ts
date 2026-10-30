export interface TileBox {
    id: string;
    top: number;
    left: number;
    width: number;
}
export interface Band {
    top: number;
    items: Array<{
        id: string;
        mid: number;
    }>;
}
export type Direction = "left" | "right" | "up" | "down" | "first" | "last" | "prev" | "next";
export declare function bands(boxes: Iterable<TileBox>): Band[];
export declare function nextTile(rows: Band[], active: string, dir: Direction): string | null;
