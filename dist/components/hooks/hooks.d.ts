/** Joins class names, dropping the empty ones: `cn("cap-btn", busy && "is-busy")`. No merging. */
export declare function cn(...parts: Array<string | false | null | undefined>): string;
/** The element id a hash names: percent-decoded, or as written when it is not valid percent-encoding ("#%E0"). */
export declare function hashId(hash: string): string;
/** An address safe as an href: http(s) or a path on this site. A stored `javascript:` or `data:` address is not. */
export declare function linkable(href: unknown): href is string;
/** `n` held to `lo` to `hi`; where `hi` is under `lo`, `lo`. */
export declare function clamp(n: number, lo: number, hi: number): number;
/** Runs `attach` on every `[data-cap="name"]` under `root` (or `root`) not yet marked `data-cap-ready`; returns one detach function.
The root is the union type, not ParentNode: under @cloudflare/workers-types an HTMLFormElement is not a ParentNode. */
export declare function enhanceEach(root: ParentNode | Element | Document | DocumentFragment, name: string, attach: (el: HTMLElement) => (() => void) | void): () => void;
/** `addEventListener` that records how to take itself off again: push onto `undo`, run them all to detach. */
export declare function listenInto(undo: Array<() => void>): <E extends Event>(target: EventTarget, type: string, fn: (e: E) => void, opts?: boolean | AddEventListenerOptions) => void;
/** "A, B, and C" (and "A and B"; "A, B, or C" with "or"): the platform's own list, in American English with its serial comma. */
export declare function listText(words: readonly string[], join?: "and" | "or"): string;
/** The reader asks for reduced motion (false where there is no window: a server, a test). */
export declare function reducedMotion(): boolean;
/** A new id on every call, `prefix-1`, `prefix-2`: for a part a script gives an id to. */
export declare function uid(prefix: string): string;
export declare function readStored(key: string): string | null;
/** Stores a value (null forgets it) and tells every reader on the page. */
export declare function writeStored(key: string, value: string | null): void;
/** Calls `listener` when a stored value changes here or in another tab. */
export declare function subscribeStored(listener: () => void): () => void;
