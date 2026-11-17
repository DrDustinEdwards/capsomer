export declare const DEFAULT_CACHE = "kept-v1";
export interface KeepOptions {
    worker: string;
    scope: string;
    cache: string;
    page: string;
}
export declare function keepSupported(): boolean;
export declare function workerUrl(o: Pick<KeepOptions, "worker" | "cache">): string;
export declare function filesOfPage(page: string): string[];
export declare function isKept(o: KeepOptions): Promise<boolean>;
export declare function keep(o: KeepOptions): Promise<void>;
export declare function remove(o: KeepOptions): Promise<void>;
export declare function enhance(root?: ParentNode): () => void;
