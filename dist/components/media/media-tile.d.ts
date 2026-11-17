import { type MediaRecord } from "./media-record.ts";
export declare function glyph(kind: "crit" | "warn" | "info" | "ok" | "nodata" | "running"): SVGSVGElement;
export declare const part: <T extends HTMLElement = HTMLElement>(root: ParentNode, name: string) => T | null;
export declare function recordOf(tile: HTMLElement): MediaRecord;
export declare function writeRecord(tile: HTMLElement, r: Partial<MediaRecord>): void;
export declare function syncTile(tile: HTMLElement): void;
export declare function buildTile(r: MediaRecord): HTMLLIElement;
