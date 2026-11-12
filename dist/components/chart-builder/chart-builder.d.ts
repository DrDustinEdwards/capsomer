export interface ChartType {
    value: string;
    label: string;
}
export declare const CHART_TYPES: readonly ChartType[];
export interface ChartFields {
    type: string;
    x: string;
    y: readonly string[];
    title: string;
    alt: string;
    caption: string;
    csv: string;
}
export interface CsvColumn {
    name: string;
    numeric: boolean;
}
export declare function chooseColumns(columns: readonly CsvColumn[], current: {
    x: string;
    y: readonly string[];
}): {
    x: string;
    y: string[];
};
export declare function chartReady(f: Pick<ChartFields, "x" | "y" | "csv">): boolean;
export declare const MAX_CSV_BYTES: number;
export declare function csvFileProblem(file: {
    name: string;
    size: number;
    type: string;
}, maxBytes?: number): string | null;
export declare function chartDirective(f: ChartFields): string;
