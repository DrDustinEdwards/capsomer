import type { ReactNode } from "react";
import type { Layout, Lists, SortMessages, SortMove } from "./sortable-list.ts";
export interface SortState {
    index: number;
    lifted: boolean;
    list: string;
}
export interface CoreProps<T> {
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
    renderFoot?: (item: T, state: SortState) => ReactNode;
    removeStyle?: "quiet" | "bordered";
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
export interface CoreInput<T> extends CoreProps<T> {
    lanes: readonly SortLane<T>[];
    board: boolean;
    onChange: (lists: Lists, move: BoardMove) => void;
    onAdd?: () => void;
    addLabel?: string;
    max?: number;
    moveTo?: boolean;
    renderLaneHead?: (lane: SortLane<T>) => ReactNode;
    laneClassName?: string | ((lane: SortLane<T>) => string | undefined);
    label: {
        "aria-label"?: string;
        "aria-labelledby"?: string;
    };
}
