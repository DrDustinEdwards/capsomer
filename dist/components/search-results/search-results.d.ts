export declare const MARK_OPEN = "\u0002";
export declare const MARK_CLOSE = "\u0003";
export interface SnippetPart {
    text: string;
    match: boolean;
}
export declare function snippetParts(snippet: string, open?: string, close?: string): SnippetPart[];
export declare function snippetHtml(snippet: string, open?: string, close?: string): string;
export declare function markQuery(text: string, query: string): string;
export declare function resultsText(count: number, options?: {
    more?: boolean;
    noun?: readonly [string, string];
}): string;
