import { type Flag } from "./flag-list-model.ts";
export declare const part: <T extends HTMLElement = HTMLElement>(el: ParentNode, name: string) => T | null;
export declare function el<K extends keyof HTMLElementTagNameMap>(tag: K, className?: string, text?: string): HTMLElementTagNameMap[K];
export declare function readFlag(li: HTMLElement): Flag;
export declare function flagRows(root: ParentNode): HTMLElement[];
export declare function readFlags(root: ParentNode): Flag[];
export interface Ctx {
    owner: boolean;
    ownerName: string;
}
export declare function renderFlag(li: HTMLElement, ctx: Ctx): void;
