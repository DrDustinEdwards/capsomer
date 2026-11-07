import { filterCommands as filterItems, matchesQuery as matches, step as stepIndex } from "../listbox/listbox.ts";
export interface Command {
    id: string;
    label: string;
    group: string;
    keywords?: string[];
    shortcut?: string | string[];
    hint?: string;
    run: () => void;
}
export declare const STOP_GROUP = "Stop";
export declare const STOP_HINTS: {
    readonly reason: "asks a reason";
    readonly preview: "preview first";
};
export declare function stopCommand(o: {
    id: string;
    label: string;
    ask: keyof typeof STOP_HINTS;
    keywords?: string[];
    run: () => void;
}): Command;
export declare const matchesQuery: typeof matches;
export declare const filterCommands: typeof filterItems;
export declare const step: typeof stepIndex;
export declare function groupCommands<T extends {
    group: string;
}>(commands: T[]): Array<{
    group: string;
    items: T[];
}>;
export declare function emptyText(query: string): string;
export declare const SEARCHING = "Searching\u2026";
export interface MenuOptions {
    label?: string;
    placeholder?: string;
}
export declare function buildMenu(commands: Command[], opts?: MenuOptions): HTMLDialogElement;
export interface Attached {
    open: (query?: string, opener?: Element | null) => void;
    close: () => void;
    setActive: (index: number) => void;
    detach: () => void;
}
export declare function attach(dialog: HTMLDialogElement, run: (option: HTMLElement) => void): Attached;
export declare function openCommandMenu(query?: string): void;
export interface CommandMenu extends Attached {
    dialog: HTMLDialogElement;
}
export declare function createCommandMenu(commands: Command[], opts?: MenuOptions): CommandMenu;
export declare function enhance(root?: ParentNode): () => void;
