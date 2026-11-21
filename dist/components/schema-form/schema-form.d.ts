export type FieldKind = "text" | "email" | "url" | "textarea" | "lines" | "date" | "datetime" | "number" | "money" | "checkbox" | "select" | "choice" | "multi" | "readonly" | "json";
export interface FieldOption {
    value: string;
    label: string;
}
export interface FieldSpec {
    key: string;
    label: string;
    kind: FieldKind | (string & {});
    help?: string;
    options?: FieldOption[];
    required?: boolean;
    wide?: boolean;
    placeholder?: string;
    min?: number;
    max?: number;
    timeZone?: string;
}
export interface SpecError {
    key: string;
    text: string;
}
export declare const specId: (key: string, prefix?: string) => string;
export declare function parseJsonField<T = unknown>(raw: FormDataEntryValue | null | undefined, valid?: (value: unknown) => value is T): T | null;
export declare function readSpec(form: FormData, spec: FieldSpec): {
    value: unknown;
    error?: string;
};
export declare function readSpecs(form: FormData, specs: readonly FieldSpec[]): {
    values: Record<string, unknown>;
    errors: SpecError[];
};
