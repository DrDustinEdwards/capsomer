import { type RefObject } from "react";
import type { Part } from "./sortable-list-item.react.tsx";
import { type Lists, type SortMessages } from "./sortable-list.ts";
type Els = RefObject<Map<string, HTMLElement>>;
export declare function useSortFocus<T>({ wantFocusRef, afterRemoveRef, addedRef, live, handles, controls, itemEls, addRef, total, laneIds, byId, getLabel, say, text, }: {
    wantFocusRef: RefObject<{
        id: string;
        part: Part;
        el?: HTMLElement | null;
    } | null>;
    afterRemoveRef: RefObject<{
        list: string;
        index: number;
        total: number;
    } | null>;
    addedRef: RefObject<{
        ids: Set<string>;
    } | null>;
    live: RefObject<Lists>;
    handles: Els;
    controls: Els;
    itemEls: Els;
    addRef: RefObject<HTMLButtonElement | null>;
    total: number;
    laneIds: string[];
    byId: Map<string, T>;
    getLabel: (item: T) => string;
    say: (words: string) => void;
    text: SortMessages;
}): void;
export {};
