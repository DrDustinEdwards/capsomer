export type Point = [x: number, y: number];
export type Segment = [x1: number, y1: number, x2: number, y2: number];
export interface CalloutPlace {
    leader: Segment[];
    label: {
        x: number;
        y: number;
        anchor: "start" | "end";
    };
}
/** A number at one decimal: coordinates in the markup stay short and stable. */
export declare const round1: (n: number) => number;
/** `p` moved so that `from` lands on `to`, scaled by `k` about it. */
export declare function scalePoint(p: Point, k: number, from?: Point, to?: Point): Point;
/**
 * Every "x y" (or "x,y") pair in an absolute path's data passed through `map`: a path drawn on one
 * canvas, placed on another. Commands with one number (H, V) and relative commands are not pairs
 * and are left as they are, so draw the path in absolute M, L, C and Q.
 */
export declare function scalePathData(d: string, map: (p: Point) => Point): string;
/**
 * A callout whose label sits beside the drawing: a leader from `from` out to an elbow just past
 * `edge` (the drawing's half width from `cx`), then level to its tail, and the label after the tail,
 * on the right (`side` 1) or the left (-1), at height `y`.
 */
export declare function sideCallout(opts: {
    from: Point;
    side: 1 | -1;
    y: number;
    edge: number;
    cx?: number;
    elbow?: number;
    tail?: number;
    gap?: number;
    baseline?: number;
}): CalloutPlace;
/** A view box as the attribute wants it. */
export declare function viewBox(v: {
    x: number;
    y: number;
    w: number;
    h: number;
}): string;
/** The pin after a tap on `id`: the same callout again unpins it. */
export declare function nextPin(pinned: string | null, id: string): string | null;
export declare function drawLeaders(svg: Element): void;
/**
 * Wires one figure: its callouts and the entries of every key that names it (`data-for` its id)
 * light together. With `data-draw` on the figure, the drawing on show draws its leaders in once it
 * is in view, except under reduced motion. Returns a function that detaches.
 */
export declare function attach(figure: HTMLElement): () => void;
export declare function enhance(root?: Element | Document | DocumentFragment): () => void;
