export declare function savedRaw(key: string): string;
export declare function savedIds(raw: string): string[];
export declare function isSaved(raw: string, id: string): boolean;
export declare function toggleSaved(key: string, id: string): boolean;
export declare function subscribeSaved(onChange: () => void): () => void;
export declare function paint(button: HTMLElement, saved: boolean): void;
export declare function enhance(root?: ParentNode): () => void;
