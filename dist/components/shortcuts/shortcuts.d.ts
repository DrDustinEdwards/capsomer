export interface Shortcut {
    key: string | string[];
    label: string;
    about?: string;
    group: string;
    run: (e: KeyboardEvent) => void;
    when?: () => boolean;
}
export declare const SINGLE_KEYS_PREF = "cap-single-keys";
export declare const SINGLE_KEYS_NOTE = "Turn these off if they clash with a screen reader or speech input. It applies at once. Shortcuts with Ctrl or \u2318 keep working.";
export declare const SEQUENCE_MS = 1200;
export declare function isMac(): boolean;
export declare function isSingleKey(spec: string): boolean;
export declare function singleKeysOn(): boolean;
export declare function singleKeysOff(): boolean;
export declare function setSingleKeys(on: boolean, opts?: {
    remember?: boolean;
}): void;
export declare function isTyping(target: EventTarget | null): boolean;
export declare function start(): void;
export declare function modifiedShortcutFor(e: KeyboardEvent): Shortcut | undefined;
export declare function stop(): void;
export declare function register(s: Shortcut): () => void;
export declare function list(): Shortcut[];
export declare function grouped(): Array<{
    group: string;
    items: Shortcut[];
}>;
export declare function capName(cap: string): string | undefined;
export declare function keyCaps(spec: string): string[];
export declare function keysFragment(key: string | string[]): DocumentFragment;
export declare function setSheetOpener(fn: (() => void) | null): void;
export declare function renderSheetList(container: HTMLElement): void;
export declare function buildSheet(): HTMLDialogElement;
export declare function wireSheet(sheet: HTMLDialogElement): () => void;
export declare function openShortcutSheet(opener?: Element | null): HTMLDialogElement;
export declare function enhance(root?: ParentNode): () => void;
