import { type ReactNode } from "react";
import { type TreeMove, type TreeSelection } from "./tree.ts";
export { applyMove, branchIds, dropMove, findNode, findPlace, movedText, planMove, reverseMove, treeKey, visibleRows } from "./tree.ts";
export type { DropZone, MoveDir, TreeMove, TreePlace, TreeSelection, VisibleRow } from "./tree.ts";
export interface TreeNode {
    id: string;
    label: string;
    href?: string;
    meta?: ReactNode;
    icon?: ReactNode;
    disabled?: boolean;
    children?: TreeNode[];
}
export interface TreeProps {
    nodes: TreeNode[];
    "aria-label"?: string;
    "aria-labelledby"?: string;
    selection?: TreeSelection;
    selected?: string[];
    defaultSelected?: string[];
    onSelectedChange?: (ids: string[], node: TreeNode) => void;
    expanded?: string[];
    defaultExpanded?: string[];
    onExpandedChange?: (ids: string[]) => void;
    onMove?: (move: TreeMove, next: TreeNode[]) => void;
    canMove?: (move: TreeMove) => boolean;
    variant?: "surface";
    className?: string;
}
export declare function Tree({ nodes, selection, selected, defaultSelected, onSelectedChange, expanded, defaultExpanded, onExpandedChange, onMove, canMove, variant, className, ...name }: TreeProps): import("react").JSX.Element;
