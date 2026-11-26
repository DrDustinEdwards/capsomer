export type MapRing = "core" | "shared" | "used";
export interface MapSystem {
    id: string;
    name: string;
    short?: string;
    ring: MapRing;
    private?: boolean;
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
    description?: string;
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
export interface ModelFlow {
    id: string;
    name: string;
    description?: string;
    steps: readonly {
        relationship: string;
        toward: string;
        text: string;
        lights?: readonly string[];
    }[];
}
export interface SystemModel {
    systems: readonly ModelSystem[];
    relationships: readonly (MapLink & {
        id?: string;
    })[];
    containers: readonly MapContainer[];
    flows?: readonly ModelFlow[];
}
/** What the map shows from the model, the same on every host. A step on a line the model lacks is left out. */
export declare function modelMapData(model: SystemModel, href?: (id: string) => string): SystemMapData;
export interface SystemMapOptions {
    id?: string;
    label?: string;
    caption?: string;
    ringNames?: Partial<Record<MapRing, string>>;
    headingLevel?: 2 | 3 | 4;
    system?: string;
    only?: "inside";
    flow?: {
        id: string;
        step: number;
    };
}
export declare const VERB: Readonly<Record<string, string>>;
export declare const verbOf: (kind: string) => string;
export declare const STORE_KINDS: ReadonlySet<string>;
export declare const EXTERNAL = "external";
export type PartPlace = "runs" | "stores" | "outside";
export declare const placeOf: (kind: string) => PartPlace;
export declare function ownerOf(data: SystemMapData): Map<string, string>;
export interface Tie {
    id: string;
    verbs: string[];
}
export interface Ties {
    uses: Tie[];
    usedBy: Tie[];
}
/** Each system's ties: what it uses and what uses it, each other system once with every verb. */
export declare function tiesOf(data: SystemMapData): Map<string, Ties>;
export interface ShownStep {
    text: string;
    toward: string;
    lights: string[];
}
export interface ShownFlow {
    id: string;
    name: string;
    description?: string;
    steps: ShownStep[];
}
/** The flows on one system's page: those with a step touching one of its parts. A step touching none is still told. */
export declare function flowsOver(data: SystemMapData, id: string): ShownFlow[];
export declare const count: (n: number, one: string, many?: string) => string;
export declare const stepText: (n: number, total: number) => string;
export type Lane = "left" | "middle" | "right";
export interface NetworkBlock {
    name: string;
    ring: MapRing;
    systems: MapSystem[];
}
export interface NetworkLane {
    lane: Lane;
    blocks: NetworkBlock[];
}
export declare function tiePairs(data: SystemMapData): [string, string][];
/** The network's lanes: left, middle (the shared packages) and right. Pure, so a server lays the
 * map out and the script only draws the wires. */
export declare function networkLayout(data: SystemMapData, names: Record<MapRing, string>): NetworkLane[];
export declare const ids: (v: string | undefined) => string[];
