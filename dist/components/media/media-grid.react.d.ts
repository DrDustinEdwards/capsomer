import { type MediaRecord } from "./media.ts";
export interface MediaTileProps {
    item: MediaRecord;
    active?: boolean;
    selected?: boolean;
    inspecting?: boolean;
    tabStop?: boolean;
    href?: string;
    onOpen?: (key: string) => void;
    onSelect?: (key: string, how: "toggle" | "range") => void;
    onRetry?: (key: string) => void;
    onRestore?: (key: string) => void;
    selectForm?: string;
    selectable?: boolean;
}
export declare function MediaTile({ item, active, selected, inspecting, tabStop, href, onOpen, onSelect, onRetry, onRestore, selectForm, selectable: canSelect }: MediaTileProps): import("react").JSX.Element;
export interface MediaGroup {
    label: string;
    items: readonly MediaRecord[];
}
export interface MediaGridProps {
    items?: readonly MediaRecord[];
    groups?: readonly MediaGroup[];
    activeKey: string;
    onActiveChange: (key: string) => void;
    selected: readonly string[];
    onSelectedChange: (keys: string[]) => void;
    onOpen: (key: string) => void;
    inspecting?: boolean;
    onRetry?: (key: string) => void;
    onRestore?: (key: string) => void;
    size?: "s" | "m" | "l";
    label?: string;
    hrefFor?: (key: string) => string;
    selectForm?: string;
    selectable?: boolean;
}
export declare function MediaGrid({ items, groups, activeKey, onActiveChange, selected, onSelectedChange, onOpen, inspecting, onRetry, onRestore, label, hrefFor, selectForm, selectable }: MediaGridProps): import("react").JSX.Element;
