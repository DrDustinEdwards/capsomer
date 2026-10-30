import { type MapSystem, type SystemMapData } from "./system-map-data.ts";
import { type Rect } from "./system-map-inside.ts";
import { type CircleNode, type CircleWire, type WireShape } from "./system-map-circles-search.ts";
export type { CircleNode, CircleWire, WireShape } from "./system-map-circles-search.ts";
/**
 * One circle laid out: its radius, the name at its foot, every box placed, every wire with its
 * shape, the drawing's top, foot and width, and what the search scored it.
 */
export interface CircleLayout {
    name: string;
    r: number;
    label: Rect | null;
    nodes: CircleNode[];
    wires: Array<CircleWire & WireShape>;
    top: number;
    bottom: number;
    width: number;
    faults: number;
    cost: number;
}
/** A circle already searched for, under the key of what drew it. */
export interface SavedCircle {
    key: string;
    layout: CircleLayout;
}
export interface CircleScene {
    system: MapSystem;
    nodes: CircleNode[];
    wires: CircleWire[];
}
/** What one system's circle draws: its parts, what is around its rim, and its wires, before anything is placed. */
export declare function sceneOf(data: SystemMapData, id: string): CircleScene;
/**
 * What one circle is drawn from, as a key: its name, boxes and wires, the width it is drawn at,
 * and the search's own code and numbers. A saved circle with the same key is the circle the search
 * would draw.
 */
export declare function layoutKey(scene: CircleScene, minWidth: number): string;
/**
 * Lays out one circle, at least `minWidth` wide: the shell's.
 *
 * At each size the search runs from up to SEEDS fixed seeds while a fault is left, and the drawing
 * kept is the one with the fewest faults once its wires are curved (a wire under a box counting ten
 * crossings), the smallest of those tied. A circle with any fault left is drawn larger, a twentieth
 * at a time up to half again: room lets a wire bow round the others, which is the only way past two
 * parts that share three boxes (Carrel's Worker and its fifteen-minute check each wire to the site,
 * Google and Email; straight, one pair must cross). A circle with no fault stops at the first size,
 * so only a circle that needs the room pays for it in width.
 */
export declare function layoutScene(scene: CircleScene, minWidth: number): CircleLayout;
/**
 * What a laid-out circle gets wrong, in words: boxes too close, a wire under a box it does not end
 * at or under the name, and two wires crossing.
 */
export declare function faultsOf(l: CircleLayout): string[];
export interface CircleOptions {
    /** What a circle with no parts says in its middle: the system's description by default. */
    summary?: (s: MapSystem) => string;
    /**
     * Circles already searched for, by system id with their key. One whose key still matches is
     * used as it is; the rest are searched for and put in it, so the caller can keep them (a file
     * beside the build). A system the data no longer has is dropped from it.
     */
    saved?: Record<string, SavedCircle>;
}
/**
 * Every system's inside layer, as markup, by id, for `systemMapHtml`'s `circles`: laid out at the
 * shell's width, each at least the shell's height for that width, so zooming into a small system
 * leaves the stage its size. The core's carries the token when it has flows to play.
 */
export declare function circleLayers(data: SystemMapData, options?: CircleOptions): Record<string, string>;
