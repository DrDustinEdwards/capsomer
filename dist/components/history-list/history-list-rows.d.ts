import { type Destination, type HistoryEntry, type Run, type Sign } from "./history-list-model.ts";
type Attrs = Record<string, string | boolean | undefined>;
export declare function h<K extends keyof HTMLElementTagNameMap>(tag: K, attrs?: Attrs, ...kids: Array<Node | string | null>): HTMLElementTagNameMap[K];
export declare const SIGN_GLYPH: Record<Sign, string>;
export declare function destinationGlyph(s: Destination["status"]): string;
export declare function destinationTone(s: Destination["status"]): string;
export declare function statusEl(tone: string, glyph: string, word: string): HTMLElement;
export interface BuildOptions {
    prefix: string;
    current?: boolean;
    now?: number;
    versionHref?: string;
    loadHref?: string;
    readOnly?: boolean;
}
export declare function actionFor(e: HistoryEntry, now: number, o: BuildOptions): HTMLElement | null;
export declare function buildRow(e: HistoryEntry, delta: number | undefined, o: BuildOptions): HTMLLIElement;
export declare function buildRun(run: Run, deltas: (number | undefined)[], o: BuildOptions): HTMLLIElement[];
export {};
