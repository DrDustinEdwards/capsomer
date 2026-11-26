import type { MapSystem } from "./system-map-data.ts";
export type Axial = [number, number];
/**
 * The placement, searched (simulated annealing, Kirkpatrick, Gelatt and Vecchi 1983) from the
 * barycenter's start: the groups' order round the ring, the empty cells between them, each group's
 * order, the ring's turn, and the shared packages' order and turn, keeping whichever costs least.
 * The cost is the lines' total length in steps of the grid. Measured on the network's real lines
 * once routed, this also gave the fewest crossings and corners: adding a cost for straight lines
 * crossing made the routed lines longer and cross more, since a routed line does not run straight.
 * Many placements tie on length and differ in crossings, so hexLayout runs a few seeds and keeps
 * the one whose routed lines cross least. Seeded, so the same network always lays out the same way.
 */
export declare function search(place: Map<string, Axial>, net: {
    groups: MapSystem[][];
    shared: MapSystem[];
    outerRing: Axial[];
    sharedRing: Axial[];
    sharedStep: number;
    pairs: [string, string][];
}, seed: number): void;
