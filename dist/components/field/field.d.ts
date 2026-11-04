export type Control = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
export declare function isControl(el: unknown): el is Control;
export declare function messageFor(control: Control): string;
export declare function groupOf(control: Control): Control[];
export declare function errorFor(control: Control): HTMLElement | null;
export declare function showError(control: Control, text: string, announce?: boolean): void;
export declare function clearError(control: Control): void;
export declare function validate(control: Control, announce?: boolean): boolean;
export declare function validateForm(form: HTMLFormElement): boolean;
export declare function dateFrom(year: number, month: number, day: number): Date | null;
export declare function checkDate(group: HTMLElement): void;
export declare function setRevealed(input: HTMLInputElement, button: HTMLElement, shown: boolean): void;
export declare const revealedText: (shown: boolean) => string;
export declare function countText(value: string, limit: number, words?: boolean): {
    text: string;
    over: boolean;
};
export declare function limitOf(control: HTMLElement): {
    limit: number;
    words: boolean;
} | null;
export declare function stepValue(value: number, step: number, by: number, min?: number, max?: number): number;
export declare function keyValue(key: string, value: number, step: number, min?: number, max?: number): number | null;
export declare function setValue(input: HTMLInputElement, value: string): void;
export declare function enhance(root?: ParentNode): () => void;
