import { type KeyboardEvent, type PointerEvent, type ReactNode } from "react";
import type { SortLane, SortState } from "./sortable-list-types.ts";
export type Part = "handle" | "up" | "down" | "remove" | "move-to";
/** What the list hands each item: its own settings and what the item calls back. */
export interface ItemCtx<T> {
    renderItem: (item: T, state: SortState) => ReactNode;
    renderFoot?: (item: T, state: SortState) => ReactNode;
    byId: Map<string, T>;
    lifted: {
        id: string;
        from: number;
        fromList: string;
    } | null;
    dragging: string | null;
    labelOf: (id: string) => string;
    renderHead?: (item: T, state: SortState) => ReactNode;
    itemClassName?: (item: T, state: SortState) => string | undefined;
    altKeys: boolean;
    readOnly: boolean;
    busy: boolean;
    grip: boolean;
    helpId: string;
    board: boolean;
    moveTo: boolean;
    lanes: readonly SortLane<T>[];
    steps: "quiet" | "bordered" | "labeled";
    name?: string;
    removeStyle: "quiet" | "bordered";
    min: number;
    onRemove?: (id: string, at: {
        index: number;
        list: string;
    }) => void;
    renderControls?: (item: T, state: SortState) => ReactNode;
    step: (id: string, by: -1 | 1, part: Part, keep?: HTMLElement | null) => void;
    remove: (id: string) => void;
    toLane: (id: string, list: string, el: HTMLElement) => void;
    onHandleKey: (e: KeyboardEvent, id: string) => void;
    onPointerDown: (e: PointerEvent, id: string) => void;
    refFor: (kind: "item" | "handle" | "control", key: string) => (el: HTMLElement | null) => void;
}
export declare function SortItem<T>({ c, lane, order, id, index, }: {
    c: ItemCtx<T>;
    lane: SortLane<T>;
    order: string[];
    id: string;
    index: number;
}): import("react").JSX.Element;
