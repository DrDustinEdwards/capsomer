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
export declare function supportsAnchor(): boolean;
export declare function offsetOf(popup: HTMLElement): number;
export interface VirtualAnchor {
    getBoundingClientRect(): DOMRect;
}
export declare function place(anchor: Element | VirtualAnchor, popup: HTMLElement, options?: PlaceOptions): Placement;
export declare function settle(anchor: Element, popup: HTMLElement): boolean;
