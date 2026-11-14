export interface SeriesPart {
    href: string;
    title: string;
}
export interface SeriesPlace<T = SeriesPart> {
    index: number;
    previous: T | undefined;
    next: T | undefined;
}
export declare function seriesPlace(parts: readonly SeriesPart[], current: string): SeriesPlace;
export declare function seriesPlace<T>(parts: readonly T[], current: string, keyOf: (part: T) => string): SeriesPlace<T>;
