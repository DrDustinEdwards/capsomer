export type MapRing = "core" | "shared" | "used";
export interface MapSystem {
    id: string;
    name: string;
    short?: string;
    ring: MapRing;
    private?: boolean;
    tag?: string;
    group?: string;
    description?: string;
    domain?: string;
    href?: string;
}
export interface MapLink {
    from: string;
    to: string;
    kind: string;
}
export interface MapContainer {
    id: string;
    system: string;
    name: string;
    kind: string;
    technology?: string;
}
export interface MapFlowStep {
    from: string;
    to: string;
    toward: string;
    text: string;
    lights?: readonly string[];
}
export interface MapFlow {
    id: string;
    name: string;
    description?: string;
    steps: readonly MapFlowStep[];
}
export interface SystemMapData {
    systems: readonly MapSystem[];
    relationships?: readonly MapLink[];
    containers?: readonly MapContainer[];
    flows?: readonly MapFlow[];
}
export interface ModelSystem {
    id: string;
    name: string;
    short?: string;
    ring: MapRing;
    private?: boolean;
    family: string;
    description?: string;
    domain?: string;
}
export interface SystemModel {
    systems: readonly ModelSystem[];
    relationships: readonly MapLink[];
    containers: readonly MapContainer[];
}
/**
 * What the map draws from Capsid's public model, the same on every host: each system with its
 * word and, for what people use, its group, every line, and the parts with their kind (the box
 * under a part's name is sized for a word). `href` is where a system's "Open" goes.
 */
export declare function modelMapData(model: SystemModel, href?: (id: string) => string): SystemMapData;
export interface SystemMapOptions {
    id?: string;
    label?: string;
    caption?: string;
    ringNames?: Partial<Record<MapRing, string>>;
    headingLevel?: 2 | 3 | 4 | 5 | 6;
    openLabel?: string;
    circles?: {
        layers?: Readonly<Record<string, string>>;
        src?: string;
        chosen?: string;
    };
}
export declare const R = 46;
export declare const LOOSE_KINDS: Set<string>;
export declare const STORE_KINDS: Set<string>;
export declare const EXTERNAL = "external";
export declare const BOX_W = 104;
export declare function ringCells(k: number): Array<[number, number]>;
export interface Cell {
    id: string | null;
    ring: number;
    x: number;
    y: number;
}
export interface Layout {
    cells: Cell[];
    rings: number;
    viewBox: [number, number, number, number];
    labels: Array<{
        text: string;
        x: number;
        y: number;
    }>;
    grouped: boolean;
}
/**
 * Places the systems: the first core system in the middle; shared parts from ring 1,
 * spilling outward if there are more than fit; what people use from the ring after the
 * last shared one, or in their groups when they have them (placeGroups). Ungrouped,
 * every cell of every ring up to the last filled one is drawn, the unused ones as empty
 * shell. Systems keep the order they are given in.
 */
export declare function layoutMap(systems: readonly MapSystem[]): Layout;
export type Direction = "up" | "down" | "left" | "right";
/** The capsomer an arrow key moves to: the nearest one within 60 degrees of the arrow's
 *  direction, preferring the straight line; null at the edge of the map. */
export declare function spatialNext(tiles: ReadonlyArray<{
    id: string;
    x: number;
    y: number;
}>, from: string, dir: Direction): string | null;
/** The lines a chosen capsomer shows: every relationship touching it whose other end is
 *  on the map. */
export declare function linksOf(links: readonly MapLink[], id: string, onMap: ReadonlySet<string>): MapLink[];
/** The words the detail line ends with. */
export declare function connectionText(n: number): string;
