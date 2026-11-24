export type WireTest = (a: string, b: string) => boolean;
export interface Wires {
    light(test: WireTest | null): void;
}
/** Wires for the map under `host`, whose lanes are `lanes` (left to right as drawn); `signal` ends them. */
export declare function wires(host: HTMLElement, lanes: () => HTMLElement[], signal: AbortSignal): Wires;
