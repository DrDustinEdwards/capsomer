import { type ReactNode } from "react";
import { type Layout, type SortMove } from "./sortable-list.ts";
export { indexAtPoint, keyTarget, moveId, sortText } from "./sortable-list.ts";
export type { Layout, SortMove } from "./sortable-list.ts";
export interface SortableListProps<T> {
    items: readonly T[];
    getId: (item: T) => string;
    getLabel: (item: T) => string;
    renderItem: (item: T, state: {
        index: number;
        lifted: boolean;
    }) => ReactNode;
    onReorder: (order: string[], move: SortMove) => void;
    layout?: Layout;
    "aria-label"?: string;
    "aria-labelledby"?: string;
    name?: string;
    className?: string;
}
export declare function SortableList<T>({ items, getId, getLabel, renderItem, onReorder, layout, name, className, ...label }: SortableListProps<T>): import("react").JSX.Element;
