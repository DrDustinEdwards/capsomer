import { type PlaceOptions, type VirtualAnchor } from "./popover-place.ts";
export { supportsAnchor, place } from "./popover-place.ts";
export type { Side, Align, PlaceOptions, Placement, VirtualAnchor } from "./popover-place.ts";
export declare const SHOW_DELAY_MS = 300;
export declare const HIDE_GRACE_MS = 150;
export declare const GROUP_MS = 400;
export declare function attach(trigger: HTMLElement, popup: HTMLElement): () => void;
export declare function openAt(popup: HTMLElement, anchor: VirtualAnchor, options?: PlaceOptions & {
    returnFocus?: HTMLElement | null;
}): () => void;
export declare function open(popup: HTMLElement): void;
export declare function close(popup: HTMLElement): void;
export declare function toggle(popup: HTMLElement): void;
export declare function enhance(root?: ParentNode): () => void;
