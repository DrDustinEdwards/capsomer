/** Joins class names, dropping the empty ones: `cn("cap-btn", busy && "is-busy")`. No merging. */
export declare function cn(...parts: Array<string | false | null | undefined>): string;
export declare function readStored(key: string): string | null;
/** Stores a value (null forgets it) and tells every reader on the page. */
export declare function writeStored(key: string, value: string | null): void;
/** Calls `listener` when a stored value changes here or in another tab. */
export declare function subscribeStored(listener: () => void): () => void;
