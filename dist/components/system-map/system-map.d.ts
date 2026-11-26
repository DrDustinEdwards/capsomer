export { modelMapData, networkLayout, tiePairs, tiesOf, flowsOver, ownerOf, placeOf, verbOf, count, stepText, VERB, STORE_KINDS, EXTERNAL, } from "./system-map-data.ts";
export type { ModelSystem, SystemModel, MapRing, MapSystem, MapLink, MapContainer, MapFlowStep, MapFlow, SystemMapData, SystemMapOptions, Lane, NetworkBlock, NetworkLane, Tie, Ties, ShownFlow, ShownStep, PartPlace, } from "./system-map-data.ts";
export { systemMapHtml } from "./system-map-html.ts";
export { hexLayout } from "./system-map-hex.ts";
export type { HexCell, HexLayout } from "./system-map-hex.ts";
export interface SystemMapController {
    light(id: string | null): void;
    playFlow(id: string, step?: number): void;
    step(n: number): void;
    stopFlow(): void;
    destroy(): void;
}
export declare function controller(root: HTMLElement): SystemMapController;
export declare function enhance(root?: ParentNode): () => void;
