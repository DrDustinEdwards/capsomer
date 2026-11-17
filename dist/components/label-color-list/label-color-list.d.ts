export type ColorLabel = {
    label: string;
    color: number;
};
export declare const COLOR_NAMES: readonly ["Purple", "Orange", "Teal", "Sage", "Indigo", "Pine", "Orchid", "Rust"];
export declare const COLORS: 8;
export declare const MAX_LABELS = 12;
export declare const MAX_LABEL_LENGTH = 40;
declare const SERIES: readonly [1, 2, 3, 4, 5, 6, 7, 8];
export declare function seriesOf(color: number): (typeof SERIES)[number];
export declare function colorLabels(...labels: string[]): ColorLabel[];
export declare function labelFor(labels: readonly ColorLabel[], value: string): ColorLabel | null;
export declare function cleanLabels(rows: ReadonlyArray<{
    label: string;
    color: string | number;
}>, { max, maxLength }?: {
    max?: number | undefined;
    maxLength?: number | undefined;
}): {
    ok: true;
    labels: ColorLabel[];
} | {
    ok: false;
    error: string;
};
export declare function editRows(labels: readonly ColorLabel[], { spare, max }?: {
    spare?: number | undefined;
    max?: number | undefined;
}): ColorLabel[];
export declare function rowsFromForm(labels: readonly unknown[], colors: readonly unknown[]): {
    label: string;
    color: string;
}[];
export {};
