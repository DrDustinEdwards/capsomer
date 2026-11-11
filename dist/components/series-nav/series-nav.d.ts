export interface SeriesPart {
    href: string;
    title: string;
}
export interface SeriesPlace {
    index: number;
    previous: SeriesPart | undefined;
    next: SeriesPart | undefined;
}
export declare function seriesPlace(parts: readonly SeriesPart[], current: string): SeriesPlace;
