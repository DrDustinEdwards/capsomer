export { countText, dateFrom, fromDateTimeLocal, keyValue, limitOf, revealedText, setRevealed, stepValue, toDateTimeLocal, } from "./field-values.ts";
export { setValue } from "./field-wire.ts";
export type Control = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
export declare function isControl(el: unknown): el is Control;
export declare function messageFor(control: Control): string;
export declare function groupOf(control: Control): Control[];
export declare function errorFor(control: Control): HTMLElement | null;
export declare function showError(control: Control, text: string, announce?: boolean): void;
export declare function clearError(control: Control): void;
export declare function validate(control: Control, announce?: boolean): boolean;
export declare function validateForm(form: HTMLFormElement): boolean;
export declare function checkDate(group: HTMLElement): void;
export declare function keepFocus({ key, skip, }?: {
    key?: string;
    skip?: () => boolean;
}): () => void;
export declare function enhance(root?: Element | Document | DocumentFragment): () => void;
