export declare const FINDS_HIDDEN: boolean;
/** Shows a panel, or hides it in the way this browser can still search (not the panel of a disabled tab). */
export declare function setPanelHidden(panel: HTMLElement, hide: boolean): void;
export type Orientation = "horizontal" | "vertical";
export type Activation = "automatic" | "manual";
export declare function nextTab(enabled: number[], current: number, key: string, orientation?: Orientation, rtl?: boolean): number | null;
export declare function tabsOf(root: HTMLElement): HTMLElement[];
export declare function panelOf(root: HTMLElement, tab: HTMLElement): HTMLElement | null;
export declare function select(root: HTMLElement, tab: HTMLElement, options?: {
    focus?: boolean;
    silent?: boolean;
}): boolean;
export declare function enhance(root?: ParentNode): () => void;
