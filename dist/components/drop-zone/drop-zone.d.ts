export interface FileLike {
    name: string;
    type: string;
    size: number;
}
export interface DropRules {
    accept?: string;
    maxBytes?: number;
    maxFiles?: number;
}
export type RejectReason = "type" | "size" | "count";
export interface Rejection<F extends FileLike = File> {
    file: F;
    reason: RejectReason;
    message: string;
}
export interface Validation<F extends FileLike = File> {
    accepted: F[];
    rejected: Array<Rejection<F>>;
}
export declare function parseAccept(accept: string | null | undefined): string[];
export declare function matchesAccept(file: Pick<FileLike, "name" | "type">, accept: string | null | undefined): boolean;
export declare function acceptLabel(accept: string | null | undefined): string;
export declare function formatBytes(size: number): string;
export declare function rejectionMessage(file: FileLike, reason: RejectReason, rules: DropRules): string;
export declare function validateFiles<F extends FileLike>(files: Iterable<F> | ArrayLike<F>, rules?: DropRules): Validation<F>;
export declare function acceptedText(files: readonly FileLike[]): string;
export declare function rejectedLead(count: number): string;
export declare function dragHasFiles(e: Pick<DragEvent, "dataTransfer">): boolean;
export declare function setInputFiles(input: HTMLInputElement, files: readonly File[]): boolean;
export interface DropDetail {
    accepted: File[];
    rejected: Array<Rejection>;
}
export declare function rulesOf(zone: HTMLElement): DropRules;
export declare function acceptFiles(zone: HTMLElement, files: Iterable<File> | ArrayLike<File>, opts?: {
    fromInput?: boolean;
}): Validation;
export declare function attachDropZone(zone: HTMLElement): () => void;
export declare function enhance(root?: ParentNode): () => void;
