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
/**
 * True for an Enter that confirms an IME conversion (Japanese, Chinese, Korean input) and must not submit or act.
 * `isComposing` covers Chrome and Firefox; `keyCode` 229 covers Safari, which fires `compositionend` before the
 * confirming keydown and so reports `isComposing` false (WebKit bug 165004). Only meaningful behind an Enter check:
 * a phone keyboard reports 229 for ordinary keys too. (Modern Web Guidance, ime-safe-enter-submit.)
 */
export declare function isImeEnter(e: Pick<KeyboardEvent, "key" | "isComposing" | "keyCode">): boolean;
export declare function isTyping(target: EventTarget | null): boolean;
export declare function fire(s: Shortcut, e: KeyboardEvent): boolean;
export declare function start(): void;
export declare function modifiedShortcutFor(e: KeyboardEvent): Shortcut | undefined;
export declare function stop(): void;
export declare function register(s: Shortcut): () => void;
export declare function registerKey(s: Shortcut): () => void;
export declare function list(): Shortcut[];
export declare function grouped(): Array<{
    group: string;
    items: Shortcut[];
}>;
export declare function capName(cap: string): string | undefined;
export declare function keyCaps(spec: string): string[];
export declare function keysFragment(key: string | string[]): DocumentFragment;
export declare function setSheetOpener(fn: (() => void) | null): void;
export declare function enhance(root?: ParentNode): () => void;
