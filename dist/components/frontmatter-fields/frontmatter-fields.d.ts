export type BoxKind = "line" | "text" | "list" | "lines" | "flag";
export interface FlagWords {
    on: string;
    off: string | null;
}
export interface FieldSpec {
    key: string;
    label?: string;
    box?: BoxKind;
    help?: string;
    wide?: boolean;
    flag?: FlagWords;
}
export interface TypedField {
    key: string;
    label: string;
    box: BoxKind;
    value: string;
    help?: string;
    wide: boolean;
    flag?: FlagWords;
    present: boolean;
    known: boolean;
}
export interface TypedFront {
    fields: TypedField[];
    rawOnly: string[];
}
export interface TypeOptions {
    extra?: "fields" | "text";
}
export declare const LIST_HINT = "Separated by commas.";
export declare const LINES_HINT = "One per line.";
export declare function shapeOf(lines: readonly string[]): BoxKind | null;
export declare function labelOf(key: string): string;
export declare function readBox(front: string | null, key: string, box: BoxKind, flag?: FlagWords): string;
export type ScalarStyle = "plain" | "number" | "double" | "single";
export declare function scalarRaw(value: string, style?: ScalarStyle): string;
export declare function writeBox(key: string, box: BoxKind, value: string, options?: {
    flag?: FlagWords;
    style?: ScalarStyle;
    keep?: boolean;
}): string[];
export declare function setBox(front: string, key: string, box: BoxKind, value: string, flag?: FlagWords, keep?: boolean): string;
export declare function typeFront(front: string | null, specs?: readonly FieldSpec[], options?: TypeOptions): TypedFront;
