export interface DragHandlers {
    onStart(): void;
    onMove(x: number, y: number): void;
    onDrop(x: number, y: number): void;
    onCancel(): void;
}
export declare const DRAG_THRESHOLD = 4;
export declare function moveNode(parent: Element, node: Element, ref: Node | null): void;
export declare function startPointerDrag(down: PointerEvent, h: DragHandlers, threshold?: number): void;
