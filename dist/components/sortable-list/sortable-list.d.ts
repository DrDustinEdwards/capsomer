export interface SortMove {
    id: string;
    from: number;
    to: number;
}
export declare function moveId(order: readonly string[], id: string, to: number): string[];
export interface Box {
    top: number;
    left: number;
    width: number;
    height: number;
}
export declare function indexAtPoint(others: readonly Box[], x: number, y: number, layout?: Layout): number;
export type Layout = "rows" | "cards";
export declare const sortText: {
    help: string;
    lift: (label: string, pos: number, count: number) => string;
    over: (label: string, pos: number, count: number) => string;
    drop: (label: string, pos: number, count: number, moved: boolean) => string;
    cancel: (label: string, pos: number, count: number) => string;
    step: (label: string, pos: number, count: number) => string;
};
export declare function keyTarget(key: string, index: number, count: number): number | null;
export interface DragHandlers {
    onStart(): void;
    onMove(x: number, y: number): void;
    onDrop(x: number, y: number): void;
    onCancel(): void;
}
export declare const DRAG_THRESHOLD = 4;
export declare function startPointerDrag(down: PointerEvent, h: DragHandlers, threshold?: number): void;
export declare function announcer(el: HTMLElement): {
    region: HTMLElement;
    made: boolean;
};
export interface SortChangeDetail extends SortMove {
    order: string[];
    by: "keyboard" | "pointer" | "button";
}
export interface SortableList {
    readonly el: HTMLElement;
    order(): string[];
    move(id: string, to: number): void;
    detach(): void;
}
export declare function placeItem(item: HTMLElement, to: number): void;
export declare function createSortableList(el: HTMLElement): SortableList;
export declare function enhance(root?: ParentNode): () => void;
