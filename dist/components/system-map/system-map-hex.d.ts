import type { MapSystem, SystemMapData } from "./system-map-data.ts";
type Axial = [number, number];
/** The cells of ring k around the center, in order around it. */
export declare function ringCells(k: number): Axial[];
export interface HexCell {
    id: string;
    at: Axial;
    x: number;
    y: number;
}
export interface HexLayout {
    cells: HexCell[];
    comb: Axial[];
    groups: {
        name: string;
        x: number;
        y: number;
    }[];
    lines: {
        a: string;
        b: string;
        d: string;
    }[];
    box: [number, number, number, number];
}
/**
 * Where each system stands in the honeycomb, and each tie's line. The core takes the middle (more
 * than one core: the first ring). The shared packages take every other cell of the smallest ring
 * with room for that, so lines pass between them. What people use takes the ring two out, each
 * group a run of cells with empty cells between groups, in the groups' order from twelve o'clock.
 * Then, by the barycenter idea on a circle, each shared package moves toward the systems that use
 * it and each system within its group toward the packages it uses, so lines run short.
 */
export declare function hexLayout(data: SystemMapData, groupOf: (s: MapSystem) => string): HexLayout;
/**
 * The honeycomb as an SVG string. Each system is a link (its full name as the link's name, its
 * short name as the text) carrying `data-id`, `data-ring` and, when private, `data-private`; each
 * line carries `data-a` and `data-b`. The comb, the lines and the group names are hidden from
 * assistive technology: the cells' links and the plain map hold the same ties as words.
 */
export declare function hexSvg(data: SystemMapData, layout: HexLayout, labelId: string): string;
export {};
