import { type Cell, type MapContainer, type SystemMapData, type SystemMapOptions } from "./system-map-data.ts";
export declare function escapeHtml(s: string): string;
export declare function hexPoints(x: number, y: number, r: number): string;
/** The walk along the seams from capsomer `a` to capsomer `b`, as the corners it passes.
 *  Neighbours share a side, and their line is that side. */
export declare function seamRoute(cells: readonly Cell[], a: Cell, b: Cell): Array<[number, number]>;
export interface Box {
    c: MapContainer;
    x: number;
    y: number;
    w: number;
}
/**
 * The whole map as HTML: the head with the view switch, the stage (the core, the inner
 * rings and the rim as three layers, the lines, and the inside), the detail line, and the
 * same data as a list, grouped by ring (or by group). Every text is escaped. Delivered with no script,
 * the drawing is a picture with a label and the list is open.
 */
export declare function systemMapHtml(data: SystemMapData, options?: SystemMapOptions): string;
