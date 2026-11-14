export * from "./catalog-core.ts";
export declare function formHref(form: HTMLFormElement): string;
export declare function attachCatalog(form: HTMLFormElement): () => void;
export declare function enhance(root?: ParentNode): () => void;
