import { type SortMove, type Lists } from "./sortable-list-model.ts";
export { DRAG_THRESHOLD, moveNode, startPointerDrag } from "./sortable-drag.ts";
export type { DragHandlers } from "./sortable-drag.ts";
export { moveId, indexAtPoint, locate, moveBetween, keyMove, sortText, keyTarget, } from "./sortable-list-model.ts";
export type { SortMove, Box, Layout, Lists, SortMessages } from "./sortable-list-model.ts";
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
