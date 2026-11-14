/** Joins class names, dropping the empty ones: `cn("cap-btn", busy && "is-busy")`. No merging. */
export declare function cn(...parts: Array<string | false | null | undefined>): string;
/** `n` held to `lo` to `hi`; where `hi` is under `lo`, `lo`. */
export declare function clamp(n: number, lo: number, hi: number): number;
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
