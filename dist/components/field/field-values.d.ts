export declare function dateFrom(year: number, month: number, day: number): Date | null;
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
export declare function toDateTimeLocal(date: Date | null | undefined, timeZone?: string): string;
export declare function fromDateTimeLocal(value: FormDataEntryValue | string | null | undefined, timeZone?: string): Date | null;
