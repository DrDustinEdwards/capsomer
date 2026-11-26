import type { Direction } from "./media-grid.ts";
import type { MediaOptions } from "./media-bulk.ts";
export interface PanelHost {
    root: HTMLElement;
    inspector: HTMLDialogElement;
    options: Pick<MediaOptions, "save">;
    listen: (el: HTMLElement, type: string, fn: (e: never) => void) => void;
    modeOf: () => "pane" | "sheet";
    active: () => HTMLElement | null;
    setActive: (t: HTMLElement | null) => void;
    focusTile: (t: HTMLElement | null) => void;
    move: (from: HTMLElement, dir: Direction) => HTMLElement | null;
    openLink: (t: HTMLElement | null) => HTMLElement | null;
    syncRoving: () => void;
    saved: () => void;
    bin: (keys: string[]) => unknown;
    restore: (keys: string[]) => unknown;
}
export declare function createPanel(host: PanelHost): {
    open: (tile: HTMLElement, o: {
        focus: boolean;
    }) => void;
    close: (o?: {
        focus: boolean;
    }) => void;
    show: (tile: HTMLElement) => void;
    current: () => HTMLElement | null;
    follow: (tile: HTMLElement) => void;
    adopt: (tile: HTMLElement) => void;
    detach: () => void;
};
