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
export type Layout = "rows" | "cards" | "stack";
export type Lists = Record<string, string[]>;
export declare function locate(lists: Lists, id: string): {
    list: string;
    index: number;
} | null;
export declare function moveBetween(lists: Lists, id: string, toList: string, to: number): Lists;
export declare function keyMove(key: string, at: {
    list: number;
    index: number;
}, sizes: readonly number[]): {
    list: number;
    index: number;
} | null;
export declare const sortText: {
    help: string;
    lift: (label: string, pos: number, count: number) => string;
    over: (label: string, pos: number, count: number) => string;
    drop: (label: string, pos: number, count: number, moved: boolean) => string;
    cancel: (label: string, pos: number, count: number) => string;
    step: (label: string, pos: number, count: number) => string;
    moveTo: (label: string, list: string, pos: number, count: number) => string;
    removed: (label: string, left: number) => string;
    added: (label: string, count: number) => string;
};
export type SortMessages = typeof sortText;
export declare function keyTarget(key: string, index: number, count: number): number | null;
export interface DragHandlers {
    onStart(): void;
    onMove(x: number, y: number): void;
    onDrop(x: number, y: number): void;
    onCancel(): void;
}
export declare const DRAG_THRESHOLD = 4;
export declare function moveNode(parent: Element, node: Element, ref: Node | null): void;
export declare function startPointerDrag(down: PointerEvent, h: DragHandlers, threshold?: number): void;
export declare function announcer(el: HTMLElement): {
    region: HTMLElement;
    made: boolean;
};
export interface SortChangeDetail extends SortMove {
    order: string[];
    by: "keyboard" | "pointer" | "button" | "select";
    list: string;
    fromList: string;
    lists: Lists;
}
export interface SortRemoveDetail {
    id: string;
    list: string;
    index: number;
}
export interface SortableList {
    readonly el: HTMLElement;
    order(): string[];
    move(id: string, to: number): void;
    detach(): void;
}
export declare function groupOf(el: HTMLElement): HTMLElement[];
export declare function placeItem(item: HTMLElement, to: number): void;
export declare function placeIn(item: HTMLElement, list: HTMLElement, to: number): void;
export declare function createSortableList(el: HTMLElement): SortableList;
export declare function enhance(root?: ParentNode): () => void;
