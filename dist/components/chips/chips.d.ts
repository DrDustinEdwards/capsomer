export declare const EVENT = "cap:filter-change";
export interface FilterChangeDetail {
    param: string | null;
    values: string[];
}
export declare function valueOf(chip: HTMLElement): string;
export declare function pressedValues(group: Element): string[];
export declare function syncClear(group: Element): void;
export declare function ensureChips(group: Element, values: string[]): void;
export declare function setPressed(group: Element, values: string[]): void;
export declare function readParam(search: string, param: string): string[] | null;
export declare function writeParam(href: string, param: string, values: string[]): string;
export declare function setCount(group: Element, text: string): void;
export declare function toggle(group: HTMLElement, chip: HTMLElement): void;
export declare function clearAll(group: HTMLElement): void;
export declare function enhance(root?: ParentNode): () => void;
