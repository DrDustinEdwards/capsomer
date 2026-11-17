export type Params = Record<string, string | number | null | undefined>;
export declare function withParams(path: string, params: Params, defaults?: Params): string;
export declare function clearedHref(path: string, params: Params, keep?: readonly string[]): string;
export declare function isFiltered(params: Params, keys: readonly string[], defaults?: Params): boolean;
export declare const SEARCH_DELAY_MS = 300;
export declare function liveSubmit(form: HTMLFormElement, delay?: number): () => void;
export declare function enhance(root?: ParentNode): () => void;
