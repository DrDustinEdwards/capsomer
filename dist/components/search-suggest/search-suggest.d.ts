export interface Suggestion {
    label: string;
    hint?: string;
    href: string;
}
export interface SuggestOptions {
    suggest: (query: string, signal: AbortSignal) => Promise<Suggestion[]>;
    go?: (href: string) => void;
    search?: (query: string) => void;
    delay?: number;
    min?: number;
    announce?: (count: number) => string;
}
export declare const SUGGEST_DELAY_MS = 180;
export declare const SUGGEST_MIN = 2;
export declare function suggestionsText(count: number): string;
/** Draws one suggestion as an option: its label, then its hint at the end. */
export declare function suggestionOption(s: Suggestion, id: string): HTMLElement;
/**
 * Wires one `.cap-search-suggest` around a search field. The list is the root's own
 * `[role="listbox"]`, or one made at its end. Returns a function that detaches.
 */
export declare function attachSuggest(root: HTMLElement, opts: SuggestOptions): () => void;
/** Attaches to every `[data-cap="search-suggest"]` under `root` not yet ready. */
export declare function enhance(opts: SuggestOptions, root?: ParentNode): () => void;
