export interface SelectItem {
    kind: "option";
    value: string;
    label: string;
    disabled: boolean;
    selected: boolean;
}
export interface SelectGroup {
    kind: "group";
    label: string;
    disabled: boolean;
    items: SelectItem[];
}
export declare function readOptions(select: HTMLSelectElement): Array<SelectItem | SelectGroup>;
export declare function triggerText(select: HTMLSelectElement): {
    text: string;
    placeholder: boolean;
};
export interface SelectControl {
    readonly select: HTMLSelectElement;
    readonly trigger: HTMLButtonElement;
    readonly popup: HTMLElement;
    sync(): void;
    open(): void;
    close(): void;
    detach(): void;
}
export declare function selectControlFor(select: Element | null): SelectControl | undefined;
export declare function createSelect(wrap: HTMLElement, select: HTMLSelectElement): SelectControl;
export declare function enhance(root?: ParentNode): () => void;
