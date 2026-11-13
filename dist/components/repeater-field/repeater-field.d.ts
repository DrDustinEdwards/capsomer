export type Row = Record<string, string>;
export declare const rowFieldName: (name: string, index: number, key: string) => string;
export declare function rowsFromForm(form: FormData, name: string, keys: readonly string[]): Row[] | null;
export declare function moveRow<T>(list: readonly T[], from: number, to: number): T[];
export declare function changeText(change: "added" | "removed" | "up" | "down", label: string, now?: string): string;
