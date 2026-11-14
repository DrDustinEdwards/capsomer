export type Row = Record<string, string>;
export declare const rowFieldName: (name: string, index: number, key: string) => string;
export declare function rowsFromForm(form: FormData, name: string, keys: readonly string[]): Row[] | null;
