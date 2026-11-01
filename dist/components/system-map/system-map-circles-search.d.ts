import { type Rect } from "./system-map-inside.ts";
/**
 * A box in the drawing: a part inside the circle, or on the rim what is outside it or another system.
 */
export interface CircleNode {
    id: string;
    role: "part" | "outside" | "system";
    name: string;
    lines: string[];
    sub: string;
    w: number;
    h: number;
    store?: boolean;
    private?: boolean;
    x: number;
    y: number;
}
/** A wire: node indices, CIRCLE for the circle itself. */
export interface CircleWire {
    a: number;
    b: number;
    from: string;
    to: string;
    loose: boolean;
}
/** A wire's shape: its end points, the points along it, its path, and how far it bows. */
export interface WireShape {
    seg: number[];
    pts: number[][];
    d: string;
    bow: number;
}
/** The circle's own end of a line between two systems as wholes. */
export declare const CIRCLE = -1;
export declare const NAME_SIZE = 11.5;
export declare const KIND_SIZE = 9;
export declare const RIM_SIZE = 11;
export declare const LINE_H = 13;
export declare const BOX_PAD_X = 8;
export declare const MIN_BOX_W = 58;
export declare const RIM_H = 24;
export declare const RIM_PAD_X = 10;
export declare const MARGIN = 12;
export declare const GRID = 10;
/** The name at the circle's foot. */
export declare const LABEL_SIZE = 10;
export declare const LABEL_FOOT = 14;
export declare const OVERLAP = 1000000;
export declare const CROSSING = 10000;
/** How many moves the annealing tries on a drawing with a fault. */
export declare const ANNEAL_STEPS = 12000;
/** How many seeds the search runs from, at most. */
export declare const SEEDS = 3;
/** Every number the search is drawn from, so a saved circle is searched again once one changes. */
export declare const SEARCH_NUMBERS: number[];
export declare const f1: (n: number) => number;
/**
 * A text's width, estimated from its letters: the drawing is made at build time, with no font to
 * measure, so each class of letter gets its share of an em, a little over the UI face's, so a box
 * is never too narrow.
 */
export declare function textWidth(s: string, size: number): number;
/**
 * A part's name in one line, or two when it is wider than MAX_LINE: broken after a hyphen or at a
 * space, where the longer line is shortest.
 */
export declare function wrapName(name: string): string[];
export declare const rectOf: (n: CircleNode) => Rect;
/** Whether segments s and t, each [ax, ay, bx, by], cross at a point inside both. */
export declare function segmentsCross(s: readonly number[], t: readonly number[]): boolean;
/** A small deterministic generator, so the same data always draws the same way. */
export declare function random(seed: number): () => number;
/**
 * The rim in its order: the first `top` of `seq` above the circle, left to right, the rest below
 * it, right to left, so the order runs once round the circle clockwise.
 */
export declare function placeRim(nodes: CircleNode[], seq: readonly number[], top: number, r: number, halfW: number): void;
export declare function coster(nodes: CircleNode[], wires: readonly CircleWire[], r: number, label: Rect | null): {
    total: () => number;
    partial: (i: number) => number;
    refresh: (i: number) => void;
    refreshAll: () => void;
    segs: number[][];
};
/**
 * The circle's radius for its parts: room for each box and its share of the gaps, at under half
 * the circle's area. A circle too wide for the shell widens the drawing, which then draws a little
 * smaller.
 */
export declare function radiusFor(parts: readonly CircleNode[]): number;
/** Every place a part may sit: on the grid, wholly inside the circle and clear of its name. */
export declare function slotsFor(b: CircleNode, r: number, label: Rect | null): Array<[number, number]>;
/**
 * The rim's first order: what wires to the same part side by side, the parts in the order the
 * data gives them, then the systems reached only as wholes.
 */
export declare function firstOrder(nodes: readonly CircleNode[], wires: readonly CircleWire[], rim: readonly number[]): number[];
/**
 * The parts' first places. The part most wires run to sits in the middle. Each other part with a
 * wire to the rim sits toward what it wires to there; a part that wires only to the middle one (a
 * store under its Worker) goes into the widest gap left between the middle one's spokes, so its own
 * spoke is short and none passes it.
 */
export declare function firstPlaces(nodes: CircleNode[], wires: readonly CircleWire[], parts: readonly number[], slots: ReadonlyArray<ReadonlyArray<[number, number]>>, r: number, rand: () => number): void;
/**
 * Each wire straight where it can be, and gently curved where a straight line would run under a
 * box or cross another wire: every wire with a fault tries curves through control points over the
 * drawing, keeping the one with the fewest faults, then the least bowed. A wire between two parts
 * stays inside the circle.
 */
export declare function bendWires(nodes: readonly CircleNode[], wires: readonly CircleWire[], r: number, label: Rect | null): WireShape[];
/** The search's own code and numbers, so a saved circle is searched again once what drew it changes. */
export declare const SEARCH_CODE: string;
