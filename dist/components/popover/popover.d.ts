export type Side = "top" | "bottom" | "left" | "right" | "inline-start" | "inline-end";
export type Align = "start" | "center" | "end";
export interface PlaceOptions {
    side?: Side;
    align?: Align;
    offset?: number;
}
export interface Placement {
    side: "top" | "bottom" | "left" | "right";
    align: Align;
    x: number;
    y: number;
}
export declare const SHOW_DELAY_MS = 300;
export declare const HIDE_GRACE_MS = 150;
export declare const GROUP_MS = 400;
export declare function supportsAnchor(): boolean;
export interface VirtualAnchor {
    getBoundingClientRect(): DOMRect;
}
export declare function place(anchor: Element | VirtualAnchor, popup: HTMLElement, options?: PlaceOptions): Placement;
export declare function attach(trigger: HTMLElement, popup: HTMLElement): () => void;
export declare function openAt(popup: HTMLElement, anchor: VirtualAnchor, options?: PlaceOptions & {
    returnFocus?: HTMLElement | null;
}): () => void;
export declare function open(popup: HTMLElement): void;
export declare function close(popup: HTMLElement): void;
export declare function toggle(popup: HTMLElement): void;
export declare function enhance(root?: ParentNode): () => void;
