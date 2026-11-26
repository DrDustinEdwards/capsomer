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
export declare function suggestionOption(s: Suggestion, id: string): HTMLElement;
export declare function attachSuggest(root: HTMLElement, opts: SuggestOptions): () => void;
export declare function enhance(opts: SuggestOptions, root?: ParentNode): () => void;
