export { modelMapData, networkLayout, tiePairs, tiesOf, flowsOver, ownerOf, placeOf, verbOf, count, stepText, VERB, STORE_KINDS, EXTERNAL } from "./system-map-data.ts";
export type { ModelSystem, SystemModel, MapRing, MapSystem, MapLink, MapContainer, MapFlowStep, MapFlow, SystemMapData, SystemMapOptions, Lane, NetworkBlock, NetworkLane, Tie, Ties, ShownFlow, ShownStep, PartPlace } from "./system-map-data.ts";
export { escapeHtml, systemMapHtml } from "./system-map-html.ts";
export { hexLayout } from "./system-map-hex.ts";
export type { HexCell, HexLayout } from "./system-map-hex.ts";
export interface SystemMapController {
    light(id: string | null): void;
    playFlow(id: string, step?: number): void;
    step(n: number): void;
    stopFlow(): void;
    destroy(): void;
}
/** The map's behavior on one root; `enhance` calls it for every map on the page. */
export declare function controller(root: HTMLElement): SystemMapController;
/** Enhances every system map under `root` not yet enhanced; returns a function that detaches them. */
export declare function enhance(root?: ParentNode): () => void;
