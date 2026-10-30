import { type TreeMove, type TreeNodeLike } from "./tree-model.ts";
export { visibleRows, branchIds, treeKey, findNode, findPlace, isWithin, planMove, dropMove, zoneAt, applyMove, reverseMove, movedText, cannotMoveText } from "./tree-model.ts";
export type { TreeNodeLike, VisibleRow, TreeKeyResult, KeyMods, MoveDir, TreePlace, TreeMove, DropZone } from "./tree-model.ts";
export type TreeSelection = "none" | "single" | "multi";
export interface TreeSelectDetail {
    id: string;
    label: string;
    selected: boolean;
    values: string[];
}
export interface Tree {
    readonly el: HTMLElement;
    nodes(): TreeNodeLike[];
    expanded(): string[];
    setExpanded(id: string, open: boolean): void;
    selected(): string[];
    focus(id?: string): void;
    move(move: TreeMove): boolean;
    refresh(): void;
    detach(): void;
}
export declare function createTree(el: HTMLElement): Tree;
export declare function treeFor(el: Element | null): Tree | undefined;
export declare function enhance(root?: ParentNode): () => void;
