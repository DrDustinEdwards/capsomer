import { type Tone } from "../status/status.ts";
export interface GraphLine {
    tone: Exclude<Tone, "info">;
    text: string;
}
export interface GraphBox {
    id: string;
    label: string;
    href: string;
    lines?: readonly GraphLine[];
    sub?: string;
    ring?: boolean;
}
export interface GraphWire {
    from: string;
    to: string;
}
export interface GraphOptions {
    id: string;
    title: string;
    boxes: readonly GraphBox[];
    wires: readonly GraphWire[];
    ringLabel?: string;
    column?: number;
}
interface Point {
    x: number;
    y: number;
}
export declare function smoothPath(pts: readonly Point[]): string;
export declare function graphSvg(o: GraphOptions): string;
export {};
