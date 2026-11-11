export declare const FINDS_HIDDEN: boolean;
export declare function readRemembered(key: string): string | null;
/** Keeps a choice; every tab set remembering the same key follows it. */
export declare function writeRemembered(key: string, value: string): void;
/** Calls back with each new choice made for `key`, on this page or in another window. */
export declare function onRemembered(key: string, fn: (value: string) => void): () => void;
export declare function guessPlatform(ua?: string): string | null;
/** A tab's value: its `data-value`, else the id of the panel it controls. */
export declare function tabValue(tab: HTMLElement): string;
/** The ?tab= value an address's query names, or null. */
export declare function tabParam(search: string, param?: string): string | null;
/** The address of a page tab: `path` with `search`'s other parameters and ?tab=id (none for the first tab). */
export declare function pageTabHref(path: string, search: string, id: string, firstId: string | undefined, param?: string): string;
/** Shows a panel, or hides it in the way this browser can still search (not the panel of a disabled tab). */
export declare function setPanelHidden(panel: HTMLElement, hide: boolean): void;
export type Orientation = "horizontal" | "vertical";
export type Activation = "automatic" | "manual";
export declare function nextTab(enabled: number[], current: number, key: string, orientation?: Orientation, rtl?: boolean): number | null;
export declare function tabsOf(root: HTMLElement): HTMLElement[];
export declare function panelsOf(root: HTMLElement): HTMLElement[];
export declare function panelOf(root: HTMLElement, tab: HTMLElement): HTMLElement | null;
export declare function select(root: HTMLElement, tab: HTMLElement, options?: {
    focus?: boolean;
    silent?: boolean;
}): boolean;
export declare function upgrade(root: HTMLElement): boolean;
export declare function attachPillDrag(list: HTMLElement, pick: (tab: HTMLElement) => void): () => void;
export declare function enhance(root?: ParentNode): () => void;
