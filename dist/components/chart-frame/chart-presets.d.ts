export interface CountSeries {
    label: string;
    values: readonly number[];
}
export interface CountsByYearOptions {
    id: string;
    title: string;
    years: readonly number[];
    series: readonly CountSeries[];
    alt: string;
    selected?: readonly [number, number] | null;
    hrefForYear?: (year: number) => string;
    yLabel?: string;
    emptyText?: string;
    width?: number;
    height?: number;
}
export declare function countsByYearHtml(o: CountsByYearOptions): string;
export interface SparkOptions {
    x: readonly (string | number)[];
    values: readonly number[];
    name: string;
    alt: string;
    xLabel?: string;
}
export declare function sparkHtml(o: SparkOptions): string;
