export declare function approveLabel(n: number, pending?: boolean): string;
export declare function titleText(n: number): string;
export interface GateChoice {
    id: string;
    comment: string;
}
export declare function selection(dialog: Element): GateChoice[];
export declare function isPending(dialog: Element): boolean;
export declare function update(dialog: Element): void;
export declare function setPending(dialog: Element, on: boolean): void;
export declare function setError(dialog: Element, message: string | null): void;
export interface ApproveDetail {
    gates: GateChoice[];
}
export declare function open(dialog: HTMLDialogElement, opener?: HTMLElement | null): void;
export declare function close(dialog: HTMLDialogElement): void;
export declare function enhance(root?: ParentNode): () => void;
