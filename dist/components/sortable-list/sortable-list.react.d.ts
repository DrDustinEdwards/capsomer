import { type ReactNode } from "react";
import { type Layout, type Lists, type SortMessages, type SortMove } from "./sortable-list.ts";
export { indexAtPoint, keyMove, keyTarget, locate, moveBetween, moveId, sortText, } from "./sortable-list.ts";
export type { Layout, Lists, SortMessages, SortMove } from "./sortable-list.ts";
export interface SortState {
    index: number;
    lifted: boolean;
    list: string;
}
interface CoreProps<T> {
    getId: (item: T) => string;
    getLabel: (item: T) => string;
    renderItem: (item: T, state: SortState) => ReactNode;
    renderHead?: (item: T, state: SortState) => ReactNode;
    layout?: Layout;
    messages?: Partial<SortMessages>;
    altKeys?: boolean;
    readOnly?: boolean;
    busy?: boolean;
    onRemove?: (id: string, at: {
        index: number;
        list: string;
    }) => void;
    min?: number;
    empty?: ReactNode;
    start?: number;
    name?: string;
    className?: string;
    steps?: "quiet" | "bordered" | "labeled";
    grip?: boolean;
    itemClassName?: (item: T, state: SortState) => string | undefined;
    renderControls?: (item: T, state: SortState) => ReactNode;
}
export interface SortableListProps<T> extends CoreProps<T> {
    items: readonly T[];
    onReorder: (order: string[], move: SortMove) => void;
    onAdd?: () => void;
    addLabel?: string;
    max?: number;
    "aria-label"?: string;
    "aria-labelledby"?: string;
}
export interface SortLane<T> {
    id: string;
    label: string;
    items: readonly T[];
    empty?: ReactNode;
}
export interface BoardMove extends SortMove {
    fromList: string;
    toList: string;
}
export interface SortableBoardProps<T> extends CoreProps<T> {
    lanes: readonly SortLane<T>[];
    onMove: (lists: Lists, move: BoardMove) => void;
    renderLaneHead?: (lane: SortLane<T>) => ReactNode;
    moveTo?: boolean;
    laneClassName?: string | ((lane: SortLane<T>) => string | undefined);
    "aria-label"?: string;
}
export declare function SortableList<T>({ items, onReorder, onAdd, addLabel, max, "aria-label": ariaLabel, "aria-labelledby": labelledBy, ...rest }: SortableListProps<T>): import("react").JSX.Element;
export declare function SortableBoard<T>({ lanes, onMove, renderLaneHead, moveTo, "aria-label": ariaLabel, ...rest }: SortableBoardProps<T>): import("react").JSX.Element;
export interface Row<V> {
    id: string;
    value: V;
    index: number;
}
export declare function useRows<V>(value: readonly V[], onChange: (next: V[]) => void): {
    items: Row<V>[];
    getId: (r: Row<V>) => string;
    onReorder: (order: string[]) => void;
    onRemove: (id: string) => void;
};
