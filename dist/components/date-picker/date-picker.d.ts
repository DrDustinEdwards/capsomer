export declare function parseDate(text: string): Date | null;
export declare const isoDate: (d: Date) => string;
export declare function addMonths(d: Date, n: number): Date;
export declare function moveDate(d: Date, key: string, shift?: boolean): Date | null;
export declare function wirePicker(group: HTMLElement): () => void;
export declare function enhance(root?: ParentNode): () => void;
