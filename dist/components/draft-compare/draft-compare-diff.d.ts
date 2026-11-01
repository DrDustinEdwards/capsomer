export type Op = "same" | "ins" | "del";
export interface WordPart {
    op: Op;
    text: string;
}
interface Token {
    text: string;
    lead: string;
}
export declare function tokenize(s: string): Token[];
export declare function countWords(s: string): number;
export interface DiffOptions {
    maxEdits?: number;
}
export declare function commonSubsequence(a: readonly string[], b: readonly string[], maxEdits?: number): Array<[number, number]> | null;
export declare function diffWords(a: string, b: string, options?: DiffOptions): WordPart[];
export interface Sentence {
    text: string;
    start: number;
    end: number;
    para: boolean;
}
export declare function splitSentences(text: string): Sentence[];
export type Entry = {
    op: "same";
    a: Sentence;
    b: Sentence;
} | {
    op: "change";
    a: Sentence;
    b: Sentence;
    parts: WordPart[];
} | {
    op: "del";
    a: Sentence;
    b?: undefined;
} | {
    op: "ins";
    b: Sentence;
    a?: undefined;
};
export interface SentenceOptions extends DiffOptions {
    similarity?: number;
}
export declare function diffSentences(a: string, b: string, options?: SentenceOptions): Entry[];
export interface Counts {
    added: number;
    removed: number;
    changes: number;
}
export interface Analysis {
    entries: Entry[];
    group: number[];
    perChange: Array<{
        added: number;
        removed: number;
    }>;
    counts: Counts;
    identical: boolean;
}
/** @deprecated The British spelling, kept so existing imports work; use `analyze`. */
export declare const analyse: (before: string, after: string, options?: SentenceOptions) => Analysis;
export declare function analyze(before: string, after: string, options?: SentenceOptions): Analysis;
export declare function countsText(c: Counts): string;
export {};
