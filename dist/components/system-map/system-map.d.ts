export { R, ringCells, layoutMap, spatialNext, linksOf, connectionText, modelMapData } from "./system-map-data.ts";
export type { ModelSystem, SystemModel, MapRing, MapSystem, MapLink, MapContainer, MapFlowStep, MapFlow, SystemMapData, SystemMapOptions, Cell, Layout, Direction } from "./system-map-data.ts";
export { ROUTE_CLEAR, LINE_SEP, JUNCTION_END, SHORT_LINK, BEND_CLEAR, rectInset, rectOutset, segmentHitsRect, segmentHitsBox, pointSegDist, segmentCross, segDist, segAngle, sideBySide, segmentFaults, portsOf, insideScene, playableFlows } from "./system-map-inside.ts";
export type { Rect, InsideWire, Circle, InsideScene } from "./system-map-inside.ts";
export { escapeHtml, hexPoints, seamRoute, systemMapHtml } from "./system-map-html.ts";
export type { Box } from "./system-map-html.ts";
/** The token's way along a drawn line: its corners from `start` toward `end`. A line starts and
 *  ends on its boxes' edges, so its two ends move `gap` along it, off the boxes. `forward` says
 *  the line was drawn from start to end. */
export declare function tokenRoute(route: string, forward: boolean, gap?: number): Array<[number, number]>;
/** Keyframes that move at one speed along a route. */
export declare function routeFrames(route: ReadonlyArray<[number, number]>): Array<{
    transform: string;
    offset: number;
}>;
/** The words a flow's step shows: where it is in the flow, then what happens. */
export declare function stepText(n: number, total: number, text: string): string;
export interface SystemMapController {
    select(id: string | null): void;
    enter(id?: string): void;
    leave(): void;
    setView(view: "shell" | "plain"): void;
    playFlow(id: string, step?: number): void;
    step(n: number): void;
    stopFlow(): void;
    destroy(): void;
}
export declare function controller(root: HTMLElement, openLabel?: string): SystemMapController;
export declare function enhance(root?: ParentNode): () => void;
