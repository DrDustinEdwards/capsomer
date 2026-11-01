export interface TreeNodeLike {
    id: string;
    label?: string;
    disabled?: boolean;
    children?: readonly TreeNodeLike[];
}
export interface VisibleRow {
    id: string;
    parent: string | null;
    level: number;
    posinset: number;
    setsize: number;
    branch: boolean;
    expanded: boolean;
    disabled: boolean;
    label: string;
}
export declare function visibleRows(nodes: readonly TreeNodeLike[], expanded: ReadonlySet<string>): VisibleRow[];
export declare function branchIds(nodes: readonly TreeNodeLike[]): string[];
export interface TreeKeyResult {
    focus?: string;
    expand?: string[];
    collapse?: string;
    select?: string;
    move?: MoveDir;
}
export interface KeyMods {
    altKey?: boolean;
    ctrlKey?: boolean;
    metaKey?: boolean;
    shiftKey?: boolean;
}
export declare function treeKey(rows: readonly VisibleRow[], current: string | null, key: string, mods?: KeyMods, movable?: boolean): TreeKeyResult | null;
export type MoveDir = "up" | "down" | "in" | "out";
export interface TreePlace {
    parent: string | null;
    index: number;
}
export interface TreeMove {
    id: string;
    from: TreePlace;
    to: TreePlace;
}
export declare function findNode<T extends TreeNodeLike>(nodes: readonly T[], id: string): T | undefined;
export declare function findPlace(nodes: readonly TreeNodeLike[], id: string, parent?: string | null): TreePlace | null;
export declare function isWithin(nodes: readonly TreeNodeLike[], id: string, ancestor: string): boolean;
export declare function planMove(nodes: readonly TreeNodeLike[], id: string, dir: MoveDir): TreeMove | null;
export type DropZone = "before" | "after" | "inside";
export declare function dropMove(nodes: readonly TreeNodeLike[], id: string, target: string, zone: DropZone): TreeMove | null;
export declare function zoneAt(y: number, top: number, height: number, branch: boolean): DropZone;
export declare function applyMove<T extends TreeNodeLike>(nodes: readonly T[], move: TreeMove): T[];
export declare function reverseMove(move: TreeMove): TreeMove;
export declare function movedText(nodes: readonly TreeNodeLike[], move: TreeMove): string;
export declare function cannotMoveText(label: string, dir: MoveDir): string;
