export type WireTest = (a: string, b: string) => boolean;
export interface Wires {
    light(test: WireTest | null): void;
    draw(): void;
    destroy(): void;
}
/**
 * Wires for the map under `host`, whose lanes are `lanes` (left to right as drawn). `selfSide`
 * picks the side a wire inside a lane bows out to.
 */
export declare function wires(host: HTMLElement, lanes: () => HTMLElement[], signal: AbortSignal): Wires;
