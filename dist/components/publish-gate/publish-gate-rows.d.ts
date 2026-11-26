import { type GateCheck, type GateSite, type GateState } from "./publish-gate-model.ts";
export declare const part: <T extends HTMLElement = HTMLElement>(el: ParentNode, name: string) => T | null;
export declare function h<K extends keyof HTMLElementTagNameMap>(tag: K, className?: string, text?: string): HTMLElementTagNameMap[K];
export declare const TONE: Record<GateState, "crit" | "info" | "ok">;
export declare function stateStatus(s: GateState): HTMLSpanElement;
export declare function readCheck(li: HTMLElement): GateCheck;
export declare function readSite(li: HTMLElement): GateSite;
export declare function renderCheck(li: HTMLElement, sites: HTMLElement[]): void;
export declare function renderActions(boxes: HTMLElement[], site: GateSite, state: GateState, isBusy: boolean, summaryId: string): void;
