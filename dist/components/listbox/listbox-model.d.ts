export interface Searchable {
    label: string;
    group?: string;
    keywords?: readonly string[];
}
export declare function matchesQuery(c: Searchable, query: string): boolean;
export type Rank<T> = (item: T, needle: string) => number | null;
export declare function filterCommands<T extends Searchable>(items: readonly T[], query: string, rank?: Rank<T>): T[];
export declare function groupBy<T>(items: readonly T[], by?: (item: T) => string | undefined): Array<{
    group: string;
    items: T[];
}>;
export declare function step(index: number, by: number, count: number, wrap?: boolean): number;
export declare function stepEnabled(disabled: readonly boolean[], index: number, by: number, wrap?: boolean): number;
export declare const TYPEAHEAD_MS = 700;
export interface TypeaheadState {
    buffer: string;
    at: number;
}
export declare function nextTypeahead(state: TypeaheadState, key: string, now: number, labels: ReadonlyArray<string | null>, current: number, timeout?: number): {
    state: TypeaheadState;
    index: number;
};
export declare function resultsText(count: number): string;
export declare function emptyText(query: string): string;
