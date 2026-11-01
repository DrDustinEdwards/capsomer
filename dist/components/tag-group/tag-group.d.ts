export interface TagRemoved {
    value: string;
    label: string;
}
export declare function removeTag(group: HTMLElement, tag: HTMLElement): boolean;
export declare function enhance(root?: ParentNode): () => void;
