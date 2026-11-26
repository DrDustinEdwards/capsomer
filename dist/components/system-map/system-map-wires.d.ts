export type WireTest = (a: string, b: string) => boolean;
export interface Wires {
    light(test: WireTest | null): void;
}
export declare function wires(host: HTMLElement, lanes: () => HTMLElement[], signal: AbortSignal): Wires;
