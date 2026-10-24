import { type Layout, type MapContainer, type MapFlow, type MapLink, type MapSystem, type SystemMapData } from "./system-map-data.ts";
import type { Box } from "./system-map-html.ts";
export declare const BOX_H = 32;
export declare const ROUTE_CLEAR = 8;
export declare const LINE_SEP = 11;
export declare const JUNCTION_END = 14;
export declare const SHORT_LINK = 90;
export declare const BEND_CLEAR = 14;
type Pt = [number, number];
export interface Rect {
    x: number;
    y: number;
    w: number;
    h: number;
}
export interface InsideWire {
    from: string;
    to: string;
    route: Pt[];
}
export interface Circle {
    cx: number;
    cy: number;
    r: number;
}
export interface InsideScene {
    viewBox: [number, number, number, number];
    boundary: Circle;
    label: {
        text: string;
        textX: number;
        textY: number;
        box: Rect;
        squeeze: number | null;
    };
    boxes: Box[];
    wires: InsideWire[];
}
/** How far a rectangle sits inside a circle: the circle's radius less its farthest corner's
 *  distance from the centre (below 0, a corner is outside). */
export declare function rectInset(r: Rect, c: Circle): number;
/** How far a rectangle sits outside a circle: its nearest point's distance from the centre
 *  less the radius (below 0, it reaches inside). */
export declare function rectOutset(r: Rect, c: Circle): number;
/** Whether the segment p-q passes through the rectangle's inside (a touch is not a hit). */
export declare function segmentHitsRect(p: Pt, q: Pt, r: Rect): boolean;
/** The same from four numbers, for a search's hot path (system-map-circles-search.ts). */
export declare function hitsRect(px: number, py: number, qx: number, qy: number, r: Rect): boolean;
/** Whether the segment p-q passes through the box's inside, grown by `g`. */
export declare function segmentHitsBox(p: Pt, q: Pt, b: {
    x: number;
    y: number;
    w: number;
}, g?: number): boolean;
/** The distance from point p to segment a-b. */
export declare function pointSegDist(p: Pt, a: Pt, b: Pt): number;
/** Where segments a-b and c-d cross, or null. */
export declare function segmentCross(a: Pt, b: Pt, c: Pt, d: Pt): Pt | null;
/** The distance between two segments: 0 where they cross. */
export declare function segDist(a: Pt, b: Pt, c: Pt, d: Pt): number;
/** The angle between two segments' directions, 0 to 90 degrees. */
export declare function segAngle(a: Pt, b: Pt, c: Pt, d: Pt): number;
/** Whether two segments run side by side: nearly parallel, and one's span overlaps the other's. */
export declare function sideBySide(a: Pt, b: Pt, c: Pt, d: Pt): boolean;
/** What a route must keep, against the lines drawn before it. */
interface Drawn {
    segments: Array<[Pt, Pt]>;
    ends: [Pt, Pt];
    short: boolean;
    bends: Pt[];
}
/** Which rules a segment breaks: a box or the boundary's name, which no line may cross, and the
 *  softer rules a crowded core may leave no way to keep. `own` is the new line's two ports. */
export declare function segmentFaults(p: Pt, q: Pt, ends: readonly Box[], boxes: readonly Box[], label: Rect | null, drawn: readonly Drawn[], own?: readonly Pt[]): string[];
/** Each line's two ports: where it leaves each of its boxes, on the side facing the other end,
 *  the lines sharing a side spread evenly along it in the order of where each heads (its far
 *  end, or `toward`, the first point it was routed to), so lines leaving a side do not cross. */
export declare function portsOf(boxes: readonly Box[], pairs: ReadonlyArray<readonly [string, string]>, toward?: ReadonlyMap<string, Pt>): Map<string, Pt>;
/** Everything drawn inside the core: the circle and its name, the parts in and out of it,
 *  and every line between them, routed by the rules above. */
export declare function insideScene(containers: readonly MapContainer[], links: readonly MapLink[], layout: Layout, name?: string): InsideScene;
/** The flows a map can play: those whose every step runs along a line between two of the
 *  core's drawn parts, toward one of its ends, lighting only drawn parts. */
export declare function playableFlows(data: SystemMapData, core: MapSystem | undefined, layout?: Layout): MapFlow[];
export {};
